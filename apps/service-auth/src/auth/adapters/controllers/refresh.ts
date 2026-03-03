import { timed } from '@otnpay/utils';
import { contentJson, OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';
import { z } from 'zod';

import { getDB } from '~/auth/adapters/persistence/db';
import { getRedis } from '~/auth/adapters/persistence/redis';
import { SessionRepository } from '~/auth/adapters/persistence/SessionRepository';
import { UserRepository } from '~/auth/adapters/persistence/UserRepository';
import { refresh } from '~/auth/application/use-cases/refresh';
import {
  InvalidRefreshTokenError,
  UserNotFoundError,
} from '~/auth/domain/errors';
import { AppEnv } from '~/types';
import { RouteTag } from '~/utils';
import { badRequestResponse, unauthorizedResponse } from '~/utils/oas';

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

    const userRepo = new UserRepository(
      getDB(c.env.AUTH_SERVICE_DB_URL, c.get('appName'))
    );
    const sessionRepo = new SessionRepository(getRedis(c.env));

    try {
      const { accessToken, refreshToken: newRefreshToken } = await timed(
        'Refresh token pair',
        refresh(
          { jwtSecret: c.env.AUTH_SERVICE_JWT_SECRET, refreshToken },
          userRepo,
          sessionRepo
        ),
        c.var.logger
      );
      return c.json({
        access_token: accessToken,
        refresh_token: newRefreshToken,
      });
    } catch (e) {
      if (
        e instanceof InvalidRefreshTokenError ||
        e instanceof UserNotFoundError
      ) {
        return c.json({ error: e.message }, 401);
      }
      throw e;
    }
  }
}
