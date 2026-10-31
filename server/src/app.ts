import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { pool } from './db/pool';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
import { inquiriesRouter } from './routes/inquiries';

export function createApp() {
  const app = express();

  // Render/Railway sit behind one proxy hop; needed for correct client IPs
  // in the rate limiter.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // API is consumed cross-origin by the Vercel frontend.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin(origin, callback) {
        // Allow same-origin / server-to-server / curl (no Origin header).
        if (!origin) return callback(null, true);
        callback(null, env.allowedOrigins.includes(origin.replace(/\/$/, '')));
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Content-Disposition'],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: '20kb' }));

  app.get('/', (_req, res) => {
    res.json({ name: 'K12 Hunar CRM API', docs: 'See README.md', health: '/api/health' });
  });

  app.get('/api/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', db: 'up' });
    } catch {
      res.status(503).json({ status: 'degraded', db: 'down' });
    }
  });

  app.use('/api/auth', authRouter);
  app.use('/api/inquiries', inquiriesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
