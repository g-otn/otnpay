import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export function getDB(connectionString: string, applicationName?: string) {
  const client = postgres(connectionString, {
    max: 1,
    connection: { application_name: applicationName },
  });
  return drizzle(client, { schema });
}
