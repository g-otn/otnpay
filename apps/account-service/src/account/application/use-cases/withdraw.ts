import {
  AccountNotFoundError,
  InsufficientFundsError,
} from '~/account/domain/errors';
import { IAccountRepository } from '~/account/domain/ports';

export async function withdraw(
  input: { amount: string; userId: number },
  repo: IAccountRepository
): Promise<{ balance: string }> {
  const acct = await repo.getByUserId(input.userId);
  if (!acct) throw new AccountNotFoundError();

  if (parseFloat(acct.balance) < parseFloat(input.amount)) {
    throw new InsufficientFundsError();
  }

  return repo.adjustBalance(input.userId, `-${input.amount}`);
}
