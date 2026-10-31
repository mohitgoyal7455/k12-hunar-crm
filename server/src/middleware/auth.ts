import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import { getAdminById } from '../services/authService';
import { verifyToken, type AuthTokenPayload } from '../utils/jwt';

declare module 'express-serve-static-core' {
  interface Request {
    admin?: AuthTokenPayload;
  }
}

/**
 * Protects a route: requires `Authorization: Bearer <jwt>`.
 * On success the decoded payload is available as `req.admin`.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Missing or malformed Authorization header'));
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) return next(AppError.unauthorized('Missing token'));

  let payload: AuthTokenPayload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AppError(401, 'TOKEN_EXPIRED', 'Session expired, please log in again'));
    }
    return next(new AppError(401, 'INVALID_TOKEN', 'Invalid authentication token'));
  }

  try {
    // Checking the database means a disabled or deleted admin loses access
    // immediately, even if their previously issued JWT has not expired yet.
    await getAdminById(Number(payload.sub));
    req.admin = payload;
    return next();
  } catch (err) {
    // Keep database/infrastructure errors distinct from an invalid token.
    return next(err);
  }
}
