import { timed } from '@otnpay/utils';
import { contentJson, OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';
import { z } from 'zod';

import { getDB } from '~/auth/adapters/persistence/db';
import { UserRepository } from '~/auth/adapters/persistence/UserRepository';
import { signup } from '~/auth/application/use-cases/signup';
import { EmailAlreadyTakenError } from '~/auth/domain/errors';
import { AppEnv } from '~/types';
import { RouteTag } from '~/utils';
import { badRequestResponse, ErrorSchema } from '~/utils/oas';
import { passwordSchema } from '~/utils/schemas';

export class AuthSignup extends OpenAPIRoute {
  schema = {
    request: {
      body: contentJson(
        z.object({
          email: z.email(),
          ownerName: z.string().trim().min(2).max(100),
          password: passwordSchema,
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

  async handle(c: Context<AppEnv>) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { email, ownerName, password } = data.body;

    const userRepo = new UserRepository(
      getDB(c.env.AUTH_SERVICE_DB_URL, c.get('appName'))
    );

    try {
      const result = await timed(
        `Signup user ${email}`,
        signup({ email, ownerName, password }, userRepo),
        c.var.logger
      );
      return c.json(result, 201);
    } catch (e) {
      if (e instanceof EmailAlreadyTakenError) {
        c.var.logger.info(`Email ${email} already taken`);
        return c.json({ error: e.message }, 409);
      }
      throw e;
    }
  }
}
