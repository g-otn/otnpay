import { Redis } from '@upstash/redis/cloudflare';
import { contentJson, OpenAPIRoute } from 'chanfana';
import { owaspSymbols, passwordStrength } from 'check-password-strength';
import { Context } from 'hono';
import { z } from 'zod';

import { getDB } from '~/db';
import { user } from '~/db/schema';
import { badRequestResponse, ErrorSchema } from '~/routes/schemas';
import {
  getDBAppName,
  REFRESH_TOKEN_REDIS_TTL,
  RouteTag,
} from '~/utils/constants';
import { generateAccessToken } from '~/utils/jwt';
import { hashPassword } from '~/utils/password';
import { generateRefreshToken } from '~/utils/refreshToken';

const allowedPasswordChars = new Set(
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' +
    owaspSymbols
);

export class AuthSignup extends OpenAPIRoute {
  schema = {
    request: {
      body: contentJson(
        z.object({
          email: z.email(),
          owner_name: z.string().min(2),
          password: z
            .string()
            .min(8, { abort: true })
            .max(40, { abort: true })
            .refine(
              (p) => [...p].every((c) => allowedPasswordChars.has(c)),
              `Password may only contain letters, numbers, and symbols: ${owaspSymbols}`
            )
            .refine((p) => {
              return passwordStrength(p, undefined, owaspSymbols).id >= 3;
            }, 'Password must be strong: at least 12 characters containing uppercase, lowercase, numbers and symbols'),
        })
      ),
    },
    responses: {
      '201': {
        description: 'Account created',
      },
      '409': {
        description: 'Email or owner name already taken',
        ...contentJson(ErrorSchema),
      },
      ...badRequestResponse,
    },
    summary: 'Register a new account',
    tags: [RouteTag.Auth],
  };

  async handle(c: Context<{ Bindings: Cloudflare.Env }>) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { email, owner_name, password } = data.body;

    const db = getDB(
      c.env.AUTH_SERVICE_DB_URL,
      getDBAppName(c.get('requestId'), c.env.CF_VERSION_METADATA?.tag)
    );

    let account: typeof user.$inferSelect;
    try {
      const hashed = await hashPassword(password);
      [account] = await db
        .insert(user)
        .values({ email, owner_name, password: hashed })
        .returning();
    } catch (err) {
      const isUniqueViolation =
        err instanceof Error && err.message.includes('23505');
      if (isUniqueViolation) {
        return c.json({ error: 'Email or owner name already taken' }, 409);
      }
      throw err;
    }

    const accessToken = await generateAccessToken(
      account,
      c.env.AUTH_SERVICE_JWT_SECRET
    );
    const refreshToken = generateRefreshToken();

    const redis = new Redis({
      token: c.env.AUTH_SERVICE_REDIS_TOKEN,
      url: c.env.AUTH_SERVICE_REDIS_URL,
    });
    await redis.set(`refresh:${refreshToken}`, account.account_id, {
      ex: REFRESH_TOKEN_REDIS_TTL,
    });

    return c.json(
      { access_token: accessToken, refresh_token: refreshToken },
      201
    );
  }
}
