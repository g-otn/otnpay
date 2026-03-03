import { InvalidCredentialsError } from '~/auth/domain/errors';
import { ISessionRepository, IUserRepository } from '~/auth/domain/ports';
import { generateAccessToken, verifyPassword } from '~/utils';
import { generateRefreshToken } from '~/utils/refreshToken';

export type TokenPair = { accessToken: string; refreshToken: string };

export async function login(
  input: { email: string; jwtSecret: string; password: string },
  userRepo: IUserRepository,
  sessionRepo: ISessionRepository
): Promise<TokenPair> {
  const user = await userRepo.findByEmail(input.email);
  if (!user || !(await verifyPassword(user.password, input.password))) {
    throw new InvalidCredentialsError();
  }

  const accessToken = await generateAccessToken(
    { ownerName: user.ownerName, userId: user.id },
    input.jwtSecret
  );
  const refreshToken = generateRefreshToken();

  await sessionRepo.saveRefreshToken(refreshToken, user.id);

  return { accessToken, refreshToken };
}
