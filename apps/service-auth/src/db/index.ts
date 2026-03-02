import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

export function getDB(connectionString: string, applicationName?: string) {
  const client = postgres(connectionString, {
    connection: { application_name: applicationName },
    fetch_types: false, // Saves one TCP round trip since we don't use any custom or complex types
    max: 1,
  });
  return drizzle(client, { schema });
}
