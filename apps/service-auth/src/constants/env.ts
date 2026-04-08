export const Env = {
  DB_URL: Bun.env.AUTH_SERVICE_DB_URL,
  JWT_SECRET: Bun.env.AUTH_SERVICE_JWT_SECRET,
  REDIS_URL: Bun.env.AUTH_SERVICE_REDIS_URL,
} as const;
