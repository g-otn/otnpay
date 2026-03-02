import { contentJson, OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';
import { z } from 'zod';

import { getRedis } from '~/redis';
import { RouteTag } from '~/utils/constants';

export class AuthLogout extends OpenAPIRoute {
  schema = {
    request: {
      body: contentJson(
        z.object({
          refreshToken: z.string(),
        })
      ),
    },
    responses: {
      '200': {
        description: 'Logged out',
      },
    },
    summary: 'Logout',
    tags: [RouteTag.Auth],
  };

  async handle(c: Context<{ Bindings: Cloudflare.Env }>) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { refreshToken } = data.body;

    // JWTs are stateless, so we can't revoke them.
    // However we can revoke the refresh token
    const redis = getRedis(c.env);
    await redis.del(`refresh:${refreshToken}`);

    return c.status(204);
  }
}
