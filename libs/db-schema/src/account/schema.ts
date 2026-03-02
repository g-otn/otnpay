import {
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const transactionTypeEnum = pgEnum('transaction_type', [
  'deposit',
  'withdrawal',
  'transfer',
  'payment',
  'refund',
]);

export const account = pgTable('account', {
  account_id: integer('account_id').primaryKey(),
  balance: numeric('balance', { precision: 18, scale: 2 })
    .notNull()
    .default('0.00'),
  currency: text('currency').notNull().default('USD'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const transaction = pgTable(
  'transaction',
  {
    transaction_id: serial('transaction_id').primaryKey(),
    account_id: integer('account_id')
      .notNull()
      .references(() => account.account_id),
    type: transactionTypeEnum('type').notNull(),
    amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),
    description: text('description'),
    related_account_id: integer('related_account_id').references(
      () => account.account_id
    ),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('transaction_account_id_idx').on(t.account_id),
    index('transaction_type_idx').on(t.type),
    index('transaction_created_at_idx').on(t.created_at),
  ]
);
