import { timed } from '@otnpay/utils';
import { Elysia, status } from 'elysia';

import { AccountRepository } from '~/account/adapters/persistence/AccountRepository';
import { getDB } from '~/account/adapters/persistence/db';
import { withdraw } from '~/account/application/use-cases/withdraw';
import {
  AccountNotFoundError,
  InsufficientFundsError,
} from '~/account/domain/errors';
import { authPlugin } from '~/middleware/auth';
import { logger } from '~/middleware/logger';
import { SERVICE_NAME } from '~/utils/constants';
import {
  badRequestResponse,
  notFoundResponse,
  RouteTag,
  unauthorizedResponse,
} from '~/utils/oas';
import { withdrawRequestSchema } from '~/utils/schemas';

export const withdrawPlugin = new Elysia().use(authPlugin).post(
  '/accounts/withdraw',
  async ({ body, userId }) => {
    const { amount } = body;

    const accountRepo = new AccountRepository(
      getDB(Bun.env.ACCOUNT_SERVICE_DB_URL!, SERVICE_NAME)
    );

    try {
      const { balance } = await timed(
        `Withdraw for user ${userId}`,
        withdraw({ amount, userId }, accountRepo),
        logger
      );
      return { balance };
    } catch (e) {
      if (e instanceof AccountNotFoundError) {
        return status(404, { error: e.message });
      }
      if (e instanceof InsufficientFundsError) {
        return status(422, { error: e.message });
      }
      throw e;
    }
  },
  {
    body: withdrawRequestSchema,
    detail: {
      responses: {
        200: { description: 'Withdrawal successful' },
        422: { description: 'Insufficient funds' },
        ...badRequestResponse,
        ...unauthorizedResponse,
        ...notFoundResponse,
      },
      security: [{ bearerAuth: [] }],
      summary: 'Withdraw funds from account',
      tags: [RouteTag.Account],
    },
  }
);
