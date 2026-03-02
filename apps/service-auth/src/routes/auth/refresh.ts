import { Redis } from '@upstash/redis/cloudflare';
import { contentJson, OpenAPIRoute } from 'chanfana';
import { eq } from 'drizzle-orm';
import { Context } from 'hono';
import { z } from 'zod';

import { getDB } from '~/db';
import { user } from '~/db/schema';
import { badRequestResponse, unauthorizedResponse } from '~/routes/schemas';
import {
  getDBAppName,
  REFRESH_TOKEN_REDIS_TTL,
  RouteTag,
} from '~/utils/constants';
import { generateAccessToken } from '~/utils/jwt';
import { generateRefreshToken } from '~/utils/refreshToken';

export class AuthRefresh extends OpenAPIRoute {
  schema = {
    request: {
      body: contentJson(z.object({ refresh_token: z.string().min(1) })),
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
    summary: 'Exchange refresh token for new access and refresh tokens',
    tags: [RouteTag.Auth],
  };

  async handle(c: Context<{ Bindings: Cloudflare.Env }>) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { refresh_token: refreshToken } = data.body;
    const redis = new Redis({
      token: c.env.AUTH_SERVICE_REDIS_TOKEN,
      url: c.env.AUTH_SERVICE_REDIS_URL,
    });
    const [accountId] = await Promise.all([
      redis.get<number>(`refresh:${refreshToken}`),
      redis.del(`refresh:${refreshToken}`),
    ]);
    if (!accountId) {
      return c.json({ error: 'Token revoked' }, 401);
    }
    const db = getDB(
      c.env.AUTH_SERVICE_DB_URL,
      getDBAppName(c.get('requestId'), c.env.CF_VERSION_METADATA?.tag)
    );
    const [account] = await db
      .select({ account_id: user.account_id, owner_name: user.owner_name })
      .from(user)
      .where(eq(user.account_id, accountId))
      .limit(1);
    if (!account) {
      return c.json({ error: 'Account not found' }, 401);
    }
    const newRefreshToken = generateRefreshToken();
    const [newAccessToken] = await Promise.all([
      generateAccessToken(account, c.env.AUTH_SERVICE_JWT_SECRET),
      redis.set(`refresh:${newRefreshToken}`, account.account_id, {
        ex: REFRESH_TOKEN_REDIS_TTL,
      }),
    ]);
    return c.json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    });
  }
}
