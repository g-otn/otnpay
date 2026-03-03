import { timed } from '@otnpay/utils';
import { contentJson, OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';
import { z } from 'zod';

import { AccountRepository } from '~/account/adapters/persistence/AccountRepository';
import { getDB } from '~/account/adapters/persistence/db';
import { deposit } from '~/account/application/use-cases/deposit';
import { AppEnv } from '~/types';
import { RouteTag } from '~/utils';
import { badRequestResponse, unauthorizedResponse } from '~/utils/oas';
import { amountSchema } from '~/utils/schemas';

export class AccountDeposit extends OpenAPIRoute {
  schema = {
    request: {
      body: contentJson(z.object({ amount: amountSchema })),
    },
    responses: {
      '201': {
        description: 'Deposit successful',
        ...contentJson(z.object({ balance: z.string() })),
      },
      ...badRequestResponse,
      ...unauthorizedResponse,
    },
    security: [{ bearerAuth: [] }],
    summary: 'Deposit funds into account',
    tags: [RouteTag.Account],
  };

  async handle(c: Context<AppEnv>) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { amount } = data.body;
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
  }
}
