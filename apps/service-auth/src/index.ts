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
  AuthLogin,
  AuthLoginRoute,
  authLoginValidator,
} from '~/auth/adapters/controllers/login';
import {
  AuthLogout,
  AuthLogoutRoute,
  authLogoutValidator,
} from '~/auth/adapters/controllers/logout';
import {
  AuthRefresh,
  AuthRefreshRoute,
  authRefreshValidator,
} from '~/auth/adapters/controllers/refresh';
import {
  AuthSignup,
  AuthSignupRoute,
  authSignupValidator,
} from '~/auth/adapters/controllers/signup';
import { appName } from '~/middleware/appName';
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

app.post('/auth/signup', AuthSignupRoute, authSignupValidator, AuthSignup);
app.post('/auth/login', AuthLoginRoute, authLoginValidator, AuthLogin);
app.post('/auth/logout', AuthLogoutRoute, authLogoutValidator, AuthLogout);
app.post('/auth/refresh', AuthRefreshRoute, authRefreshValidator, AuthRefresh);

app.get('/health', HealthCheckRoute, HealthCheck);

const authServers = [
  { description: 'Local server', url: 'http://localhost:9010' },
  {
    description: 'Deployed server',
    url: 'https://otnpay-auth-service.g0tn.workers.dev',
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
              'Access token received from login or refresh endpoints',
            scheme: 'bearer',
            type: 'http',
          },
        },
      },
      info: {
        title: 'otnpay Auth Service',
        version: '1.0.0',
      },
      openapi: '3.0.0',
      servers: authServers,
    },
  })
);

app.get('/scalar', (c, next) => {
  const isDev = new URL(c.req.url).hostname === 'localhost';
  return Scalar<AppEnv>({
    expandAllModelSections: true,
    expandAllResponses: true,
    servers: isDev ? authServers : [...authServers].reverse(),
    url: '/doc',
  })(c, next);
});

export default app;
