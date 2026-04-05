import request from 'supertest';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import { app, cleanDatabase, registerAndLogin, authHeader } from '../helpers';
import jwt from 'jsonwebtoken';

let adminToken: string;
let viewerToken: string;

beforeAll(async () => {
  await cleanDatabase();
  ({ token: adminToken } = await registerAndLogin({ role: 'ADMIN', email: 'admin-err@example.com' }));
  ({ token: viewerToken } = await registerAndLogin({ role: 'VIEWER', email: 'viewer-err@example.com' }));
});
afterAll(cleanDatabase);

describe('Error handling — integration', () => {
  it('returns 400 with field details on invalid registration body', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ name: 'X' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toBeDefined();
  });

  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(app).get('/api/v1/records');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 on malformed JWT', async () => {
    const res = await request(app).get('/api/v1/records').set('Authorization', 'Bearer not.a.jwt');
    expect(res.status).toBe(401);
  });

  it('returns 401 on expired JWT', async () => {
    const expiredToken = jwt.sign(
      { sub: 'fake-id', role: 'ADMIN' },
      process.env.JWT_SECRET ?? 'test_secret_at_least_32_chars_long_here_for_testing',
      { expiresIn: -1 }
    );
    const res = await request(app).get('/api/v1/records').set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });

  it('returns 403 when role is insufficient', async () => {
    const res = await request(app).get('/api/v1/users').set(authHeader(viewerToken));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 404 for non-existent record', async () => {
    const res = await request(app)
      .get('/api/v1/records/00000000-0000-0000-0000-000000000000')
      .set(authHeader(adminToken));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 409 on duplicate email registration', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Dup', email: 'dup-err@example.com', password: 'password123', role: 'VIEWER',
    });
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Dup2', email: 'dup-err@example.com', password: 'password123', role: 'VIEWER',
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('all error responses have { success: false, error: { code, message } } shape', async () => {
    const res = await request(app).get('/api/v1/records');
    expect(res.body).toMatchObject({
      success: false,
      error: { code: expect.any(String), message: expect.any(String) },
    });
  });
});
