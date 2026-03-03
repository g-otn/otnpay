import { defineConfig } from 'drizzle-kit';

const ACCOUNT_SERVICE_MIGRATION_DB_URL =
  process.env.ACCOUNT_SERVICE_MIGRATION_DB_URL;

export default defineConfig({
  ...(ACCOUNT_SERVICE_MIGRATION_DB_URL
    ? { dbCredentials: { url: ACCOUNT_SERVICE_MIGRATION_DB_URL } }
    : {}),
  dialect: 'postgresql',
  out: './migrations/account',
  schema:
    '../../apps/account-service/src/account/adapters/persistence/schema.ts',
});
