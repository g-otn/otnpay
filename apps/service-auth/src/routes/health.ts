import { contentJson, OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';
import { z } from 'zod';

import { AppEnv } from '~/types';
import { RouteTag } from '~/utils/constants';

export class HealthCheck extends OpenAPIRoute {
  schema = {
    responses: {
      '200': {
        description: 'Service is healthy',
        ...contentJson(
          z.object({
            status: z.string(),
            timestamp: z.string().datetime(),
            version: z.string(),
          })
        ),
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
