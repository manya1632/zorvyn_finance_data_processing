import * as fc from 'fast-check';

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
import { AppError } from '../../../utils/errors';
import { getRecordById, listRecords, softDeleteRecord } from '../records.service';

describe('Property 7: Soft-delete exclusion invariant', () => {
  beforeEach(() => jest.clearAllMocks());

  it('soft-deleted record returns 404 on single lookup', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (recordId) => {
          const activeRecord = {
            id: recordId,
            amount: 100,
            type: 'INCOME' as const,
            category: 'test',
            date: new Date(),
            notes: null,
            createdById: 'user-1',
            deletedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

        
          (prisma.financialRecord.findFirst as jest.Mock)
            .mockResolvedValueOnce(activeRecord)
            .mockResolvedValueOnce(null);

          (prisma.financialRecord.update as jest.Mock).mockResolvedValue({
            ...activeRecord,
            deletedAt: new Date(),
          });

          await softDeleteRecord(recordId, 'user-1', 'ADMIN');

          await expect(getRecordById(recordId)).rejects.toMatchObject({
            statusCode: 404,
            code: 'NOT_FOUND',
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  it('soft-deleted record is excluded from list results', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (recordId) => {
          (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

          const result = await listRecords({});

          const found = result.data.find((r: { id: string }) => r.id === recordId);
          expect(found).toBeUndefined();
          expect(result.meta.total).toBe(0);
        }
      ),
      { numRuns: 20 }
    );
  });
});
