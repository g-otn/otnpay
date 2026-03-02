import { timed } from '@otnpay/utils';
import { contentJson, OpenAPIRoute } from 'chanfana';
import { eq } from 'drizzle-orm';
import { Context } from 'hono';
import { z } from 'zod';

import { getDB } from '~/db';
import { users } from '~/db/schema';
import { getRedis } from '~/redis';
import { badRequestResponse, unauthorizedResponse } from '~/routes/schemas';
import { AppEnv } from '~/types';
import { REFRESH_TOKEN_REDIS_TTL_SEC, RouteTag } from '~/utils/constants';
import { generateAccessToken } from '~/utils/jwt';
import { generateRefreshToken } from '~/utils/refreshToken';

export class AuthRefresh extends OpenAPIRoute {
  schema = {
    request: {
      body: contentJson(z.object({ refreshToken: z.string().min(1).max(50) })),
    },
    responses: {
      '200': {
        description: 'New access and refresh tokens',
        ...contentJson(
          z.object({ access_token: z.string(), refresh_token: z.string() })
        ),
      },
      ...unauthorizedResponse,
      ...badRequestResponse,
    },
    summary: 'Exchange refresh token for new token pair',
    tags: [RouteTag.Auth],
  };

  async handle(c: Context<AppEnv>) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { refreshToken } = data.body;
    const log = c.var.logger;

    const redis = getRedis(c.env);

    const [userId] = await timed(
      'Find and delete refresh token from Redis',
      Promise.all([
        redis.get<number>(`refresh:${refreshToken}`),
        redis.del(`refresh:${refreshToken}`),
      ]),
      log
    );

    if (!userId) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    const db = getDB(c.env.AUTH_SERVICE_DB_URL, c.get('dbAppName'));

    const [user] = await timed(
      `Getting existing user in DB with ID ${users.id}`,
      db
        .select({
          ownerName: users.owner_name,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),
      log
    );

    if (!user) {
      return c.json({ error: 'Account not found' }, 401);
    }

    const newRefreshToken = generateRefreshToken();
    const [newAccessToken] = await Promise.all([
      generateAccessToken(
        { ownerName: user.ownerName, userId },
        c.env.AUTH_SERVICE_JWT_SECRET
      ),
      timed(
        `Set new refresh token in Redis for user ${userId}`,
        redis.set(`refresh:${newRefreshToken}`, userId, {
          ex: REFRESH_TOKEN_REDIS_TTL_SEC,
        }),
        log
      ),
    ]);
    return c.json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    });
  }
}
