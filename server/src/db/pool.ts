import { Pool } from 'pg';
import { env } from '../config/env';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Supabase presents a certificate chain Node does not trust by default.
  // Traffic is still encrypted; set DB_SSL=false for a local Postgres.
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (err) => {
  // An idle client errored (e.g. the pooler dropped the connection).
  // The pool discards it; log and keep the process alive.
  console.error('Postgres pool error:', err.message);
});
