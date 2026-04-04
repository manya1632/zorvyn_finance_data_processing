import * as fc from 'fast-check';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    financialRecord: {
      findFirst: jest.fn(),
      create: jest.fn(),
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
import { createRecord, getRecordById } from '../records.service';

describe('Property 6: Create/read round-trip for financial records', () => {
  it('creating then retrieving by id returns equivalent fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          amount: fc.float({ min: Math.fround(0.01), max: Math.fround(1_000_000), noNaN: true }),
          type: fc.constantFrom('INCOME' as const, 'EXPENSE' as const),
          category: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          date: fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') }),
          notes: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
        }),
        async (payload) => {
          const recordId = `rec-${Math.random()}`;
          const storedRecord = {
            id: recordId,
            amount: payload.amount,
            type: payload.type,
            category: payload.category,
            date: payload.date,
            notes: payload.notes ?? null,
            createdById: 'user-1',
            deletedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          (prisma.financialRecord.create as jest.Mock).mockResolvedValue(storedRecord);
          (prisma.financialRecord.findFirst as jest.Mock).mockResolvedValue(storedRecord);

          const dto = {
            amount: payload.amount,
            type: payload.type,
            category: payload.category,
            date: payload.date.toISOString(),
            notes: payload.notes,
          };

          const created = await createRecord(dto, 'user-1', 'ADMIN');
          const retrieved = await getRecordById(created.id);

          expect(retrieved.id).toBe(created.id);
          expect(retrieved.type).toBe(payload.type);
          expect(retrieved.category).toBe(payload.category);
          expect(retrieved.amount).toBe(payload.amount);
        }
      ),
      { numRuns: 20 }
    );
  });
});
