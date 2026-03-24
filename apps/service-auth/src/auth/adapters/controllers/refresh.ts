import { timed } from '@otnpay/utils';
import { describeRoute } from 'hono-openapi';
import { resolver, validator } from 'hono-openapi/valibot';
import { HTTPException } from 'hono/http-exception';
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
import { AppEnv } from '~/types';
import {
  badRequestResponse,
  RouteTag,
  unauthorizedResponse,
  validationHook,
} from '~/utils/oas';

const refreshBodySchema = v.object({
  refreshToken: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
});

export const AuthRefreshRoute = describeRoute({
  responses: {
    200: {
      content: {
        'application/json': {
          schema: resolver(
            v.object({ access_token: v.string(), refresh_token: v.string() })
          ),
        },
      },
      description: 'New access and refresh tokens',
    },
    ...unauthorizedResponse,
    ...badRequestResponse,
  },
  summary: 'Exchange refresh token for new token pair',
  tags: [RouteTag.Auth],
});

export const authRefreshValidator = validator(
  'json',
  refreshBodySchema,
  validationHook
);

export const AuthRefresh = async (c: import('hono').Context<AppEnv>) => {
  const { refreshToken } = c.req.valid('json' as never) as v.InferOutput<
    typeof refreshBodySchema
  >;

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
      throw new HTTPException(401, {
        res: Response.json({ error: e.message }, { status: 401 }),
      });
    }
    throw e;
  }
};
