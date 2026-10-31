import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

interface ErrorBody {
  error: { message: string; code: string; details?: unknown };
}

const send = (res: Response, status: number, body: ErrorBody) => res.status(status).json(body);

export function notFoundHandler(req: Request, res: Response) {
  send(res, 404, {
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` },
  });
}

// Express recognises error handlers by their 4-argument signature.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return send(res, 422, {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Some fields are invalid',
        details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      },
    });
  }

  if (err instanceof AppError) {
    return send(res, err.status, {
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
  }

  // Malformed JSON body from express.json()
  if (isBodyParserError(err)) {
    const tooLarge = err.type === 'entity.too.large';
    return send(res, tooLarge ? 413 : 400, {
      error: {
        code: tooLarge ? 'PAYLOAD_TOO_LARGE' : 'INVALID_JSON',
        message: tooLarge ? 'Request body is too large' : 'Request body is not valid JSON',
      },
    });
  }

  // Postgres constraint violations that slipped past Zod.
  if (isPgError(err) && err.code === '23514') {
    return send(res, 422, { error: { code: 'CONSTRAINT_VIOLATION', message: 'Invalid data' } });
  }

  // Anything else is a bug or infrastructure failure: log it, never leak it.
  console.error(err);
  return send(res, 500, { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
}

function isBodyParserError(err: unknown): err is { type: string } {
  return typeof err === 'object' && err !== null && 'type' in err &&
    typeof (err as { type: unknown }).type === 'string' &&
    (err as { type: string }).type.startsWith('entity.');
}

function isPgError(err: unknown): err is { code: string } {
  return typeof err === 'object' && err !== null && 'code' in err &&
    typeof (err as { code: unknown }).code === 'string';
}
