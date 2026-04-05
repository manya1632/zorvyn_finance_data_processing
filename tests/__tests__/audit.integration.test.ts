import request from 'supertest';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import { app, cleanDatabase, registerAndLogin, authHeader } from '../helpers';

let adminToken: string;

beforeAll(async () => {
  await cleanDatabase();
  ({ token: adminToken } = await registerAndLogin({ role: 'ADMIN', email: 'admin-audit@example.com' }));
});
afterAll(cleanDatabase);

const recordsBase = '/api/v1/records';
const auditBase = '/api/v1/audit-logs';

const waitForAudit = () => new Promise(resolve => setTimeout(resolve, 100));

describe('Audit logs — integration', () => {
  let recordId: string;

  it('creates an audit entry with action=CREATE after POST /records', async () => {
    const createRes = await request(app).post(recordsBase).set(authHeader(adminToken)).send({
      amount: 999, type: 'INCOME', category: 'audit-test', date: new Date().toISOString(),
    });
    recordId = createRes.body.data.id;

    await waitForAudit();

    const res = await request(app)
      .get(`${auditBase}?resourceType=FinancialRecord`)
      .set(authHeader(adminToken));
    expect(res.status).toBe(200);
    const entry = res.body.data.find((e: { resourceId: string; action: string }) =>
      e.resourceId === recordId && e.action === 'CREATE'
    );
    expect(entry).toBeDefined();
    expect(entry.actorRole).toBe('ADMIN');
  });

  it('creates an audit entry with action=UPDATE after PUT /records/:id', async () => {
    await request(app).put(`${recordsBase}/${recordId}`).set(authHeader(adminToken)).send({ notes: 'audit update' });
    await waitForAudit();

    const res = await request(app)
      .get(`${auditBase}?resourceType=FinancialRecord`)
      .set(authHeader(adminToken));
    const entry = res.body.data.find((e: { resourceId: string; action: string }) =>
      e.resourceId === recordId && e.action === 'UPDATE'
    );
    expect(entry).toBeDefined();
    expect(entry.diff).toBeDefined();
  });

  it('creates an audit entry with action=DELETE after DELETE /records/:id', async () => {
    await request(app).delete(`${recordsBase}/${recordId}`).set(authHeader(adminToken));
    await waitForAudit();

    const res = await request(app)
      .get(`${auditBase}?resourceType=FinancialRecord`)
      .set(authHeader(adminToken));
    const entry = res.body.data.find((e: { resourceId: string; action: string }) =>
      e.resourceId === recordId && e.action === 'DELETE'
    );
    expect(entry).toBeDefined();
  });

  it('GET /audit-logs returns paginated results with meta', async () => {
    const res = await request(app).get(`${auditBase}?page=1&limit=5`).set(authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 5 });
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /audit-logs filters by resourceType', async () => {
    const res = await request(app)
      .get(`${auditBase}?resourceType=FinancialRecord`)
      .set(authHeader(adminToken));
    expect(res.status).toBe(200);
    res.body.data.forEach((e: { resourceType: string }) => {
      expect(e.resourceType).toBe('FinancialRecord');
    });
  });

  it('GET /audit-logs returns 403 for non-ADMIN', async () => {
    const { token: viewerToken } = await registerAndLogin({ role: 'VIEWER', email: 'viewer-audit@example.com' });
    const res = await request(app).get(auditBase).set(authHeader(viewerToken));
    expect(res.status).toBe(403);
  });
});
