import { Scalar } from '@scalar/hono-api-reference';
import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import { pinoLogger } from 'hono-pino';
import { createHandler as debugLog } from 'hono-pino/debug-log';
import { HTTPException } from 'hono/http-exception';
import { prettyJSON } from 'hono/pretty-json';
import { requestId } from 'hono/request-id';
import { nanoid } from 'nanoid';
import pino from 'pino';

import { AccountDeposit } from '~/account/adapters/controllers/deposit';
import { AccountGetBalance } from '~/account/adapters/controllers/getBalance';
import { AccountWithdraw } from '~/account/adapters/controllers/withdraw';
import { appName, auth } from '~/middleware';
import { HealthCheck } from '~/routes/health';
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
  // Chanfana errors arrive as HTTPException with the formatted response attached
  if (error.constructor.name === 'HTTPException') {
    // Return chanfana's standard error format (e.g validation errors)
    return (error as HTTPException).getResponse();
  }

  c.var.logger.error(error, 'Unknown error during request');
  return c.json({ error: 'Internal server error' }, 500);
});

// Protect all /accounts/* routes with JWT auth
app.use('/accounts/*', auth);

const openapi = fromHono(app, {
  docs_url: null,
  openapi_url: '/doc',
  schema: {
    info: {
      title: 'otnpay Account Service',
      version: '1.0.0',
    },
  },
});

openapi.post('/accounts/deposit', AccountDeposit);
openapi.post('/accounts/withdraw', AccountWithdraw);
openapi.get('/accounts/balance', AccountGetBalance);

openapi.get('/health', HealthCheck);

app.get(
  '/scalar',
  Scalar({
    expandAllModelSections: true,
    expandAllResponses: true,
    servers: [{ description: 'Local server', url: 'http://localhost:9510' }],
    url: '/doc',
  })
);

openapi.registry.registerComponent('securitySchemes', 'bearerAuth', {
  bearerFormat: 'JWT',
  description: 'Access token received from auth service login endpoint',
  scheme: 'bearer',
  type: 'http',
});

export default app;
