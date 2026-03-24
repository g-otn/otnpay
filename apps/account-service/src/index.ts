import { Scalar } from '@scalar/hono-api-reference';
import { Hono } from 'hono';
import { openAPISpecs } from 'hono-openapi';
import { pinoLogger } from 'hono-pino';
import { createHandler as debugLog } from 'hono-pino/debug-log';
import { HTTPException } from 'hono/http-exception';
import { prettyJSON } from 'hono/pretty-json';
import { requestId } from 'hono/request-id';
import { nanoid } from 'nanoid';
import pino from 'pino';

import {
  AccountDeposit,
  AccountDepositRoute,
  accountDepositValidator,
} from '~/account/adapters/controllers/deposit';
import {
  AccountGetBalance,
  AccountGetBalanceRoute,
} from '~/account/adapters/controllers/getBalance';
import {
  AccountWithdraw,
  AccountWithdrawRoute,
  accountWithdrawValidator,
} from '~/account/adapters/controllers/withdraw';
import { appName, auth } from '~/middleware';
import { HealthCheck, HealthCheckRoute } from '~/routes/health';
import { AppEnv } from '~/types';

const app = new Hono<AppEnv>();

app.use(requestId({ generator: () => nanoid(8) }));
app.use(
  pinoLogger({
    pino: {
      base: null,
      browser: {
        write: debugLog(),
      },
      level: 'debug',
      timestamp: pino.stdTimeFunctions.epochTime,
    },
  })
);
app.use(prettyJSON());
app.use(appName);

app.notFound((c) => c.json({ message: 'Not found', ok: false }, 404));
app.onError((error, c) => {
  if (error.constructor.name === 'HTTPException') {
    return (error as HTTPException).getResponse();
  }

  c.var.logger.error(error, 'Unknown error during request');
  return c.json({ error: 'Internal server error' }, 500);
});

// Protect all /accounts/* routes with JWT auth
app.use('/accounts/*', auth);

app.post(
  '/accounts/deposit',
  AccountDepositRoute,
  accountDepositValidator,
  AccountDeposit
);
app.post(
  '/accounts/withdraw',
  AccountWithdrawRoute,
  accountWithdrawValidator,
  AccountWithdraw
);
app.get('/accounts/balance', AccountGetBalanceRoute, AccountGetBalance);

app.get('/health', HealthCheckRoute, HealthCheck);

const accountServers = [
  { description: 'Local server', url: 'http://localhost:9510' },
  {
    description: 'Deployed server',
    url: 'https://otnpay-account-service.g0tn.workers.dev',
  },
];

app.get(
  '/doc',
  openAPISpecs(app, {
    documentation: {
      components: {
        securitySchemes: {
          bearerAuth: {
            bearerFormat: 'JWT',
            description:
              'Access token received from auth service login endpoint',
            scheme: 'bearer',
            type: 'http',
          },
        },
      },
      info: {
        title: 'otnpay Account Service',
        version: '1.0.0',
      },
      openapi: '3.0.0',
      servers: accountServers,
    },
  })
);

app.get('/scalar', (c, next) => {
  const isDev = new URL(c.req.url).hostname === 'localhost';
  return Scalar<AppEnv>({
    expandAllModelSections: true,
    expandAllResponses: true,
    servers: isDev ? accountServers : [...accountServers].reverse(),
    url: '/doc',
  })(c, next);
});

export default app;
