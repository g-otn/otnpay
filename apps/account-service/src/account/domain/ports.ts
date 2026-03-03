export interface IAccountRepository {
  adjustBalance(userId: number, delta: string): Promise<{ balance: string }>;
  getByUserId(userId: number): Promise<undefined | { balance: string }>;
  upsertAccount(userId: number): Promise<void>;
}
