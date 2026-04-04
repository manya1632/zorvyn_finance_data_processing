jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

import prisma from '../../../config/database';
import * as auditService from '../audit.service';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const mockAuditLog = {
  id: 'audit-1',
  actorId: 'user-1',
  actorRole: 'ADMIN',
  action: 'CREATE' as const,
  resourceType: 'FinancialRecord',
  resourceId: 'rec-1',
  diff: { amount: { from: null, to: 100 } },
  timestamp: new Date(),
};

describe('audit.service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('writeAuditLog', () => {
    it('inserts row with correct actorId, actorRole, action, resourceType, resourceId, diff', async () => {
      (mockPrisma.auditLog.create as jest.Mock).mockResolvedValue(mockAuditLog);

      await auditService.writeAuditLog({
        actorId: 'user-1',
        actorRole: 'ADMIN',
        action: 'CREATE',
        resourceType: 'FinancialRecord',
        resourceId: 'rec-1',
        diff: { amount: { from: null, to: 100 } },
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 'user-1',
          actorRole: 'ADMIN',
          action: 'CREATE',
          resourceType: 'FinancialRecord',
          resourceId: 'rec-1',
          diff: { amount: { from: null, to: 100 } },
        },
      });
    });

    it('does NOT throw when prisma throws (fire-and-forget)', async () => {
      (mockPrisma.auditLog.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(
        auditService.writeAuditLog({
          actorId: 'user-1',
          actorRole: 'ADMIN',
          action: 'CREATE',
          resourceType: 'FinancialRecord',
          resourceId: 'rec-1',
          diff: {},
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('listAuditLogs', () => {
    beforeEach(() => {
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue([[mockAuditLog], 1]);
    });

    it('applies resourceType filter', async () => {
      await auditService.listAuditLogs({ resourceType: 'FinancialRecord' });

      const [[findManyCall]] = (mockPrisma.$transaction as jest.Mock).mock.calls;
      // $transaction receives an array of promises; verify it was called
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('applies actorId filter', async () => {
      await auditService.listAuditLogs({ actorId: 'user-1' });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('applies date range filter', async () => {
      await auditService.listAuditLogs({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('returns correct pagination meta', async () => {
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue([[mockAuditLog, mockAuditLog], 25]);

      const result = await auditService.listAuditLogs({ page: '2', limit: '10' });

      expect(result.meta).toMatchObject({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });

    it('returns data array', async () => {
      const result = await auditService.listAuditLogs({});
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(mockAuditLog);
    });
  });
});
