import { Redis } from '@upstash/redis/cloudflare';

export function getRedis(env: Cloudflare.Env) {
  return new Redis({
    token: env.AUTH_SERVICE_REDIS_TOKEN,
    url: env.AUTH_SERVICE_REDIS_URL,
  });
}
