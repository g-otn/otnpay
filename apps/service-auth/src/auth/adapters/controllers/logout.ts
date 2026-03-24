import { describeRoute } from 'hono-openapi';
import { validator } from 'hono-openapi/valibot';
import * as v from 'valibot';

import { logout } from '~/auth/application/use-cases/logout';
import { AppEnv } from '~/types';
import { RouteTag, validationHook } from '~/utils';

import { getRedis, SessionRepository } from '../persistence';

const logoutBodySchema = v.object({
  refreshToken: v.string(),
});

export const AuthLogoutRoute = describeRoute({
  responses: {
    204: {
      description: 'Logged out',
    },
  },
  summary: 'Logout',
  tags: [RouteTag.Auth],
});

export const authLogoutValidator = validator(
  'json',
  logoutBodySchema,
  validationHook
);

export const AuthLogout = async (c: import('hono').Context<AppEnv>) => {
  const { refreshToken } = c.req.valid('json' as never) as v.InferOutput<
    typeof logoutBodySchema
  >;

  const sessionRepo = new SessionRepository(getRedis(c.env));
  await logout({ refreshToken }, sessionRepo);

  return c.body(null, 204);
};
