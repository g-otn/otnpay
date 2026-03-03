import { IAccountRepository } from '~/account/domain/ports';

export async function deposit(
  input: { amount: string; userId: number },
  repo: IAccountRepository
): Promise<{ balance: string }> {
  await repo.upsertAccount(input.userId);
  return repo.adjustBalance(input.userId, input.amount);
}
