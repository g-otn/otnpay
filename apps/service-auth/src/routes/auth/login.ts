import { timed } from '@otnpay/utils';
import { contentJson, OpenAPIRoute } from 'chanfana';
import { eq } from 'drizzle-orm';
import { Context } from 'hono';
import { z } from 'zod';

import { getDB } from '~/db';
import { users } from '~/db/schema';
import { getRedis } from '~/redis';
import {
  badRequestResponse,
  passwordSchema,
  unauthorizedResponse,
} from '~/routes/schemas';
import { AppEnv } from '~/types';
import { REFRESH_TOKEN_REDIS_TTL_SEC, RouteTag } from '~/utils/constants';
import { generateAccessToken } from '~/utils/jwt';
import { verifyPassword } from '~/utils/password';
import { generateRefreshToken } from '~/utils/refreshToken';

export class AuthLogin extends OpenAPIRoute {
  schema = {
    request: {
      body: contentJson(
        z.object({
          email: z.email(),
          password: passwordSchema,
        })
      ),
    },
    responses: {
      '200': {
        description: 'Access and refresh tokens',
        ...contentJson(
          z.object({ access_token: z.string(), refresh_token: z.string() })
        ),
      },
      ...badRequestResponse,
      ...unauthorizedResponse,
    },
    summary: 'Login with email and password',
    tags: [RouteTag.Auth],
  };

  async handle(c: Context<AppEnv>) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { email, password } = data.body;
    const log = c.var.logger;

    const db = getDB(c.env.AUTH_SERVICE_DB_URL, c.get('dbAppName'));
    const [user] = await timed(
      `Check existing user in DB with email ${email}`,
      db
        .select({
          id: users.id,
          ownerName: users.owner_name,
          password: users.password,
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1),
      log
    );

    if (!user || !(await verifyPassword(user.password, password))) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const accessToken = await generateAccessToken(
      { ownerName: user.ownerName, userId: user.id },
      c.env.AUTH_SERVICE_JWT_SECRET
    );
    const refreshToken = generateRefreshToken();

    const redis = getRedis(c.env);

    await timed(
      `Store refresh token in Redis for user ${user.id}`,
      redis.set(`refresh:${refreshToken}`, user.id, {
        ex: REFRESH_TOKEN_REDIS_TTL_SEC,
      }),
      log
    );

    return c.json({ access_token: accessToken, refresh_token: refreshToken });
  }
}
