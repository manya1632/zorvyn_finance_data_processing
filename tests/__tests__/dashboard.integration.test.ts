import request from 'supertest';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import { app, cleanDatabase, registerAndLogin, authHeader } from '../helpers';

let adminToken: string;
let viewerToken: string;

beforeAll(async () => {
  await cleanDatabase();
  ({ token: adminToken } = await registerAndLogin({ role: 'ADMIN', email: 'admin-dash@example.com' }));
  ({ token: viewerToken } = await registerAndLogin({ role: 'VIEWER', email: 'viewer-dash@example.com' }));

  await request(app).post('/api/v1/records').set(authHeader(adminToken)).send({
    amount: 5000, type: 'INCOME', category: 'salary', date: new Date().toISOString(),
  });
  await request(app).post('/api/v1/records').set(authHeader(adminToken)).send({
    amount: 1200, type: 'EXPENSE', category: 'food', date: new Date().toISOString(),
  });
  await request(app).post('/api/v1/records').set(authHeader(adminToken)).send({
    amount: 800, type: 'EXPENSE', category: 'travel', date: new Date().toISOString(),
  });
});
afterAll(cleanDatabase);

const base = '/api/v1/dashboard';

describe('Dashboard — integration', () => {
  it('GET /summary returns correct totals', async () => {
    const res = await request(app).get(`${base}/summary`).set(authHeader(viewerToken));
    expect(res.status).toBe(200);
    expect(parseFloat(res.body.data.totalIncome)).toBe(5000);
    expect(parseFloat(res.body.data.totalExpenses)).toBe(2000);
    expect(parseFloat(res.body.data.netBalance)).toBe(3000);
  });

  it('GET /category-breakdown returns category totals', async () => {
    const res = await request(app).get(`${base}/category-breakdown`).set(authHeader(viewerToken));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('salary');
    expect(res.body.data).toHaveProperty('food');
    expect(res.body.data).toHaveProperty('travel');
  });

  it('GET /monthly-trends returns array with month/income/expense shape', async () => {
    const res = await request(app).get(`${base}/monthly-trends`).set(authHeader(viewerToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      const trend = res.body.data[0];
      expect(trend).toHaveProperty('month');
      expect(trend).toHaveProperty('income');
      expect(trend).toHaveProperty('expense');
    }
  });

  it('GET /recent-activity returns at most 10 records', async () => {
    const res = await request(app).get(`${base}/recent-activity`).set(authHeader(viewerToken));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(10);
  });

  it('summary reflects new record after cache invalidation', async () => {
    await request(app).post('/api/v1/records').set(authHeader(adminToken)).send({
      amount: 1000, type: 'INCOME', category: 'bonus', date: new Date().toISOString(),
    });
    const res = await request(app).get(`${base}/summary`).set(authHeader(viewerToken));
    expect(parseFloat(res.body.data.totalIncome)).toBe(6000);
  });
});
