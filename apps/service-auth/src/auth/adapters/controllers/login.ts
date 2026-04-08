import { passwordSchema } from '@otnpay/schemas';
import { timed } from '@otnpay/utils';
import { Elysia, status } from 'elysia';
import * as v from 'valibot';

import { getDB } from '~/auth/adapters/persistence/db';
import { getRedis } from '~/auth/adapters/persistence/redis';
import { SessionRepository } from '~/auth/adapters/persistence/SessionRepository';
import { UserRepository } from '~/auth/adapters/persistence/UserRepository';
import { login } from '~/auth/application/use-cases/login';
import { InvalidCredentialsError } from '~/auth/domain/errors';
import { Env } from '~/constants/env';
import { log } from '~/middleware/logger';
import { SERVICE_NAME } from '~/utils/constants';
import {
  badRequestResponse,
  RouteTag,
  unauthorizedResponse,
} from '~/utils/oas';

const loginBodySchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: passwordSchema,
});

export const loginPlugin = new Elysia().post(
  '/auth/login',
  async ({ body }) => {
    const { email, password } = body;

    const userRepo = new UserRepository(getDB(Env.DB_URL, SERVICE_NAME));
    const sessionRepo = new SessionRepository(getRedis());

    try {
      const { accessToken, refreshToken } = await timed(
        `Login user ${email}`,
        login(
          { email, jwtSecret: Env.JWT_SECRET, password },
          userRepo,
          sessionRepo
        ),
        log
      );
      return { access_token: accessToken, refresh_token: refreshToken };
    } catch (e) {
      if (e instanceof InvalidCredentialsError) {
        return status(401, { error: e.message });
      }
      throw e;
    }
  },
  {
    body: loginBodySchema,
    detail: {
      responses: {
        200: { description: 'Access and refresh tokens' },
        ...badRequestResponse,
        ...unauthorizedResponse,
      },
      summary: 'Login with email and password',
      tags: [RouteTag.Auth],
    },
  }
);
