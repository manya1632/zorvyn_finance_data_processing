import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/config/database';

export const app = createApp();

export async function cleanDatabase() {
  await prisma.auditLog.deleteMany();
  await prisma.financialRecord.deleteMany();
  await prisma.user.deleteMany();
}

export async function registerAndLogin(overrides: {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
} = {}): Promise<{ token: string; userId: string }> {
  const payload = {
    name: overrides.name ?? 'Test User',
    email: overrides.email ?? `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: overrides.password ?? 'password123',
    role: overrides.role ?? 'ADMIN',
  };
  const res = await request(app).post('/api/v1/auth/register').send(payload);
  return { token: res.body.data.token, userId: res.body.data.user.id };
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
