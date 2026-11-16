import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodType } from 'zod';
import { AppError } from '../errors.js';

interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

type Source = keyof ValidationSchemas;

function parseSource(source: Source, schema: ZodType, data: unknown): unknown {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      // `in` indica de dónde viene el error (body, query o params).
      throw AppError.badRequest(
        'Los datos enviados no cumplen con el formato requerido.',
        'VALIDATION_ERROR',
        error.issues.map((issue) => ({
          in: source,
          field: issue.path.map(String).join('.'),
          message: issue.message,
        }))
      );
    }
    throw error;
  }
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (schemas.params) {
      Object.assign(req.params, parseSource('params', schemas.params, req.params));
    }

    if (schemas.query) {
      // Express 5: `req.query` es un getter de solo lectura; se redefine como propiedad propia.
      Object.defineProperty(req, 'query', {
        value: parseSource('query', schemas.query, req.query),
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }

    if (schemas.body) {
      req.body = parseSource('body', schemas.body, req.body);
    }

    next();
  };
}
