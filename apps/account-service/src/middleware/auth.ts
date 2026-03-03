import { createMiddleware } from 'hono/factory';

import { AppEnv } from '~/types';
import { verifyJwt } from '~/utils/jwt';

// We could use Hono built-in JWT middleware but it returns text response instead of RESTful errors
export const auth = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verifyJwt(token, c.env.AUTH_SERVICE_JWT_PUBLIC_KEY);
    const userId = Number(payload.sub);
    if (!payload.sub || isNaN(userId)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    c.set('userId', userId);
  } catch {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  return next();
});
