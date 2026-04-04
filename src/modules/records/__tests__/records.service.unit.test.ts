import { AppError } from '../../../utils/errors';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    financialRecord: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../../config/cache', () => ({
  __esModule: true,
  default: { del: jest.fn() },
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

jest.mock('../../audit/audit.service', () => ({
  writeAuditLog: jest.fn().mockResolvedValue(undefined),
}));

import prisma from '../../../config/database';
import cache from '../../../config/cache';
import * as auditService from '../../audit/audit.service';
import * as recordsService from '../records.service';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockCache = cache as jest.Mocked<typeof cache>;

const mockRecord = {
  id: 'rec-1',
  amount: 100.00,
  type: 'INCOME' as const,
  category: 'salary',
  date: new Date('2024-01-15'),
  notes: 'Monthly salary',
  createdById: 'user-1',
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const ACTOR_ID = 'user-1';
const ACTOR_ROLE = 'ADMIN' as const;

const DASHBOARD_KEYS = [
  'dashboard:summary',
  'dashboard:category-breakdown',
  'dashboard:monthly-trends',
  'dashboard:recent-activity',
];

describe('records.service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createRecord', () => {
    const dto = {
      amount: 100,
      type: 'INCOME' as const,
      category: 'salary',
      date: '2024-01-15',
      notes: 'Monthly salary',
    };

    it('returns the created record', async () => {
      (mockPrisma.financialRecord.create as jest.Mock).mockResolvedValue(mockRecord);

      const result = await recordsService.createRecord(dto, ACTOR_ID, ACTOR_ROLE);
      expect(result.id).toBe('rec-1');
      expect(result.category).toBe('salary');
    });

    it('schedules audit log via setImmediate (fire-and-forget)', async () => {
      (mockPrisma.financialRecord.create as jest.Mock).mockResolvedValue(mockRecord);

      const setImmediateSpy = jest.spyOn(global, 'setImmediate');
      await recordsService.createRecord(dto, ACTOR_ID, ACTOR_ROLE);

      expect(setImmediateSpy).toHaveBeenCalled();
      setImmediateSpy.mockRestore();
    });

    it('invalidates all dashboard cache keys after create', async () => {
      (mockPrisma.financialRecord.create as jest.Mock).mockResolvedValue(mockRecord);

      await recordsService.createRecord(dto, ACTOR_ID, ACTOR_ROLE);

      DASHBOARD_KEYS.forEach(key => {
        expect(mockCache.del).toHaveBeenCalledWith(key);
      });
    });
  });

  describe('listRecords', () => {
    beforeEach(() => {
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue([[mockRecord], 1]);
    });

    it('excludes soft-deleted records (deletedAt: null in where)', async () => {
      await recordsService.listRecords({});
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('returns paginated result with meta', async () => {
      const result = await recordsService.listRecords({ page: '1', limit: '10' });
      expect(result.data).toHaveLength(1);
      expect(result.meta).toMatchObject({ page: 1, limit: 10, total: 1, totalPages: 1 });
    });

    it('applies type filter', async () => {
      await recordsService.listRecords({ type: 'INCOME' });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('applies category filter', async () => {
      await recordsService.listRecords({ category: 'salary' });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('applies date range filter', async () => {
      await recordsService.listRecords({ startDate: '2024-01-01', endDate: '2024-12-31' });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('applies search filter on category and notes', async () => {
      await recordsService.listRecords({ search: 'salary' });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('throws AppError 400 for invalid sort field', async () => {
      await expect(recordsService.listRecords({ sort: 'invalidField:asc' }))
        .rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });
    });
  });

  describe('getRecordById', () => {
    it('returns record when found', async () => {
      (mockPrisma.financialRecord.findFirst as jest.Mock).mockResolvedValue(mockRecord);
      const result = await recordsService.getRecordById('rec-1');
      expect(result.id).toBe('rec-1');
    });

    it('throws AppError 404 for soft-deleted record (findFirst returns null)', async () => {
      (mockPrisma.financialRecord.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(recordsService.getRecordById('rec-1'))
        .rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });
    });
  });

  describe('softDeleteRecord', () => {
    it('sets deletedAt and does not hard-delete', async () => {
      (mockPrisma.financialRecord.findFirst as jest.Mock).mockResolvedValue(mockRecord);
      (mockPrisma.financialRecord.update as jest.Mock).mockResolvedValue({ ...mockRecord, deletedAt: new Date() });

      await recordsService.softDeleteRecord('rec-1', ACTOR_ID, ACTOR_ROLE);

      expect(mockPrisma.financialRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date) }) })
      );
      expect((mockPrisma.financialRecord as any).delete).toBeUndefined();
    });

    it('invalidates all dashboard cache keys after soft-delete', async () => {
      (mockPrisma.financialRecord.findFirst as jest.Mock).mockResolvedValue(mockRecord);
      (mockPrisma.financialRecord.update as jest.Mock).mockResolvedValue({ ...mockRecord, deletedAt: new Date() });

      await recordsService.softDeleteRecord('rec-1', ACTOR_ID, ACTOR_ROLE);

      DASHBOARD_KEYS.forEach(key => {
        expect(mockCache.del).toHaveBeenCalledWith(key);
      });
    });

    it('throws AppError 404 when record not found', async () => {
      (mockPrisma.financialRecord.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(recordsService.softDeleteRecord('nonexistent', ACTOR_ID, ACTOR_ROLE))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('updateRecord', () => {
    it('returns updated record', async () => {
      const updated = { ...mockRecord, category: 'bonus' };
      (mockPrisma.financialRecord.findFirst as jest.Mock).mockResolvedValue(mockRecord);
      (mockPrisma.financialRecord.update as jest.Mock).mockResolvedValue(updated);

      const result = await recordsService.updateRecord('rec-1', { category: 'bonus' }, ACTOR_ID, ACTOR_ROLE);
      expect(result.category).toBe('bonus');
    });

    it('triggers audit log via setImmediate with correct diff', async () => {
      const updated = { ...mockRecord, category: 'bonus' };
      (mockPrisma.financialRecord.findFirst as jest.Mock).mockResolvedValue(mockRecord);
      (mockPrisma.financialRecord.update as jest.Mock).mockResolvedValue(updated);

      const setImmediateSpy = jest.spyOn(global, 'setImmediate');
      await recordsService.updateRecord('rec-1', { category: 'bonus' }, ACTOR_ID, ACTOR_ROLE);

      expect(setImmediateSpy).toHaveBeenCalled();
      setImmediateSpy.mockRestore();
    });

    it('throws AppError 404 when record not found', async () => {
      (mockPrisma.financialRecord.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(recordsService.updateRecord('nonexistent', { category: 'x' }, ACTOR_ID, ACTOR_ROLE))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
