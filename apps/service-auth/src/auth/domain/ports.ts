export interface ISessionRepository {
  consumeRefreshToken(token: string): Promise<null | number>;
  deleteRefreshToken(token: string): Promise<void>;
  saveRefreshToken(token: string, userId: number): Promise<void>;
}

export interface IUserRepository {
  createUser(params: {
    email: string;
    hashedPassword: string;
    ownerName: string;
  }): Promise<{ id: number }>;

  findByEmail(
    email: string
  ): Promise<undefined | { id: number; ownerName: string; password: string }>;

  findById(id: number): Promise<undefined | { id: number; ownerName: string }>;
}
