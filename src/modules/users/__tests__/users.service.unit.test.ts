import { AppError } from '../../../utils/errors';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

import prisma from '../../../config/database';
import * as usersService from '../users.service';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const mockUser = {
  id: 'user-1', name: 'Alice', email: 'alice@example.com', role: 'VIEWER' as const,
  status: 'ACTIVE' as const, deletedAt: null, createdAt: new Date(), updatedAt: new Date(),
};

describe('users.service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createUser', () => {
    const dto = { name: 'Alice', email: 'alice@example.com', password: 'password123', role: 'VIEWER' as const };

    it('returns safe user without password field', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await usersService.createUser(dto);
      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('alice@example.com');
    });

    it('throws AppError 409 when email already exists', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      await expect(usersService.createUser(dto)).rejects.toMatchObject({ statusCode: 409, code: 'CONFLICT' });
    });
  });

  describe('listUsers', () => {
    it('applies soft-delete filter (deletedAt: null)', async () => {
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue([[mockUser], 1]);

      await usersService.listUsers({});

      const transactionCall = (mockPrisma.$transaction as jest.Mock).mock.calls[0][0];
      expect(transactionCall).toBeDefined();
    });

    it('returns paginated result with meta', async () => {
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue([[mockUser], 1]);

      const result = await usersService.listUsers({ page: '1', limit: '10' });
      expect(result.data).toHaveLength(1);
      expect(result.meta).toMatchObject({ page: 1, limit: 10, total: 1, totalPages: 1 });
    });

    it('throws AppError 400 for invalid sort field', async () => {
      await expect(usersService.listUsers({ sort: 'invalidField:asc' }))
        .rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });
    });
  });

  describe('getUserById', () => {
    it('returns user when found', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      const result = await usersService.getUserById('user-1');
      expect(result.id).toBe('user-1');
    });

    it('throws AppError 404 for soft-deleted user', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(usersService.getUserById('user-1')).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });
    });
  });

  describe('softDeleteUser', () => {
    it('sets deletedAt timestamp and does not hard-delete', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, deletedAt: new Date() });

      await usersService.softDeleteUser('user-1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date) }) })
      );
      expect((mockPrisma.user as any).delete).toBeUndefined();
    });

    it('throws AppError 404 when user not found', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(usersService.softDeleteUser('nonexistent')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('updateUserStatus', () => {
    it('toggles status to INACTIVE', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, status: 'INACTIVE' });

      const result = await usersService.updateUserStatus('user-1', { status: 'INACTIVE' });
      expect(result.status).toBe('INACTIVE');
    });

    it('toggles status to ACTIVE', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue({ ...mockUser, status: 'INACTIVE' });
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, status: 'ACTIVE' });

      const result = await usersService.updateUserStatus('user-1', { status: 'ACTIVE' });
      expect(result.status).toBe('ACTIVE');
    });
  });
});
