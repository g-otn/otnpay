import { eq, sql } from 'drizzle-orm';

import { InsufficientFundsError } from '~/account/domain/errors';
import { IAccountRepository } from '~/account/domain/ports';

import { getDB } from './db';
import { account, transaction } from './schema';

export class AccountRepository implements IAccountRepository {
  constructor(private db: ReturnType<typeof getDB>) {}

  async adjustBalance(
    userId: number,
    delta: string
  ): Promise<{ balance: string }> {
    const isDebit = delta.startsWith('-');
    const absAmount = isDebit ? delta.slice(1) : delta;

    // TODO: Idempotency key
    return await this.db.transaction(async (tx) => {
      await tx
        .insert(account)
        .values({ user_id: userId })
        .onConflictDoNothing({ target: account.user_id });

      const [current] = await tx
        .select({ balance: account.balance })
        .from(account)
        .where(eq(account.user_id, userId))
        .for('update');

      if (isDebit && parseFloat(current.balance) < parseFloat(absAmount)) {
        throw new InsufficientFundsError();
      }

      const [result] = await tx
        .update(account)
        .set({
          balance: sql`${account.balance} + ${delta}`,
          updated_at: new Date(),
        })
        .where(eq(account.user_id, userId))
        .returning({ balance: account.balance });

      await tx.insert(transaction).values({
        amount: absAmount,
        type: isDebit ? 'withdrawal' : 'deposit',
        user_id: userId,
      });

      return { balance: result.balance };
    });
  }

  async getByUserId(userId: number) {
    const result = await this.db.query.account.findFirst({
      columns: { balance: true },
      where: (t, { eq }) => eq(t.user_id, userId),
    });
    if (!result) return undefined;
    return { balance: result.balance };
  }

  async upsertAccount(userId: number): Promise<void> {
    await this.db
      .insert(account)
      .values({ user_id: userId })
      .onConflictDoNothing({ target: account.user_id });
  }
}
