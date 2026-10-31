import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockPool, pgResult } from './helpers';

vi.mock('../src/db/pool', () => ({ pool: mockPool }));

import { createApp } from '../src/app';
import { signToken } from '../src/utils/jwt';

const app = createApp();
const SECRET = process.env.JWT_SECRET!;
const validToken = () => signToken({ sub: '1', email: 'admin@k12hunar.com', name: 'Demo Admin' });

const statsRow = {
  total: 0, last7Days: 0, new: 0, inProgress: 0, resolved: 0, closed: 0,
  scholarship: 0, concert: 0, admission: 0, generalQuery: 0,
};

beforeEach(() => mockPool.query.mockReset());

describe('requireAuth middleware', () => {
  it('rejects a request with no Authorization header', async () => {
    const res = await request(app).get('/api/inquiries');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  it('rejects a non-Bearer scheme', async () => {
    const res = await request(app).get('/api/inquiries').set('Authorization', `Basic ${validToken()}`);
    expect(res.status).toBe(401);
  });

  it('rejects a token signed with a different secret', async () => {
    const forged = jwt.sign({ sub: '1' }, 'some-other-secret-that-is-long-enough', {
      issuer: 'k12-hunar-crm',
    });
    const res = await request(app).get('/api/inquiries').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('rejects an unsigned ("alg: none") token', async () => {
    const unsigned = jwt.sign({ sub: '1' }, '', { algorithm: 'none', issuer: 'k12-hunar-crm' });
    const res = await request(app).get('/api/inquiries').set('Authorization', `Bearer ${unsigned}`);
    expect(res.status).toBe(401);
  });

  it('rejects an expired token with TOKEN_EXPIRED', async () => {
    const expired = jwt.sign(
      { sub: '1', email: 'a@b.co', name: 'A', exp: Math.floor(Date.now() / 1000) - 60 },
      SECRET,
      { issuer: 'k12-hunar-crm' },
    );
    const res = await request(app).get('/api/inquiries').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('lets a valid token through to the protected route', async () => {
    mockPool.query.mockResolvedValueOnce(pgResult([{ id: '1', name: 'Demo Admin', email: 'admin@k12hunar.com', is_active: true }])).mockResolvedValueOnce(pgResult([statsRow]));
    const res = await request(app)
      .get('/api/inquiries/stats')
      .set('Authorization', `Bearer ${validToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
  });

  it('rejects a valid token if its admin account is disabled', async () => {
    mockPool.query.mockResolvedValueOnce(pgResult([{ id: '1', name: 'Demo Admin', email: 'admin@k12hunar.com', is_active: false }]));
    const res = await request(app).get('/api/inquiries/stats').set('Authorization', `Bearer ${validToken()}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('rejects a valid token if its admin account has been deleted', async () => {
    mockPool.query.mockResolvedValueOnce(pgResult([]));
    const res = await request(app).get('/api/inquiries/stats').set('Authorization', `Bearer ${validToken()}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });
});

describe('POST /api/auth/login', () => {
  const hash = bcrypt.hashSync('Admin@123', 4);
  const adminRow = { id: '1', name: 'Demo Admin', email: 'admin@k12hunar.com', password_hash: hash, is_active: true };

  it('returns a verifiable JWT for correct credentials and never leaks the hash', async () => {
    mockPool.query.mockResolvedValueOnce(pgResult([adminRow])).mockResolvedValueOnce(pgResult([]));
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'Admin@K12Hunar.com', password: 'Admin@123' });

    expect(res.status).toBe(200);
    expect(res.body.admin).toEqual({ id: 1, name: 'Demo Admin', email: 'admin@k12hunar.com' });
    expect(JSON.stringify(res.body)).not.toContain('password');
    const decoded = jwt.verify(res.body.token, SECRET) as jwt.JwtPayload;
    expect(decoded.sub).toBe('1');
  });

  it('returns 403 when a disabled admin tries to log in', async () => {
    mockPool.query.mockResolvedValueOnce(pgResult([{ ...adminRow, is_active: false }]));
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@k12hunar.com', password: 'Admin@123' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 401 for a wrong password', async () => {
    mockPool.query.mockResolvedValueOnce(pgResult([adminRow]));
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@k12hunar.com', password: 'nope' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns the same 401 for an unknown email (no user enumeration)', async () => {
    mockPool.query.mockResolvedValueOnce(pgResult([]));
    const res = await request(app).post('/api/auth/login').send({ email: 'ghost@k12hunar.com', password: 'x' });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('returns 422 when the body is invalid', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email' });
    expect(res.status).toBe(422);
    expect(mockPool.query).not.toHaveBeenCalled();
  });
});
