import { createMiddleware } from 'hono/factory';
import { logger as honoRequestLogger } from 'hono/logger';

import { AppEnv } from '~/types';
import { logger } from '~/utils/logger';

export const loggerMiddleware = createMiddleware<AppEnv>((c, next) => {
  const child = logger.child({ requestId: c.get('requestId') });
  c.set('log', child);
  return honoRequestLogger((...data) => {
    child.info(data.join(' '));
  })(c, next);
});
