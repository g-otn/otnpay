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
    balance: numeric('balance', { precision: 13, scale: 2 })
      .notNull()
      .default('0.00'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    id: serial('id').primaryKey(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
    user_id: integer('user_id').unique(),
  },
  (t) => [
    index('accounts_user_id_idx').on(t.user_id),
    check('accounts_balance_non_negative', sql`${t.balance} >= 0`),
  ]
);

export const transaction = pgTable(
  'transactions',
  {
    amount: numeric('amount', { precision: 13, scale: 2 }).notNull(),
    id: serial('id').primaryKey(),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    type: transactionTypeEnum('type').notNull(),
    user_id: integer('user_id')
      .notNull()
      .references(() => account.user_id),
  },
  (t) => [
    index('transactions_user_id_idx').on(t.user_id),
    index('transactions_type_idx').on(t.type),
    index('transactions_timestamp_idx').on(t.timestamp),
  ]
);
