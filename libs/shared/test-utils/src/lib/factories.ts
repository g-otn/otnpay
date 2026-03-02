import { faker } from '@faker-js/faker';
import type { account, transaction, user } from '@otnpay/db-schema';

type User = typeof user.$inferSelect;
type Account = typeof account.$inferSelect;
type Transaction = typeof transaction.$inferSelect;

export const createMockUser = (overrides?: Partial<User>): User => ({
  account_id: faker.number.int({ min: 1, max: 100_000 }),
  created_at: faker.date.past(),
  email: faker.internet.email(),
  owner_name: faker.person.fullName(),
  password: faker.internet.password({ length: 60 }),
  ...overrides,
});

export const createMockAccount = (overrides?: Partial<Account>): Account => ({
  id: faker.number.int({ min: 1, max: 100_000 }),
  account_id: faker.number.int({ min: 1, max: 100_000 }),
  balance: faker.finance.amount({ min: 0, max: 10_000, dec: 2 }),
  created_at: faker.date.past(),
  updated_at: faker.date.recent(),
  ...overrides,
});

export const createMockDeposit = (
  overrides?: Partial<Transaction>
): Transaction => ({
  id: faker.number.int({ min: 1, max: 100_000 }),
  account_id: faker.number.int({ min: 1, max: 100_000 }),
  type: 'deposit',
  amount: faker.finance.amount({ min: 1, max: 5_000, dec: 2 }),
  timestamp: faker.date.recent(),
  ...overrides,
});

export const createMockWithdrawal = (
  overrides?: Partial<Transaction>
): Transaction => ({
  id: faker.number.int({ min: 1, max: 100_000 }),
  account_id: faker.number.int({ min: 1, max: 100_000 }),
  type: 'withdrawal',
  amount: faker.finance.amount({ min: 1, max: 1_000, dec: 2 }),
  timestamp: faker.date.recent(),
  ...overrides,
});
