export interface HttpErrorOptions {
  statusCode: number;
  message: string;
  error?: string;
  details?: unknown;
}

export class HttpError extends Error {
  readonly statusCode: number;
  readonly error?: string;
  readonly details?: unknown;

  constructor(options: HttpErrorOptions) {
    super(options.message);
    this.name = 'HttpError';
    this.statusCode = options.statusCode;
    this.error = options.error;
    this.details = options.details;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, HttpError.prototype);
  }

  toJSON() {
    const result: Record<string, unknown> = {
      error: this.message,
    };
    if (this.error) {
      result.code = this.error;
    }
    if (this.details) {
      result.details = this.details;
    }
    return result;
  }

  static badRequest(message: string, details?: unknown): HttpError {
    return new HttpError({
      statusCode: 400,
      message,
      error: 'BAD_REQUEST',
      details,
    });
  }

  static unauthorized(message: string = 'Unauthorized'): HttpError {
    return new HttpError({
      statusCode: 401,
      message,
      error: 'UNAUTHORIZED',
    });
  }

  static forbidden(message: string = 'Forbidden'): HttpError {
    return new HttpError({
      statusCode: 403,
      message,
      error: 'FORBIDDEN',
    });
  }

  static notFound(message: string = 'Not Found'): HttpError {
    return new HttpError({
      statusCode: 404,
      message,
      error: 'NOT_FOUND',
    });
  }

  static conflict(message: string): HttpError {
    return new HttpError({
      statusCode: 409,
      message,
      error: 'CONFLICT',
    });
  }

  static internalServerError(message: string = 'Internal Server Error'): HttpError {
    return new HttpError({
      statusCode: 500,
      message,
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}
