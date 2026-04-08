import { Elysia } from 'elysia';
import * as v from 'valibot';

import { getRedis } from '~/auth/adapters/persistence/redis';
import { SessionRepository } from '~/auth/adapters/persistence/SessionRepository';
import { logout } from '~/auth/application/use-cases/logout';
import { RouteTag } from '~/utils/oas';

const logoutBodySchema = v.object({
  refreshToken: v.string(),
});

export const logoutPlugin = new Elysia().post(
  '/auth/logout',
  async ({ body }) => {
    const { refreshToken } = body;
    const sessionRepo = new SessionRepository(getRedis());
    await logout({ refreshToken }, sessionRepo);
    return new Response(null, { status: 204 });
  },
  {
    body: logoutBodySchema,
    detail: {
      responses: {
        204: { description: 'Logged out' },
      },
      summary: 'Logout',
      tags: [RouteTag.Auth],
    },
  }
);
