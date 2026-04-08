import { Elysia, status } from 'elysia';

import { verifyJwt } from '~/utils/jwt';

export const authPlugin = new Elysia({ name: 'auth' }).resolve(
  { as: 'scoped' },
  async ({ headers }) => {
    const authHeader = headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      return status(401, { error: 'Unauthorized' });
    }

    const token = authHeader.slice(7);
    try {
      const payload = await verifyJwt(
        token,
        Bun.env.AUTH_SERVICE_JWT_PUBLIC_KEY!
      );
      const userId = Number(payload.sub);
      if (!payload.sub || isNaN(userId)) {
        return status(401, { error: 'Unauthorized' });
      }
      return { userId };
    } catch {
      return status(401, { error: 'Unauthorized' });
    }
  }
);
