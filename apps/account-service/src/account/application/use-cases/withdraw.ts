import { IAccountRepository } from '~/account/domain/ports';

export async function withdraw(
  input: { amount: string; userId: number },
  repo: IAccountRepository
): Promise<{ balance: string }> {
  return repo.adjustBalance(input.userId, `-${input.amount}`);
}
