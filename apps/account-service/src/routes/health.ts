import { Context } from 'hono';
import { describeRoute } from 'hono-openapi';

import { AppEnv } from '~/types';
import { RouteTag } from '~/utils';

export const HealthCheckRoute = describeRoute({
  responses: {
    200: {
      description: 'Service is healthy',
    },
  },
  summary: 'Health check',
  tags: [RouteTag.System],
});

export const HealthCheck = (c: Context<AppEnv>) => {
  const meta = c.env.CF_VERSION_METADATA;
  return c.json({
    requestId: c.get('requestId'),
    status: 'ok',
    timestamp: new Date().toISOString(),
    versionId: meta?.id,
    versionTag: meta?.tag,
  });
};
