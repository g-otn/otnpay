import { ISessionRepository } from '~/auth/domain/ports';

export async function logout(
  input: { refreshToken: string },
  sessionRepo: ISessionRepository
): Promise<void> {
  await sessionRepo.deleteRefreshToken(input.refreshToken);
}
