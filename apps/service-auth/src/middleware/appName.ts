import { createMiddleware } from 'hono/factory';

import { AppEnv } from '~/types';
import { getDBAppName } from '~/utils/constants';

export const appName = createMiddleware<AppEnv>((c, next) => {
  c.set(
    'appName',
    getDBAppName(c.get('requestId'), c.env.CF_VERSION_METADATA?.tag)
  );
  return next();
});
