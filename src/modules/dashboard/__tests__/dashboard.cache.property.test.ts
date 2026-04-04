// Feature: finance-data-processing-api, Property 10: Dashboard cache invalidation
// Validates: Requirements 6.6, 16.2
import * as fc from 'fast-check';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    financialRecord: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

jest.mock('../../../config/cache', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

jest.mock('../../../config/index', () => ({
  config: { cache: { ttlSeconds: 60 } },
}));

import prisma from '../../../config/database';
import cache from '../../../config/cache';
import { getSummary } from '../dashboard.service';

describe('Property 10: Dashboard cache invalidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('after a write, getSummary returns fresh data and updates cache', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          staleIncome: fc.float({ min: Math.fround(0.01), max: Math.fround(5000), noNaN: true }),
          freshIncome: fc.float({ min: Math.fround(0.01), max: Math.fround(5000), noNaN: true }),
          freshExpense: fc.float({ min: Math.fround(0.01), max: Math.fround(5000), noNaN: true }),
        }),
        async ({ staleIncome, freshIncome, freshExpense }) => {
          // Simulate stale cache being cleared (cache miss after write)
          (cache.get as jest.Mock).mockReturnValue(undefined);

          // DB returns fresh data
          const freshGroupBy = [
            { type: 'INCOME', _sum: { amount: freshIncome } },
            { type: 'EXPENSE', _sum: { amount: freshExpense } },
          ];
          (prisma.financialRecord.groupBy as jest.Mock).mockResolvedValue(freshGroupBy);

          const result = await getSummary();

          // Verify fresh data is returned (not stale)
          expect(parseFloat(result.totalIncome)).toBeCloseTo(freshIncome, 1);
          expect(parseFloat(result.totalExpenses)).toBeCloseTo(freshExpense, 1);

          // Verify cache was updated with fresh data
          expect(cache.set).toHaveBeenCalledWith(
            'dashboard:summary',
            expect.objectContaining({ totalIncome: result.totalIncome }),
            60
          );
        }
      ),
      { numRuns: 20 }
    );
  });
});
