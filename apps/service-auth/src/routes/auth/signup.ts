import type { PostgresError } from 'postgres';

import { contentJson, OpenAPIRoute } from 'chanfana';
import { owaspSymbols, passwordStrength } from 'check-password-strength';
import { DrizzleQueryError } from 'drizzle-orm';
import { Context } from 'hono';
import { z } from 'zod';

import { getDB } from '~/db';
import { users } from '~/db/schema';
import { badRequestResponse, ErrorSchema } from '~/routes/schemas';
import { getDBAppName, RouteTag } from '~/utils/constants';
import { hashPassword } from '~/utils/password';

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

    let newUser: { id: number };
    try {
      const hashed = await hashPassword(password);
      [newUser] = await db
        .insert(users)
        .values({ email, owner_name, password: hashed })
        .returning({ id: users.id });
    } catch (error) {
      console.log('error', error);
      const isUniqueEmailViolation =
        error instanceof DrizzleQueryError &&
        (error.cause as PostgresError).code === '23505' &&
        (error.cause as PostgresError).constraint_name ===
          users.email.uniqueName;
      if (isUniqueEmailViolation) {
        return c.json({ error: 'Email already taken' }, 409);
      }
      throw error;
    }

    return c.json(
      {
        userId: newUser.id,
      },
      201
    );
  }
}
