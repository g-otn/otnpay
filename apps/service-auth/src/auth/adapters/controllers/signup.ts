import { passwordSchema } from '@otnpay/schemas';
import { timed } from '@otnpay/utils';
import { Elysia, status } from 'elysia';
import * as v from 'valibot';

import { getDB } from '~/auth/adapters/persistence/db';
import { UserRepository } from '~/auth/adapters/persistence/UserRepository';
import { signup } from '~/auth/application/use-cases/signup';
import { EmailAlreadyTakenError } from '~/auth/domain/errors';
import { Env } from '~/constants/env';
import { log } from '~/middleware/logger';
import { SERVICE_NAME } from '~/utils/constants';
import { badRequestResponse, RouteTag } from '~/utils/oas';

const signupBodySchema = v.object({
  email: v.pipe(v.string(), v.email()),
  ownerName: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(100)),
  password: passwordSchema,
});

export const signupPlugin = new Elysia().post(
  '/auth/signup',
  async ({ body }) => {
    const { email, ownerName, password } = body;

    const userRepo = new UserRepository(getDB(Env.DB_URL, SERVICE_NAME));

    try {
      await timed(
        `Signup user ${email}`,
        signup({ email, ownerName, password }, userRepo),
        log
      );
      return new Response(null, { status: 201 });
    } catch (e) {
      if (e instanceof EmailAlreadyTakenError) {
        log.info(`Email ${email} already taken`);
        return status(409, { error: e.message });
      }
      throw e;
    }
  },
  {
    body: signupBodySchema,
    detail: {
      responses: {
        201: { description: 'Account created' },
        409: { description: 'Email already taken' },
        ...badRequestResponse,
      },
      summary: 'Register a new account',
      tags: [RouteTag.Auth],
    },
  }
);
