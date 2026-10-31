import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const limited = (message: string) => ({
  error: { code: 'RATE_LIMITED', message },
});

const skip = () => env.NODE_ENV === 'test';

/** Public inquiry form: 5 submissions per IP per 10 minutes. */
export const inquiryLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  message: limited('Too many submissions. Please try again in a few minutes.'),
});

/** Login: 10 attempts per IP per 15 minutes, to slow down password guessing. */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  message: limited('Too many login attempts. Please try again later.'),
});
