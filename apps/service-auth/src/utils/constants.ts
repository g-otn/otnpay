export const SERVICE_NAME = 'auth-service';

export const ACCESS_TOKEN_EXPIRE_TIME = '15min';
export const REFRESH_TOKEN_EXPIRE_TIME = '30min';
export const REFRESH_TOKEN_REDIS_TTL_SEC = 30 * 60; // Should be the same as JWT exp claim
