import { timed } from '@otnpay/utils';
import { describeRoute } from 'hono-openapi';
import { resolver } from 'hono-openapi/valibot';
import * as v from 'valibot';

import { AccountRepository } from '~/account/adapters/persistence/AccountRepository';
import { getDB } from '~/account/adapters/persistence/db';
import { getBalance } from '~/account/application/use-cases/getBalance';
import { AccountNotFoundError } from '~/account/domain/errors';
import { AppEnv } from '~/types';
import { RouteTag } from '~/utils';
import { notFoundResponse, unauthorizedResponse } from '~/utils/oas';

export const AccountGetBalanceRoute = describeRoute({
  responses: {
    200: {
      content: {
        'application/json': {
          schema: resolver(
            v.object({ balance: v.string(), user_id: v.number() })
          ),
        },
      },
      description: 'Account balance',
    },
    ...unauthorizedResponse,
    ...notFoundResponse,
  },
  security: [{ bearerAuth: [] }],
  summary: 'Get account balance',
  tags: [RouteTag.Account],
});

export const AccountGetBalance = async (c: import('hono').Context<AppEnv>) => {
  const userId = c.var.userId;

  const accountRepo = new AccountRepository(
    getDB(c.env.ACCOUNT_SERVICE_DB_URL, c.get('appName'))
  );

  try {
    const result = await timed(
      `Get balance for user ${userId}`,
      getBalance({ userId }, accountRepo),
      c.var.logger
    );
    return c.json(result);
  } catch (e) {
    if (e instanceof AccountNotFoundError) {
      return c.json({ error: e.message }, 404);
    }
    throw e;
  }
};
