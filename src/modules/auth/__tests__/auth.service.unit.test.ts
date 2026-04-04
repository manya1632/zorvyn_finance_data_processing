import { AppError } from '../../../utils/errors';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));

jest.mock('../../../config', () => ({
  config: {
    jwt: { secret: 'test_secret_at_least_32_chars_long_here', expiresIn: '24h' },
  },
}));

import prisma from '../../../config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { registerUser, loginUser } from '../auth.service';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('auth.service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('registerUser', () => {
    const dto = { name: 'Alice', email: 'alice@example.com', password: 'password123', role: 'VIEWER' as const };

    it('creates user and returns token + safe user (no password field)', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-1', name: 'Alice', email: 'alice@example.com', role: 'VIEWER', status: 'ACTIVE', createdAt: new Date(),
      });

      const result = await registerUser(dto);

      expect(result.token).toBeDefined();
      expect(result.user).not.toHaveProperty('password');
      expect(result.user.email).toBe('alice@example.com');
    });

    it('throws AppError 409 when email already exists', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue({ id: 'existing' });

      await expect(registerUser(dto)).rejects.toThrow(AppError);
      await expect(registerUser(dto)).rejects.toMatchObject({ statusCode: 409, code: 'CONFLICT' });
    });

    it('hashes password with bcrypt before storing', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-1', name: 'Alice', email: 'alice@example.com', role: 'VIEWER', status: 'ACTIVE', createdAt: new Date(),
      });

      await registerUser(dto);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
    });

    it('JWT payload contains correct sub, role, and exp = iat + 86400', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-1', name: 'Alice', email: 'alice@example.com', role: 'VIEWER', status: 'ACTIVE', createdAt: new Date(),
      });

      const result = await registerUser(dto);
      const decoded = jwt.decode(result.token) as { sub: string; role: string; iat: number; exp: number };

      expect(decoded.sub).toBe('user-1');
      expect(decoded.role).toBe('VIEWER');
      expect(decoded.exp - decoded.iat).toBe(86400);
    });
  });

  describe('loginUser', () => {
    const dto = { email: 'alice@example.com', password: 'password123' };
    const mockUser = { id: 'user-1', name: 'Alice', email: 'alice@example.com', password: 'hashed', role: 'VIEWER' as const, status: 'ACTIVE' as const, createdAt: new Date() };

    it('returns token + safe user on valid credentials', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await loginUser(dto);
      expect(result.token).toBeDefined();
      expect(result.user).not.toHaveProperty('password');
    });

    it('throws AppError 401 when user not found', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(loginUser(dto)).rejects.toMatchObject({ statusCode: 401, code: 'UNAUTHORIZED' });
    });

    it('throws AppError 401 when password does not match', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(loginUser(dto)).rejects.toMatchObject({ statusCode: 401, code: 'UNAUTHORIZED' });
    });
  });
});
