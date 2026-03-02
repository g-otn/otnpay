import { index, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    created_at: timestamp('created_at').defaultNow().notNull(),
    email: text('email').notNull().unique(),
    id: serial('id').primaryKey(),
    owner_name: text('owner_name').notNull(),
    password: text('password').notNull(),
  },
  (t) => [index('users_email_idx').on(t.email)]
);
