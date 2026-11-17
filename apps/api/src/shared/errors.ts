export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_JSON'
  | 'INVALID_CAPACITY'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_EVENT_OWNER'
  | 'NOT_FOUND'
  | 'PAYLOAD_TOO_LARGE'
  | 'INTERNAL_SERVER_ERROR'
  | (string & {});

export class AppError extends Error {
  public readonly status: number;
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(statusCode: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.status = statusCode;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(
    message: string,
    code: ErrorCode = 'VALIDATION_ERROR',
    details?: unknown
  ): AppError {
    return new AppError(400, code, message, details);
  }

  static unauthorized(message = 'Token de autenticación requerido o inválido.'): AppError {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(
    message = 'No tienes permisos para realizar esta acción.',
    code: ErrorCode = 'FORBIDDEN'
  ): AppError {
    return new AppError(403, code, message);
  }

  static notFound(message = 'El recurso solicitado no existe.'): AppError {
    return new AppError(404, 'NOT_FOUND', message);
  }
}