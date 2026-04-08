import { timed } from '@otnpay/utils';
import { Elysia } from 'elysia';

import { AccountRepository } from '~/account/adapters/persistence/AccountRepository';
import { getDB } from '~/account/adapters/persistence/db';
import { deposit } from '~/account/application/use-cases/deposit';
import { authPlugin } from '~/middleware/auth';
import { logger } from '~/middleware/logger';
import { SERVICE_NAME } from '~/utils/constants';
import {
  badRequestResponse,
  RouteTag,
  unauthorizedResponse,
} from '~/utils/oas';
import { depositRequestSchema } from '~/utils/schemas';

export const depositPlugin = new Elysia().use(authPlugin).post(
  '/accounts/deposit',
  async ({ body, userId }) => {
    const { amount } = body;

    const accountRepo = new AccountRepository(
      getDB(Bun.env.ACCOUNT_SERVICE_DB_URL!, SERVICE_NAME)
    );

    const { balance } = await timed(
      `Deposit for user ${userId}`,
      deposit({ amount, userId }, accountRepo),
      logger
    );

    return new Response(JSON.stringify({ balance }), { status: 201 });
  },
  {
    body: depositRequestSchema,
    detail: {
      responses: {
        201: { description: 'Deposit successful' },
        ...badRequestResponse,
        ...unauthorizedResponse,
      },
      security: [{ bearerAuth: [] }],
      summary: 'Deposit funds into account',
      tags: [RouteTag.Account],
    },
  }
);
