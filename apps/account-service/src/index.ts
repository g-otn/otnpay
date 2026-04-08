import { openapi } from '@elysiajs/openapi';
import { Elysia } from 'elysia';

import { depositPlugin } from '~/account/adapters/controllers/deposit';
import { getBalancePlugin } from '~/account/adapters/controllers/getBalance';
import { withdrawPlugin } from '~/account/adapters/controllers/withdraw';
import { logger } from '~/middleware/logger';
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
        servers: [
          { description: 'Local server', url: 'http://localhost:9510' },
        ],
      },
    })
  )
  // .onError(({ code, error }) => {
  //   if (code !== 'VALIDATION') {
  //     logger.error(error, 'Unknown error during request');
  //     return Response.json({ error: 'Internal server error' }, { status: 500 });
  //   }
  // })
  .use(depositPlugin)
  .use(withdrawPlugin)
  .use(getBalancePlugin)
  .use(healthPlugin)
  .listen(9510);

console.log(`Account service running at http://localhost:${app.server?.port}`);
