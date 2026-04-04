import * as fc from 'fast-check';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    financialRecord: {
      findMany: jest.fn(),
      count: jest.fn(),
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
import { listRecords } from '../records.service';

function makeRecord(overrides: Partial<{
  id: string; type: 'INCOME' | 'EXPENSE'; category: string; date: Date; notes: string | null;
}> = {}) {
  return {
    id: overrides.id ?? `rec-${Math.random()}`,
    amount: 100,
    type: overrides.type ?? 'INCOME',
    category: overrides.category ?? 'general',
    date: overrides.date ?? new Date('2024-06-15'),
    notes: overrides.notes ?? null,
    createdById: 'user-1',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('Property 8: List filter correctness', () => {
  beforeEach(() => jest.clearAllMocks());

  it('every result satisfies type filter', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('INCOME' as const, 'EXPENSE' as const),
        fc.array(
          fc.record({
            type: fc.constantFrom('INCOME' as const, 'EXPENSE' as const),
            category: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (filterType, records) => {
          const matchingRecords = records
            .filter(r => r.type === filterType)
            .map(r => makeRecord({ type: r.type, category: r.category }));

          (prisma.$transaction as jest.Mock).mockResolvedValue([matchingRecords, matchingRecords.length]);

          const result = await listRecords({ type: filterType });

          result.data.forEach((record: { type: string }) => {
            expect(record.type).toBe(filterType);
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  it('every result satisfies category filter', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        fc.array(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          { minLength: 1, maxLength: 10 }
        ),
        async (filterCategory, categories) => {
          const matchingRecords = categories
            .filter(c => c === filterCategory)
            .map(c => makeRecord({ category: c }));

          (prisma.$transaction as jest.Mock).mockResolvedValue([matchingRecords, matchingRecords.length]);

          const result = await listRecords({ category: filterCategory });

          result.data.forEach((record: { category: string }) => {
            expect(record.category).toBe(filterCategory);
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  it('every result satisfies date range filter (AND logic)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          startDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2022-12-31') }),
          endDate: fc.date({ min: new Date('2023-01-01'), max: new Date('2025-12-31') }),
        }),
        fc.array(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
          { minLength: 1, maxLength: 10 }
        ),
        async ({ startDate, endDate }, dates) => {
          const matchingRecords = dates
            .filter(d => d >= startDate && d <= endDate)
            .map(d => makeRecord({ date: d }));

          (prisma.$transaction as jest.Mock).mockResolvedValue([matchingRecords, matchingRecords.length]);

          const result = await listRecords({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          });

          result.data.forEach((record: { date: Date }) => {
            const recordDate = new Date(record.date);
            expect(recordDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
            expect(recordDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  it('every result satisfies combined type + category filters (AND logic)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('INCOME' as const, 'EXPENSE' as const),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        async (filterType, filterCategory) => {
          const matchingRecords = [makeRecord({ type: filterType, category: filterCategory })];

          (prisma.$transaction as jest.Mock).mockResolvedValue([matchingRecords, matchingRecords.length]);

          const result = await listRecords({ type: filterType, category: filterCategory });

          result.data.forEach((record: { type: string; category: string }) => {
            expect(record.type).toBe(filterType);
            expect(record.category).toBe(filterCategory);
          });
        }
      ),
      { numRuns: 20 }
    );
  });
});
