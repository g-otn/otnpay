import type { PostgresError } from 'postgres';

import { timed } from '@otnpay/utils';
import { contentJson, OpenAPIRoute } from 'chanfana';
import { DrizzleQueryError } from 'drizzle-orm';
import { Context } from 'hono';
import { z } from 'zod';

import { getDB } from '~/db';
import { users } from '~/db/schema';
import {
  badRequestResponse,
  ErrorSchema,
  passwordSchema,
} from '~/routes/schemas';
import { AppEnv } from '~/types';
import { RouteTag } from '~/utils/constants';
import { hashPassword } from '~/utils/password';

export class AuthSignup extends OpenAPIRoute {
  schema = {
    request: {
      body: contentJson(
        z.object({
          email: z.email(),
          owner_name: z.string().trim().min(2),
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
    const { email, owner_name, password } = data.body;

    const log = c.get('log');

    const db = getDB(c.env.AUTH_SERVICE_DB_URL, c.get('dbAppName'));

    let newUser: { id: number };
    try {
      const hashedPassword = await timed(
        'Hash password',
        hashPassword(password),
        log
      );
      [newUser] = await timed(
        'Create new user in DB',
        db
          .insert(users)
          .values({ email, owner_name, password: hashedPassword })
          .returning({ id: users.id }),
        log
      );
    } catch (error) {
      const isUniqueEmailViolation =
        error instanceof DrizzleQueryError &&
        (error.cause as PostgresError).code === '23505' &&
        (error.cause as PostgresError).constraint_name ===
          users.email.uniqueName;
      if (isUniqueEmailViolation) {
        return c.json({ error: 'Email already taken' }, 409);
      }
      c.get('log').error(error, 'Error while registering new user');
      throw error;
    }

    return c.json(
      {
        userId: newUser.id,
      },
      201
    );
  }
}
