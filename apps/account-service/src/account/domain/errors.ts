export class DomainError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class AccountNotFoundError extends DomainError {
  constructor() {
    super('Account not found');
  }
}

export class InsufficientFundsError extends DomainError {
  constructor() {
    super('Insufficient funds');
  }
}
