import { createMiddleware } from 'hono/factory';
import { logger } from 'hono/logger';

import { AppEnv } from '~/types';

export const requestLogger = createMiddleware<AppEnv>((c, next) =>
  logger((...data) => console.log(`[${c.get('requestId')}]`, ...data))(c, next)
);
