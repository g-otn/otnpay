import { Scalar } from '@scalar/hono-api-reference';
import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { requestId } from 'hono/request-id';

import { AuthLogin } from '~/routes/auth/login';
import { AuthLogout } from '~/routes/auth/logout';
import { AuthRefresh } from '~/routes/auth/refresh';
import { AuthSignup } from '~/routes/auth/signup';
import { HealthCheck } from '~/routes/health';

const app = new Hono<{ Bindings: Cloudflare.Env }>();

app.use(logger());
app.use(requestId());
app.use(prettyJSON());
app.notFound((c) => c.json({ message: 'Not found', ok: false }, 404));
app.onError((err, c) => {
  console.error('Error during request:', err);
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
