import { Elysia } from 'elysia';

import { RouteTag } from '~/utils/oas';

export const healthPlugin = new Elysia().get(
  '/health',
  () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }),
  {
    detail: {
      summary: 'Health check',
      tags: [RouteTag.System],
    },
  }
);
