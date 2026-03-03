import { AccountNotFoundError } from '~/account/domain/errors';
import { IAccountRepository } from '~/account/domain/ports';

export async function getBalance(
  input: { userId: number },
  repo: IAccountRepository
): Promise<{ balance: string; user_id: number }> {
  const account = await repo.getByUserId(input.userId);
  if (!account) throw new AccountNotFoundError();
  return { balance: account.balance, user_id: input.userId };
}
