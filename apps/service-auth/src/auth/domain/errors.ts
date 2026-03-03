export class DomainError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class EmailAlreadyTakenError extends DomainError {
  constructor() {
    super('Email already taken');
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Invalid credentials');
  }
}

export class InvalidRefreshTokenError extends DomainError {
  constructor() {
    super('Invalid token');
  }
}

export class UserNotFoundError extends DomainError {
  constructor() {
    super('Account not found');
  }
}
