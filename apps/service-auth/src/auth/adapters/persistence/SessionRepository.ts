import { getRedis } from '~/auth/adapters/persistence/redis';
import { ISessionRepository } from '~/auth/domain/ports';
import { REFRESH_TOKEN_REDIS_TTL_SEC } from '~/utils/constants';

export class SessionRepository implements ISessionRepository {
  constructor(private redis: ReturnType<typeof getRedis>) {}

  async consumeRefreshToken(token: string) {
    const [raw] = await Promise.all([
      this.redis.get(`refresh:${token}`),
      this.redis.del(`refresh:${token}`),
    ]);
    return raw != null ? Number(raw) : null;
  }

  async deleteRefreshToken(token: string) {
    await this.redis.del(`refresh:${token}`);
  }

  async saveRefreshToken(token: string, userId: number) {
    const key = `refresh:${token}`;
    await Promise.all([
      this.redis.set(key, userId),
      this.redis.expire(key, REFRESH_TOKEN_REDIS_TTL_SEC),
    ]);
  }
}
