import type { PostgresError } from 'postgres';

import { DrizzleQueryError } from 'drizzle-orm';

import { getDB } from '~/auth/adapters/persistence/db';
import { EmailAlreadyTakenError } from '~/auth/domain/errors';
import { IUserRepository } from '~/auth/domain/ports';

import { users } from './schema';

export class UserRepository implements IUserRepository {
  constructor(private db: ReturnType<typeof getDB>) {}

  async createUser({
    email,
    hashedPassword,
    ownerName,
  }: {
    email: string;
    hashedPassword: string;
    ownerName: string;
  }) {
    try {
      const [newUser] = await this.db
        .insert(users)
        .values({ email, owner_name: ownerName, password: hashedPassword })
        .returning({ id: users.id });
      return newUser;
    } catch (error) {
      const isUniqueEmailViolation =
        error instanceof DrizzleQueryError &&
        (error.cause as PostgresError).code === '23505' &&
        (error.cause as PostgresError).constraint_name ===
          users.email.uniqueName;
      if (isUniqueEmailViolation) {
        throw new EmailAlreadyTakenError();
      }
      throw error;
    }
  }

  async findByEmail(email: string) {
    const user = await this.db.query.users.findFirst({
      columns: { id: true, owner_name: true, password: true },
      where: (t, { eq }) => eq(t.email, email),
    });
    if (!user) return undefined;
    return { id: user.id, ownerName: user.owner_name, password: user.password };
  }

  async findById(id: number) {
    const user = await this.db.query.users.findFirst({
      columns: { id: true, owner_name: true },
      where: (t, { eq }) => eq(t.id, id),
    });
    if (!user) return undefined;
    return { id: user.id, ownerName: user.owner_name };
  }
}
