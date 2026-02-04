export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational; // Trusted error vs Bug
    Error.captureStackTrace(this, this.constructor);
  }
}

