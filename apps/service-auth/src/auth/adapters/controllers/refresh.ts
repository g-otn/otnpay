import { timed } from '@otnpay/utils';
import { Elysia, status } from 'elysia';
import * as v from 'valibot';

import { getDB } from '~/auth/adapters/persistence/db';
import { getRedis } from '~/auth/adapters/persistence/redis';
import { SessionRepository } from '~/auth/adapters/persistence/SessionRepository';
import { UserRepository } from '~/auth/adapters/persistence/UserRepository';
import { refresh } from '~/auth/application/use-cases/refresh';
import {
  InvalidRefreshTokenError,
  UserNotFoundError,
} from '~/auth/domain/errors';
import { Env } from '~/constants/env';
import { log } from '~/middleware/logger';
import { SERVICE_NAME } from '~/utils/constants';
import {
  badRequestResponse,
  RouteTag,
  unauthorizedResponse,
} from '~/utils/oas';

const refreshBodySchema = v.object({
  refreshToken: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
});

export const refreshPlugin = new Elysia().post(
  '/auth/refresh',
  async ({ body }) => {
    const { refreshToken } = body;

    const userRepo = new UserRepository(getDB(Env.DB_URL, SERVICE_NAME));
    const sessionRepo = new SessionRepository(getRedis());

    try {
      const { accessToken, refreshToken: newRefreshToken } = await timed(
        'Refresh token pair',
        refresh(
          { jwtSecret: Env.JWT_SECRET, refreshToken },
          userRepo,
          sessionRepo
        ),
        log
      );
      return { access_token: accessToken, refresh_token: newRefreshToken };
    } catch (e) {
      if (
        e instanceof InvalidRefreshTokenError ||
        e instanceof UserNotFoundError
      ) {
        return status(401, { error: e.message });
      }
      throw e;
    }
  },
  {
    body: refreshBodySchema,
    detail: {
      responses: {
        200: { description: 'New access and refresh tokens' },
        ...unauthorizedResponse,
        ...badRequestResponse,
      },
      summary: 'Exchange refresh token for new token pair',
      tags: [RouteTag.Auth],
    },
  }
);
