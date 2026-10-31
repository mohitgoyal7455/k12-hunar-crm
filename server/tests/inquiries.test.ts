import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockPool, pgResult } from './helpers';

vi.mock('../src/db/pool', () => ({ pool: mockPool }));

import { createApp } from '../src/app';
import { normalizePhone } from '../src/schemas/inquiry';
import { toCsv } from '../src/utils/csv';
import { signToken } from '../src/utils/jwt';

const app = createApp();

const validBody = {
  userType: 'parent',
  category: 'admission',
  name: 'Priya Sharma',
  email: 'Priya.Sharma@Gmail.com',
  phone: '+91 98100 12345',
  message: 'Looking for Grade 6 admission for my daughter.',
};

beforeEach(() => mockPool.query.mockReset());

describe('POST /api/inquiries (public form)', () => {
  it('creates an inquiry and returns a reference number', async () => {
    mockPool.query.mockResolvedValueOnce(pgResult([{ id: 42 }]));
    const res = await request(app).post('/api/inquiries').send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.reference).toBe('INQ-000042');

    // Inputs are normalised before they reach SQL, and passed as parameters.
    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toContain('$6');
    expect(params).toEqual([
      'parent', 'admission', 'Priya Sharma', 'priya.sharma@gmail.com', '9810012345',
      'Looking for Grade 6 admission for my daughter.',
    ]);
  });

  it('rejects an empty body with field-level errors and does not touch the DB', async () => {
    const res = await request(app).post('/api/inquiries').send({});
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const fields = res.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['userType', 'category', 'name', 'email', 'phone', 'message']));
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  it.each([
    ['userType', 'teacher'],
    ['category', 'sports'],
    ['email', 'not-an-email'],
    ['phone', '12345'],
    ['phone', '5810012345'], // Indian mobiles start with 6-9
    ['message', 'hi'],
    ['name', ' '],
  ])('rejects invalid %s = %j', async (field, value) => {
    const res = await request(app).post('/api/inquiries').send({ ...validBody, [field]: value });
    expect(res.status).toBe(422);
    expect(res.body.error.details[0].field).toBe(field);
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  it('silently drops bot submissions that fill the honeypot', async () => {
    const res = await request(app).post('/api/inquiries').send({ ...validBody, website: 'http://spam.example' });
    expect(res.status).toBe(201);
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/inquiries')
      .set('Content-Type', 'application/json')
      .send('{"name":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });
});

describe('GET /api/inquiries (admin list)', () => {
  const auth = () => ({ Authorization: `Bearer ${signToken({ sub: '1', email: 'a@b.co', name: 'A' })}` });

  it('passes filters and search as SQL parameters, never in the SQL text', async () => {
    mockPool.query.mockResolvedValueOnce(pgResult([{ id: '1', name: 'A', email: 'a@b.co', is_active: true }])).mockResolvedValueOnce(pgResult([])).mockResolvedValueOnce(pgResult([{ total: 0 }]));
    const res = await request(app)
      .get('/api/inquiries')
      .query({ category: 'scholarship', userType: 'student', search: "x'; DROP TABLE inquiries;--" })
      .set(auth());

    expect(res.status).toBe(200);
    const [sql, params] = mockPool.query.mock.calls[1];
    expect(sql).not.toContain('DROP');
    expect(params).toEqual(expect.arrayContaining(['scholarship', 'student']));
    expect(res.body.pagination).toEqual({ page: 1, limit: 10, total: 0, totalPages: 1 });
  });

  it('rejects unknown filter values', async () => {
    mockPool.query.mockResolvedValueOnce(pgResult([{ id: '1', name: 'A', email: 'a@b.co', is_active: true }]));
    const res = await request(app).get('/api/inquiries').query({ userType: 'teacher' }).set(auth());
    expect(res.status).toBe(422);
  });
});

describe('helpers', () => {
  it('normalizes Indian phone formats', () => {
    expect(normalizePhone('+91 98100-12345')).toBe('9810012345');
    expect(normalizePhone('09810012345')).toBe('9810012345');
    expect(normalizePhone('9810012345')).toBe('9810012345');
  });

  it('escapes CSV and neutralises formula injection', () => {
    const csv = toCsv(['a', 'b'], [['=HYPERLINK("x")', 'hello, "world"']]);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain('"hello, ""world"""');
  });
});
