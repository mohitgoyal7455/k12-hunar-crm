import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthTokenPayload {
  sub: string; // admin id
  email: string;
  name: string;
}

const ALGORITHM = 'HS256';
const ISSUER = 'k12-hunar-crm';

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    issuer: ISSUER,
  });
}

/** Throws if the token is missing, malformed, expired or signed with another key. */
export function verifyToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    algorithms: [ALGORITHM], // never accept "none" or RS/HS confusion
    issuer: ISSUER,
  });
  if (typeof decoded === 'string' || !decoded.sub) {
    throw new Error('Malformed token payload');
  }
  return decoded as unknown as AuthTokenPayload;
}
