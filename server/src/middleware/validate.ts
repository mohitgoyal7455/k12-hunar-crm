import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

type Source = 'body' | 'query' | 'params';

/**
 * Validates req[source] with a Zod schema. The parsed (coerced, trimmed)
 * value is stored on res.locals[source] — Express 5 makes req.query
 * read-only, so handlers read validated input from res.locals.
 * Validation errors are forwarded to the central error handler (→ 422).
 */
export const validate =
  (schema: ZodType, source: Source = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) return next(result.error);
    res.locals[source] = result.data;
    next();
  };
