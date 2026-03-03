import {
  InvalidRefreshTokenError,
  UserNotFoundError,
} from '~/auth/domain/errors';
import { ISessionRepository, IUserRepository } from '~/auth/domain/ports';
import { generateAccessToken } from '~/utils/jwt';
import { generateRefreshToken } from '~/utils/refreshToken';

import { type TokenPair } from './login';

export async function refresh(
  input: { jwtSecret: string; refreshToken: string },
  userRepo: IUserRepository,
  sessionRepo: ISessionRepository
): Promise<TokenPair> {
  const userId = await sessionRepo.consumeRefreshToken(input.refreshToken);
  if (!userId) {
    throw new InvalidRefreshTokenError();
  }

  const user = await userRepo.findById(userId);
  if (!user) {
    throw new UserNotFoundError();
  }

  const newRefreshToken = generateRefreshToken();
  const [newAccessToken] = await Promise.all([
    generateAccessToken({ ownerName: user.ownerName, userId }, input.jwtSecret),
    sessionRepo.saveRefreshToken(newRefreshToken, userId),
  ]);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
