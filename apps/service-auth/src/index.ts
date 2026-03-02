import { Scalar } from '@scalar/hono-api-reference';
import { ApiException, fromHono, InputValidationException } from 'chanfana';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { prettyJSON } from 'hono/pretty-json';
import { requestId } from 'hono/request-id';
import { nanoid } from 'nanoid';

import { dbAppName } from '~/middleware/dbAppName';
import { loggerMiddleware } from '~/middleware/logger';
import { AuthLogin } from '~/routes/auth/login';
import { AuthLogout } from '~/routes/auth/logout';
import { AuthRefresh } from '~/routes/auth/refresh';
import { AuthSignup } from '~/routes/auth/signup';
import { HealthCheck } from '~/routes/health';
import { AppEnv } from '~/types';

const app = new Hono<AppEnv>();

app.use(requestId({ generator: () => nanoid(8) }));
app.use(loggerMiddleware);
app.use(prettyJSON());
app.use(dbAppName);
app.notFound((c) => c.json({ message: 'Not found', ok: false }, 404));
app.onError((error, c) => {
  // Chanfana errors arrive as HTTPException with the formatted response attached
  if (error.constructor.name === 'HTTPException') {
    // Return chanfana's standard error format (e.g validation errors)
    return (error as HTTPException).getResponse();
  }

  c.get('log').error(error, 'Unknown error during request');
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

app.get(
  '/scalar',
  Scalar({
    expandAllModelSections: true,
    expandAllResponses: true,
    servers: [
      { description: 'Local server', url: 'http://localhost:9010' },
      {
        description: 'Deployed server',
        url: 'https://otnpay-auth-service.g0tn.workers.dev',
      },
    ],
    url: '/doc',
  })
);

openapi.registry.registerComponent('securitySchemes', 'bearerAuth', {
  bearerFormat: 'JWT',
  description: 'Access token received from login or refresh endpoints',
  scheme: 'bearer',
  type: 'http',
});

export default app;
