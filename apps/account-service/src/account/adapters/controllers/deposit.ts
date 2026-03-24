import { timed } from '@otnpay/utils';
import { describeRoute } from 'hono-openapi';
import { resolver, validator } from 'hono-openapi/valibot';
import * as v from 'valibot';

import { AccountRepository } from '~/account/adapters/persistence/AccountRepository';
import { getDB } from '~/account/adapters/persistence/db';
import { deposit } from '~/account/application/use-cases/deposit';
import { AppEnv } from '~/types';
import { RouteTag } from '~/utils';
import {
  badRequestResponse,
  unauthorizedResponse,
  validationHook,
} from '~/utils/oas';
import { amountSchema } from '~/utils/schemas';

const depositBodySchema = v.object({ amount: amountSchema });

export const AccountDepositRoute = describeRoute({
  responses: {
    201: {
      content: {
        'application/json': {
          schema: resolver(v.object({ balance: v.string() })),
        },
      },
      description: 'Deposit successful',
    },
    ...badRequestResponse,
    ...unauthorizedResponse,
  },
  security: [{ bearerAuth: [] }],
  summary: 'Deposit funds into account',
  tags: [RouteTag.Account],
});

export const accountDepositValidator = validator(
  'json',
  depositBodySchema,
  validationHook
);

export const AccountDeposit = async (c: import('hono').Context<AppEnv>) => {
  const { amount } = c.req.valid('json' as never) as v.InferOutput<
    typeof depositBodySchema
  >;
  const userId = c.var.userId;

  const accountRepo = new AccountRepository(
    getDB(c.env.ACCOUNT_SERVICE_DB_URL, c.get('appName'))
  );

  const { balance } = await timed(
    `Deposit for user ${userId}`,
    deposit({ amount, userId }, accountRepo),
    c.var.logger
  );

  return c.json({ balance }, 201);
};
