import { passwordSchema } from '@otnpay/schemas';
import { timed } from '@otnpay/utils';
import { describeRoute } from 'hono-openapi';
import { resolver, validator } from 'hono-openapi/valibot';
import { HTTPException } from 'hono/http-exception';
import * as v from 'valibot';

import { getDB } from '~/auth/adapters/persistence/db';
import { UserRepository } from '~/auth/adapters/persistence/UserRepository';
import { signup } from '~/auth/application/use-cases/signup';
import { EmailAlreadyTakenError } from '~/auth/domain/errors';
import { AppEnv } from '~/types';
import {
  badRequestResponse,
  ErrorSchema,
  RouteTag,
  validationHook,
} from '~/utils/oas';

const signupBodySchema = v.object({
  email: v.pipe(v.string(), v.email()),
  ownerName: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(100)),
  password: passwordSchema,
});

export const AuthSignupRoute = describeRoute({
  responses: {
    201: {
      description: 'Account created',
    },
    409: {
      content: { 'application/json': { schema: resolver(ErrorSchema) } },
      description: 'Email or owner name already taken',
    },
    ...badRequestResponse,
  },
  summary: 'Register a new account',
  tags: [RouteTag.Auth],
});

export const authSignupValidator = validator(
  'json',
  signupBodySchema,
  validationHook
);

export const AuthSignup = async (c: import('hono').Context<AppEnv>) => {
  const { email, ownerName, password } = c.req.valid(
    'json' as never
  ) as v.InferOutput<typeof signupBodySchema>;

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
      throw new HTTPException(409, {
        res: Response.json({ error: e.message }, { status: 409 }),
      });
    }
    throw e;
  }
};
