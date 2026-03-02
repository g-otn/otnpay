import { createMiddleware } from 'hono/factory';

import { AppEnv } from '~/types';
import { getDBAppName } from '~/utils/constants';

export const dbAppName = createMiddleware<AppEnv>(async (c, next) => {
  c.set(
    'dbAppName',
    getDBAppName(c.get('requestId'), c.env.CF_VERSION_METADATA?.tag)
  );
  await next();
});
