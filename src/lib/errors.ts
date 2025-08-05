export class JWTError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'JWTError';
  }
}

export class TokenExpiredError extends JWTError {
  constructor() {
    super('Token has expired', 'TOKEN_EXPIRED');
  }
}

export class InvalidTokenError extends JWTError {
  constructor(message = 'Invalid token') {
    super(message, 'INVALID_TOKEN');
  }
}

export class MissingTokenError extends JWTError {
  constructor() {
    super('No authorization token provided', 'MISSING_TOKEN');
  }
}