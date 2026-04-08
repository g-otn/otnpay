import { openapi } from '@elysiajs/openapi';
import { Elysia } from 'elysia';

import { loginPlugin } from '~/auth/adapters/controllers/login';
import { logoutPlugin } from '~/auth/adapters/controllers/logout';
import { refreshPlugin } from '~/auth/adapters/controllers/refresh';
import { signupPlugin } from '~/auth/adapters/controllers/signup';
import { log } from '~/middleware/logger';
import { healthPlugin } from '~/routes/health';

const app = new Elysia()
  .use(
    openapi({
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
        servers: [
          { description: 'Local server', url: 'http://localhost:9010' },
        ],
      },
    })
  )
  .onError(({ code, error }) => {
    if (code !== 'VALIDATION') {
      log.error(error, 'Unknown error during request');
      return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
  })
  .use(signupPlugin)
  .use(loginPlugin)
  .use(logoutPlugin)
  .use(refreshPlugin)
  .use(healthPlugin)
  .listen(9010);

console.log(`Auth service running at http://localhost:${app.server?.port}`);
