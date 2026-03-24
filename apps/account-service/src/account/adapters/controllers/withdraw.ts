import { timed } from '@otnpay/utils';
import { describeRoute } from 'hono-openapi';
import { resolver, validator } from 'hono-openapi/valibot';
import * as v from 'valibot';

import { AccountRepository } from '~/account/adapters/persistence/AccountRepository';
import { getDB } from '~/account/adapters/persistence/db';
import { withdraw } from '~/account/application/use-cases/withdraw';
import {
  AccountNotFoundError,
  InsufficientFundsError,
} from '~/account/domain/errors';
import { AppEnv } from '~/types';
import { RouteTag } from '~/utils';
import {
  badRequestResponse,
  ErrorSchema,
  notFoundResponse,
  unauthorizedResponse,
  validationHook,
} from '~/utils/oas';
import { amountSchema } from '~/utils/schemas';

const withdrawBodySchema = v.object({ amount: amountSchema });

export const AccountWithdrawRoute = describeRoute({
  responses: {
    200: {
      content: {
        'application/json': {
          schema: resolver(v.object({ balance: v.string() })),
        },
      },
      description: 'Withdrawal successful',
    },
    ...badRequestResponse,
    ...unauthorizedResponse,
    ...notFoundResponse,
    422: {
      content: { 'application/json': { schema: resolver(ErrorSchema) } },
      description: 'Insufficient funds',
    },
  },
  security: [{ bearerAuth: [] }],
  summary: 'Withdraw funds from account',
  tags: [RouteTag.Account],
});

export const accountWithdrawValidator = validator(
  'json',
  withdrawBodySchema,
  validationHook
);

export const AccountWithdraw = async (c: import('hono').Context<AppEnv>) => {
  const { amount } = c.req.valid('json' as never) as v.InferOutput<
    typeof withdrawBodySchema
  >;
  const userId = c.var.userId;

  const accountRepo = new AccountRepository(
    getDB(c.env.ACCOUNT_SERVICE_DB_URL, c.get('appName'))
  );

  try {
    const { balance } = await timed(
      `Withdraw for user ${userId}`,
      withdraw({ amount, userId }, accountRepo),
      c.var.logger
    );
    return c.json({ balance });
  } catch (e) {
    if (e instanceof AccountNotFoundError) {
      return c.json({ error: e.message }, 404);
    }
    if (e instanceof InsufficientFundsError) {
      return c.json({ error: e.message }, 422);
    }
    throw e;
  }
};
