import request from 'supertest';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import { app, cleanDatabase, registerAndLogin, authHeader } from '../helpers';

let adminToken: string;
let analystToken: string;

beforeAll(async () => {
  await cleanDatabase();
  ({ token: adminToken } = await registerAndLogin({ role: 'ADMIN', email: 'admin-rec@example.com' }));
  ({ token: analystToken } = await registerAndLogin({ role: 'ANALYST', email: 'analyst-rec@example.com' }));
});
afterAll(cleanDatabase);

const base = '/api/v1/records';

const sampleRecord = {
  amount: 1500.00,
  type: 'INCOME',
  category: 'salary',
  date: '2024-01-15T00:00:00.000Z',
  notes: 'January salary',
};

describe('Records — integration', () => {
  let recordId: string;

  it('POST / creates a record (ADMIN)', async () => {
    const res = await request(app).post(base).set(authHeader(adminToken)).send(sampleRecord);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.category).toBe('salary');
    recordId = res.body.data.id;
  });

  it('POST / returns 403 for ANALYST', async () => {
    const res = await request(app).post(base).set(authHeader(analystToken)).send(sampleRecord);
    expect(res.status).toBe(403);
  });

  it('GET /:id returns the record (ANALYST)', async () => {
    const res = await request(app).get(`${base}/${recordId}`).set(authHeader(analystToken));
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(recordId);
  });

  it('GET / returns paginated list with meta', async () => {
    const res = await request(app).get(base).set(authHeader(analystToken));
    expect(res.status).toBe(200);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 20 });
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET / filters by type=INCOME', async () => {
    const res = await request(app).get(`${base}?type=INCOME`).set(authHeader(analystToken));
    expect(res.status).toBe(200);
    res.body.data.forEach((r: { type: string }) => expect(r.type).toBe('INCOME'));
  });

  it('GET / filters by category', async () => {
    const res = await request(app).get(`${base}?category=salary`).set(authHeader(analystToken));
    expect(res.status).toBe(200);
    res.body.data.forEach((r: { category: string }) => expect(r.category).toBe('salary'));
  });

  it('GET / searches by notes (case-insensitive)', async () => {
    const res = await request(app).get(`${base}?search=JANUARY`).set(authHeader(analystToken));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('PUT /:id updates the record (ADMIN)', async () => {
    const res = await request(app).put(`${base}/${recordId}`).set(authHeader(adminToken)).send({ notes: 'Updated notes' });
    expect(res.status).toBe(200);
    expect(res.body.data.notes).toBe('Updated notes');
  });

  it('DELETE /:id soft-deletes the record (ADMIN)', async () => {
    const res = await request(app).delete(`${base}/${recordId}`).set(authHeader(adminToken));
    expect(res.status).toBe(200);
  });

  it('GET /:id returns 404 after soft-delete', async () => {
    const res = await request(app).get(`${base}/${recordId}`).set(authHeader(analystToken));
    expect(res.status).toBe(404);
  });

  it('GET / excludes soft-deleted records', async () => {
    const res = await request(app).get(base).set(authHeader(analystToken));
    const ids = res.body.data.map((r: { id: string }) => r.id);
    expect(ids).not.toContain(recordId);
  });

  it('GET / returns 400 for invalid sort field', async () => {
    const res = await request(app).get(`${base}?sort=invalid:asc`).set(authHeader(analystToken));
    expect(res.status).toBe(400);
  });
});
