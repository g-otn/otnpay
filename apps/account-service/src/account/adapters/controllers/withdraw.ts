import { timed } from '@otnpay/utils';
import { contentJson, OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';
import { z } from 'zod';

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
  notFoundResponse,
  unauthorizedResponse,
} from '~/utils/oas';
import { amountSchema } from '~/utils/schemas';

export class AccountWithdraw extends OpenAPIRoute {
  schema = {
    request: {
      body: contentJson(z.object({ amount: amountSchema })),
    },
    responses: {
      '200': {
        description: 'Withdrawal successful',
        ...contentJson(z.object({ balance: z.string() })),
      },
      ...badRequestResponse,
      ...unauthorizedResponse,
      ...notFoundResponse,
      '422': {
        description: 'Insufficient funds',
        ...contentJson(z.object({ error: z.string() })),
      },
    },
    security: [{ bearerAuth: [] }],
    summary: 'Withdraw funds from account',
    tags: [RouteTag.Account],
  };

  async handle(c: Context<AppEnv>) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { amount } = data.body;
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
  }
}
