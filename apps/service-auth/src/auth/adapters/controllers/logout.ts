import { contentJson, OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';
import { z } from 'zod';

import { logout } from '~/auth/application/use-cases/logout';
import { RouteTag } from '~/utils';

import { getRedis, SessionRepository } from '../persistence';

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

    const sessionRepo = new SessionRepository(getRedis(c.env));
    await logout({ refreshToken }, sessionRepo);

    return c.status(204);
  }
}
