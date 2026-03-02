# db-schema

Drizzle ORM schema definitions and migrations for all otnpay services.

## Environment Setup

Migrations require database connection URLs provided via a `.env` file in this directory (`libs/db-schema/.env`).

**This file is gitignored — never commit real credentials.**

### 1. Create the `.env` file

```sh
cp libs/db-schema/.env.example libs/db-schema/.env
```

Or create it manually:

```sh
# libs/db-schema/.env

AUTH_SERVICE_MIGRATION_DB_URL=postgresql://<user>:<password>@<host>:<port>/<db>
ACCOUNT_SERVICE_MIGRATION_DB_URL=postgresql://<user>:<password>@<host>:<port>/<db>
```

### Variables

| Variable                           | Used by                            | Purpose                                            |
| ---------------------------------- | ---------------------------------- | -------------------------------------------------- |
| `AUTH_SERVICE_MIGRATION_DB_URL`    | `config/drizzle.auth.config.ts`    | Auth service database connection for migrations    |
| `ACCOUNT_SERVICE_MIGRATION_DB_URL` | `config/drizzle.account.config.ts` | Account service database connection for migrations |

## Running Migrations

Scripts must be run from the `libs/db-schema` directory so that the `.env` file is picked up automatically.

```sh
# Generate + migrate both schemas
bun nx run db-schema:migrate

# Or individually
bun nx run db-schema:migrate:auth
bun nx run db-schema:migrate:account
```

To only generate migration SQL files without applying them:

```sh
bun nx run db-schema:generate
```
