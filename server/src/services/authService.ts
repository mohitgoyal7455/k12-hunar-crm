import bcrypt from 'bcryptjs';
import { pool } from '../db/pool';
import { AppError } from '../utils/AppError';
import { signToken } from '../utils/jwt';

export interface PublicAdmin {
  id: number;
  name: string;
  email: string;
}

// Compared against when the email is unknown, so a failed login takes the
// same time whether or not the account exists (prevents user enumeration).
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', 10);

export async function login(email: string, password: string) {
  const { rows } = await pool.query<{
    id: string;
    name: string;
    email: string;
    password_hash: string;
    is_active: boolean;
  }>(
    `SELECT id, name, email, password_hash, is_active
       FROM admins
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1`,
    [email],
  );

  const admin = rows[0];
  const passwordOk = await bcrypt.compare(password, admin?.password_hash ?? DUMMY_HASH);

  if (!admin || !passwordOk) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }
  if (!admin.is_active) {
    throw AppError.forbidden('This admin account is disabled');
  }

  await pool.query('UPDATE admins SET last_login_at = NOW() WHERE id = $1', [admin.id]);

  const user: PublicAdmin = { id: Number(admin.id), name: admin.name, email: admin.email };
  const token = signToken({ sub: String(user.id), email: user.email, name: user.name });
  return { token, admin: user };
}

export async function getAdminById(id: number): Promise<PublicAdmin> {
  const { rows } = await pool.query<{ id: string; name: string; email: string; is_active: boolean }>(
    'SELECT id, name, email, is_active FROM admins WHERE id = $1',
    [id],
  );
  const admin = rows[0];
  if (!admin || !admin.is_active) {
    throw new AppError(401, 'INVALID_TOKEN', 'Admin account no longer exists or is disabled');
  }
  return { id: Number(admin.id), name: admin.name, email: admin.email };
}

export async function createAdmin(name: string, email: string, password: string) {
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO admins (name, email, password_hash)
     VALUES ($1, LOWER($2), $3)
     ON CONFLICT (LOWER(email)) DO UPDATE SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name
     RETURNING id`,
    [name, email, hash],
  );
  return Number(rows[0].id);
}
