import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { loginLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { loginSchema } from '../schemas/auth';
import * as authService from '../services/authService';

export const authRouter = Router();

/** POST /api/auth/login → { token, admin } */
authRouter.post('/login', loginLimiter, validate(loginSchema), async (_req, res) => {
  const { email, password } = res.locals.body;
  const result = await authService.login(email, password);
  res.json(result);
});

/** GET /api/auth/me → the currently authenticated admin */
authRouter.get('/me', requireAuth, async (req, res) => {
  const admin = await authService.getAdminById(Number(req.admin!.sub));
  res.json({ admin });
});
