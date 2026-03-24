import { passwordSchema } from '@otnpay/schemas';
import { timed } from '@otnpay/utils';
import { describeRoute } from 'hono-openapi';
import { resolver, validator } from 'hono-openapi/valibot';
import { HTTPException } from 'hono/http-exception';
import * as v from 'valibot';

import { getDB } from '~/auth/adapters/persistence/db';
import { getRedis } from '~/auth/adapters/persistence/redis';
import { SessionRepository } from '~/auth/adapters/persistence/SessionRepository';
import { UserRepository } from '~/auth/adapters/persistence/UserRepository';
import { login } from '~/auth/application/use-cases/login';
import { InvalidCredentialsError } from '~/auth/domain/errors';
import { AppEnv } from '~/types';
import {
  badRequestResponse,
  RouteTag,
  unauthorizedResponse,
  validationHook,
} from '~/utils/oas';

const loginBodySchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: passwordSchema,
});

export const AuthLoginRoute = describeRoute({
  responses: {
    200: {
      content: {
        'application/json': {
          schema: resolver(
            v.object({ access_token: v.string(), refresh_token: v.string() })
          ),
        },
      },
      description: 'Access and refresh tokens',
    },
    ...badRequestResponse,
    ...unauthorizedResponse,
  },
  summary: 'Login with email and password',
  tags: [RouteTag.Auth],
});

export const authLoginValidator = validator(
  'json',
  loginBodySchema,
  validationHook
);

export const AuthLogin = async (c: import('hono').Context<AppEnv>) => {
  const { email, password } = c.req.valid('json' as never) as v.InferOutput<
    typeof loginBodySchema
  >;

  const userRepo = new UserRepository(
    getDB(c.env.AUTH_SERVICE_DB_URL, c.get('appName'))
  );
  const sessionRepo = new SessionRepository(getRedis(c.env));

  try {
    const { accessToken, refreshToken } = await timed(
      `Login user ${email}`,
      login(
        { email, jwtSecret: c.env.AUTH_SERVICE_JWT_SECRET, password },
        userRepo,
        sessionRepo
      ),
      c.var.logger
    );
    return c.json({ access_token: accessToken, refresh_token: refreshToken });
  } catch (e) {
    if (e instanceof InvalidCredentialsError) {
      throw new HTTPException(401, {
        res: Response.json({ error: e.message }, { status: 401 }),
      });
    }
    throw e;
  }
};
