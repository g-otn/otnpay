import { RedisClient } from 'bun';

import { Env } from '~/constants/env';

export function getRedis() {
  return new RedisClient(Env.REDIS_URL);
}
