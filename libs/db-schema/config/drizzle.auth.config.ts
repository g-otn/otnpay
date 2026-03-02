import { defineConfig } from 'drizzle-kit';

const AUTH_SERVICE_MIGRATION_DB_URL = process.env.AUTH_SERVICE_MIGRATION_DB_URL;

export default defineConfig({
  ...(AUTH_SERVICE_MIGRATION_DB_URL
    ? { dbCredentials: { url: AUTH_SERVICE_MIGRATION_DB_URL } }
    : {}),
  dialect: 'postgresql',
  out: './migrations/auth',
  schema: './src/auth/schema.ts',
});
