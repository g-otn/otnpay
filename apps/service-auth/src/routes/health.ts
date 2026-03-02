import { OpenAPIRoute, contentJson } from 'chanfana';
import { Context } from 'hono';
import { z } from 'zod';
import { RouteTag } from '~/utils/constants';

export class HealthCheck extends OpenAPIRoute {
  schema = {
    tags: [RouteTag.System],
    summary: 'Health check',
    responses: {
      '200': {
        description: 'Service is healthy',
        ...contentJson(
          z.object({
            status: z.string(),
            version: z.string(),
            timestamp: z.string().datetime(),
          })
        ),
      },
    },
  };

  handle(c: Context<{ Bindings: Cloudflare.Env }>) {
    const meta = c.env.CF_VERSION_METADATA;
    return c.json({
      status: 'ok',
      versionId: meta?.id ?? 'dev',
      versionTag: meta?.tag ?? 'dev',
      timestamp: new Date().toISOString(),
    });
  }
}
