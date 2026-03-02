import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  timestamp,
} from 'drizzle-orm/pg-core';

export const transactionTypeEnum = pgEnum('transaction_type', [
  'deposit',
  'withdrawal',
]);

export const account = pgTable(
  'accounts',
  {
    id: serial('id').primaryKey(),
    account_id: integer('account_id').unique(),
    balance: numeric('balance', { precision: 18, scale: 2 })
      .notNull()
      .default('0.00'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('accounts_account_id_idx').on(t.account_id),
    check('accounts_balance_non_negative', sql`${t.balance} >= 0`),
  ]
);

export const transaction = pgTable(
  'transactions',
  {
    id: serial('id').primaryKey(),
    account_id: integer('account_id')
      .notNull()
      .references(() => account.account_id),
    type: transactionTypeEnum('type').notNull(),
    amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
  },
  (t) => [
    index('transactions_account_id_idx').on(t.account_id),
    index('transactions_type_idx').on(t.type),
    index('transactions_timestamp_idx').on(t.timestamp),
  ]
);
