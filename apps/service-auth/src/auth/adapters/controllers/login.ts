import { passwordSchema } from '@otnpay/schemas';
import { timed } from '@otnpay/utils';
import { contentJson, OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';
import { z } from 'zod';

import { getDB } from '~/auth/adapters/persistence/db';
import { getRedis } from '~/auth/adapters/persistence/redis';
import { SessionRepository } from '~/auth/adapters/persistence/SessionRepository';
import { UserRepository } from '~/auth/adapters/persistence/UserRepository';
import { login } from '~/auth/application/use-cases/login';
import { InvalidCredentialsError } from '~/auth/domain/errors';
import { AppEnv } from '~/types';
import { RouteTag } from '~/utils';
import { badRequestResponse, unauthorizedResponse } from '~/utils/oas';

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
        return c.json({ error: e.message }, 401);
      }
      throw e;
    }
  }
}
