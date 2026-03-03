import { getRedis } from '~/auth/adapters/persistence/redis';
import { ISessionRepository } from '~/auth/domain/ports';
import { REFRESH_TOKEN_REDIS_TTL_SEC } from '~/utils/constants';

export class SessionRepository implements ISessionRepository {
  constructor(private redis: ReturnType<typeof getRedis>) {}

  async consumeRefreshToken(token: string) {
    const [userId] = await Promise.all([
      this.redis.get<number>(`refresh:${token}`),
      this.redis.del(`refresh:${token}`),
    ]);
    return userId;
  }

  async deleteRefreshToken(token: string) {
    await this.redis.del(`refresh:${token}`);
  }

  async saveRefreshToken(token: string, userId: number) {
    await this.redis.set(`refresh:${token}`, userId, {
      ex: REFRESH_TOKEN_REDIS_TTL_SEC,
    });
  }
}
