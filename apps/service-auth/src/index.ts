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

import { AuthLogin } from '~/auth/adapters/controllers/login';
import { AuthLogout } from '~/auth/adapters/controllers/logout';
import { AuthRefresh } from '~/auth/adapters/controllers/refresh';
import { AuthSignup } from '~/auth/adapters/controllers/signup';
import { appName } from '~/middleware/appName';
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

const openapi = fromHono(app, {
  docs_url: null,
  openapi_url: '/doc',
  schema: {
    info: {
      title: 'otnpay Auth Service',
      version: '1.0.0',
    },
  },
});

openapi.post('/auth/signup', AuthSignup);
openapi.post('/auth/login', AuthLogin);
openapi.post('/auth/logout', AuthLogout);
openapi.post('/auth/refresh', AuthRefresh);

openapi.get('/health', HealthCheck);

const authServers = [
  { description: 'Local server', url: 'http://localhost:9010' },
  {
    description: 'Deployed server',
    url: 'https://otnpay-auth-service.g0tn.workers.dev',
  },
];

app.get('/scalar', (c) => {
  const isDev = new URL(c.req.url).hostname === 'localhost';
  return Scalar({
    expandAllModelSections: true,
    expandAllResponses: true,
    servers: isDev ? authServers : [...authServers].reverse(),
    url: '/doc',
  })(c);
});

openapi.registry.registerComponent('securitySchemes', 'bearerAuth', {
  bearerFormat: 'JWT',
  description: 'Access token received from login or refresh endpoints',
  scheme: 'bearer',
  type: 'http',
});

export default app;
