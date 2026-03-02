import { index, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const user = pgTable(
  'user',
  {
    account_id: serial('account_id').primaryKey(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    email: text('email').notNull().unique(),
    owner_name: text('owner_name').notNull(),
    password: text('password').notNull(),
  },
  (t) => [index('user_email_idx').on(t.email)]
);
