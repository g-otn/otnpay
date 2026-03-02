import type { account, transaction, user } from '@otnpay/db-schema';

import { faker } from '@faker-js/faker';

type Account = typeof account.$inferSelect;
type Transaction = typeof transaction.$inferSelect;
type User = typeof user.$inferSelect;

export const createMockUser = (overrides?: Partial<User>): User => ({
  account_id: faker.number.int({ max: 100_000, min: 1 }),
  created_at: faker.date.past(),
  email: faker.internet.email(),
  owner_name: faker.person.fullName(),
  password: faker.internet.password({ length: 60 }),
  ...overrides,
});

export const createMockAccount = (overrides?: Partial<Account>): Account => ({
  account_id: faker.number.int({ max: 100_000, min: 1 }),
  balance: faker.finance.amount({ dec: 2, max: 10_000, min: 0 }),
  created_at: faker.date.past(),
  id: faker.number.int({ max: 100_000, min: 1 }),
  updated_at: faker.date.recent(),
  ...overrides,
});

export const createMockDeposit = (
  overrides?: Partial<Transaction>
): Transaction => ({
  account_id: faker.number.int({ max: 100_000, min: 1 }),
  amount: faker.finance.amount({ dec: 2, max: 5_000, min: 1 }),
  id: faker.number.int({ max: 100_000, min: 1 }),
  timestamp: faker.date.recent(),
  type: 'deposit',
  ...overrides,
});

export const createMockWithdrawal = (
  overrides?: Partial<Transaction>
): Transaction => ({
  account_id: faker.number.int({ max: 100_000, min: 1 }),
  amount: faker.finance.amount({ dec: 2, max: 1_000, min: 1 }),
  id: faker.number.int({ max: 100_000, min: 1 }),
  timestamp: faker.date.recent(),
  type: 'withdrawal',
  ...overrides,
});
