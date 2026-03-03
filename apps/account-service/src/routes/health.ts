import { OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';

import { AppEnv } from '~/types';
import { RouteTag } from '~/utils';

export class HealthCheck extends OpenAPIRoute {
  schema = {
    responses: {
      '200': {
        description: 'Service is healthy',
      },
    },
    summary: 'Health check',
    tags: [RouteTag.System],
  };

  handle(c: Context<AppEnv>) {
    const meta = c.env.CF_VERSION_METADATA;
    return c.json({
      requestId: c.get('requestId'),
      status: 'ok',
      timestamp: new Date().toISOString(),
      versionId: meta?.id,
      versionTag: meta?.tag,
    });
  }
}
