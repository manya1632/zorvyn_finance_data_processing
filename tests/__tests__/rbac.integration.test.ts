import request from 'supertest';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import { app, cleanDatabase, registerAndLogin, authHeader } from '../helpers';
import prisma from '../../src/config/database';

let viewerToken: string;
let analystToken: string;
let adminToken: string;
let inactiveToken: string;
let inactiveUserId: string;

beforeAll(async () => {
  await cleanDatabase();
  ({ token: viewerToken } = await registerAndLogin({ role: 'VIEWER', email: 'viewer-rbac@example.com' }));
  ({ token: analystToken } = await registerAndLogin({ role: 'ANALYST', email: 'analyst-rbac@example.com' }));
  ({ token: adminToken } = await registerAndLogin({ role: 'ADMIN', email: 'admin-rbac@example.com' }));
  ({ token: inactiveToken, userId: inactiveUserId } = await registerAndLogin({ role: 'ADMIN', email: 'inactive-rbac@example.com' }));

  await prisma.user.update({ where: { id: inactiveUserId }, data: { status: 'INACTIVE' } });
});
afterAll(cleanDatabase);

describe('RBAC — integration', () => {
  describe('VIEWER', () => {
    it('can access GET /dashboard/summary', async () => {
      const res = await request(app).get('/api/v1/dashboard/summary').set(authHeader(viewerToken));
      expect(res.status).toBe(200);
    });

    it('cannot access GET /records', async () => {
      const res = await request(app).get('/api/v1/records').set(authHeader(viewerToken));
      expect(res.status).toBe(403);
    });

    it('cannot access GET /users', async () => {
      const res = await request(app).get('/api/v1/users').set(authHeader(viewerToken));
      expect(res.status).toBe(403);
    });

    it('cannot POST /records', async () => {
      const res = await request(app).post('/api/v1/records').set(authHeader(viewerToken)).send({
        amount: 100, type: 'INCOME', category: 'test', date: new Date().toISOString(),
      });
      expect(res.status).toBe(403);
    });
  });

  describe('ANALYST', () => {
    it('can access GET /records', async () => {
      const res = await request(app).get('/api/v1/records').set(authHeader(analystToken));
      expect(res.status).toBe(200);
    });

    it('can access GET /dashboard/summary', async () => {
      const res = await request(app).get('/api/v1/dashboard/summary').set(authHeader(analystToken));
      expect(res.status).toBe(200);
    });

    it('cannot POST /records', async () => {
      const res = await request(app).post('/api/v1/records').set(authHeader(analystToken)).send({
        amount: 100, type: 'INCOME', category: 'test', date: new Date().toISOString(),
      });
      expect(res.status).toBe(403);
    });

    it('cannot access GET /users', async () => {
      const res = await request(app).get('/api/v1/users').set(authHeader(analystToken));
      expect(res.status).toBe(403);
    });
  });

  describe('ADMIN', () => {
    it('can access GET /users', async () => {
      const res = await request(app).get('/api/v1/users').set(authHeader(adminToken));
      expect(res.status).toBe(200);
    });

    it('can POST /records', async () => {
      const res = await request(app).post('/api/v1/records').set(authHeader(adminToken)).send({
        amount: 500, type: 'INCOME', category: 'test', date: new Date().toISOString(),
      });
      expect(res.status).toBe(201);
    });
  });

  describe('INACTIVE user', () => {
    it('returns 403 on any protected route regardless of role', async () => {
      const res = await request(app).get('/api/v1/dashboard/summary').set(authHeader(inactiveToken));
      expect(res.status).toBe(403);
    });

    it('returns 403 on records endpoint', async () => {
      const res = await request(app).get('/api/v1/records').set(authHeader(inactiveToken));
      expect(res.status).toBe(403);
    });
  });
});
