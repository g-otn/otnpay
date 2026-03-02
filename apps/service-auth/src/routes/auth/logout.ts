import { Redis } from '@upstash/redis/cloudflare';
import { OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';

import { commonAuthenticatedEndpointResponses } from '~/routes/schemas';
import { RouteTag } from '~/utils/constants';

export class AuthLogout extends OpenAPIRoute {
  schema = {
    responses: {
      '200': {
        description: 'Logged out',
      },
      ...commonAuthenticatedEndpointResponses,
    },
    summary: 'Logout and revoke refresh token',
    tags: [RouteTag.Auth],
  };

  async handle(c: Context<{ Bindings: Cloudflare.Env }>) {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing token' }, 401);
    }
    const refreshToken = authHeader.slice(7);

    const redis = new Redis({
      token: c.env.AUTH_SERVICE_REDIS_TOKEN,
      url: c.env.AUTH_SERVICE_REDIS_URL,
    });
    await redis.del(`refresh:${refreshToken}`);

    return c.json({ message: 'Logged out' });
  }
}
