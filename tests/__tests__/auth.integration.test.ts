import request from 'supertest';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import { app, cleanDatabase } from '../helpers';

beforeAll(cleanDatabase);
afterAll(cleanDatabase);

describe('Auth — integration', () => {
  const base = '/api/v1/auth';

  describe('POST /register', () => {
    it('registers a new user and returns token + safe user', async () => {
      const res = await request(app).post(`${base}/register`).send({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password123',
        role: 'ADMIN',
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('alice@example.com');
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('returns 409 on duplicate email', async () => {
      await request(app).post(`${base}/register`).send({
        name: 'Bob', email: 'dup@example.com', password: 'password123', role: 'VIEWER',
      });
      const res = await request(app).post(`${base}/register`).send({
        name: 'Bob2', email: 'dup@example.com', password: 'password123', role: 'VIEWER',
      });
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('returns 400 on invalid body (missing email)', async () => {
      const res = await request(app).post(`${base}/register`).send({
        name: 'Test', password: 'password123',
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 on password shorter than 8 chars', async () => {
      const res = await request(app).post(`${base}/register`).send({
        name: 'Test', email: 'short@example.com', password: 'short',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /login', () => {
    beforeAll(async () => {
      await request(app).post(`${base}/register`).send({
        name: 'Login User', email: 'login@example.com', password: 'password123', role: 'VIEWER',
      });
    });

    it('returns token on valid credentials', async () => {
      const res = await request(app).post(`${base}/login`).send({
        email: 'login@example.com', password: 'password123',
      });
      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });

    it('returns 401 on wrong password', async () => {
      const res = await request(app).post(`${base}/login`).send({
        email: 'login@example.com', password: 'wrongpassword',
      });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 on non-existent email', async () => {
      const res = await request(app).post(`${base}/login`).send({
        email: 'nobody@example.com', password: 'password123',
      });
      expect(res.status).toBe(401);
    });

    it('returns 400 on missing password', async () => {
      const res = await request(app).post(`${base}/login`).send({ email: 'login@example.com' });
      expect(res.status).toBe(400);
    });
  });
});
