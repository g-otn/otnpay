import { Redis } from '@upstash/redis/cloudflare';
import { OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';
import { RouteTag } from '~/utils/constants';
import { commonAuthenticatedEndpointResponses } from '~/routes/schemas';

export class AuthLogout extends OpenAPIRoute {
  schema = {
    tags: [RouteTag.Auth],
    summary: 'Logout and revoke refresh token',
    responses: {
      '200': {
        description: 'Logged out',
      },
      ...commonAuthenticatedEndpointResponses,
    },
  };

  async handle(c: Context<{ Bindings: Cloudflare.Env }>) {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing token' }, 401);
    }
    const refreshToken = authHeader.slice(7);

    const redis = new Redis({
      url: c.env.AUTH_SERVICE_REDIS_URL,
      token: c.env.AUTH_SERVICE_REDIS_TOKEN,
    });
    await redis.del(`refresh:${refreshToken}`);

    return c.json({ message: 'Logged out' });
  }
}
