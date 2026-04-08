import { timed } from '@otnpay/utils';
import { Elysia, status } from 'elysia';

import { AccountRepository } from '~/account/adapters/persistence/AccountRepository';
import { getDB } from '~/account/adapters/persistence/db';
import { getBalance } from '~/account/application/use-cases/getBalance';
import { AccountNotFoundError } from '~/account/domain/errors';
import { authPlugin } from '~/middleware/auth';
import { logger } from '~/middleware/logger';
import { SERVICE_NAME } from '~/utils/constants';
import { notFoundResponse, RouteTag, unauthorizedResponse } from '~/utils/oas';

export const getBalancePlugin = new Elysia().use(authPlugin).get(
  '/accounts/balance',
  async ({ userId }) => {
    const accountRepo = new AccountRepository(
      getDB(Bun.env.ACCOUNT_SERVICE_DB_URL!, SERVICE_NAME)
    );

    try {
      return await timed(
        `Get balance for user ${userId}`,
        getBalance({ userId }, accountRepo),
        logger
      );
    } catch (e) {
      if (e instanceof AccountNotFoundError) {
        return status(404, { error: e.message });
      }
      throw e;
    }
  },
  {
    detail: {
      responses: {
        200: { description: 'Account balance' },
        ...unauthorizedResponse,
        ...notFoundResponse,
      },
      security: [{ bearerAuth: [] }],
      summary: 'Get account balance',
      tags: [RouteTag.Account],
    },
  }
);
