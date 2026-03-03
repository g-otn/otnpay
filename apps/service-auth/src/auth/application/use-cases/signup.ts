import { IUserRepository } from '~/auth/domain/ports';
import { hashPassword } from '~/utils/password';

export async function signup(
  input: { email: string; ownerName: string; password: string },
  userRepo: IUserRepository
): Promise<{ userId: number }> {
  const hashedPassword = await hashPassword(input.password);
  const { id } = await userRepo.createUser({
    email: input.email,
    hashedPassword,
    ownerName: input.ownerName,
  });
  return { userId: id };
}
