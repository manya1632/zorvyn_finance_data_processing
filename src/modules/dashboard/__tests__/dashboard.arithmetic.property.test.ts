// Feature: finance-data-processing-api, Property 9: Dashboard summary arithmetic correctness
// Validates: Requirements 6.1
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
    get: jest.fn().mockReturnValue(undefined),
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

describe('Property 9: Dashboard summary arithmetic correctness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (cache.get as jest.Mock).mockReturnValue(undefined);
  });

  it('totalIncome = sum of INCOME, totalExpenses = sum of EXPENSE, netBalance = totalIncome - totalExpenses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            type: fc.constantFrom('INCOME' as const, 'EXPENSE' as const),
            amount: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
          }),
          { minLength: 1 }
        ),
        async (records) => {
          const expectedIncome = records
            .filter(r => r.type === 'INCOME')
            .reduce((sum, r) => sum + r.amount, 0);
          const expectedExpenses = records
            .filter(r => r.type === 'EXPENSE')
            .reduce((sum, r) => sum + r.amount, 0);
          const expectedNet = expectedIncome - expectedExpenses;

          // Build groupBy mock result
          const incomeTotal = records
            .filter(r => r.type === 'INCOME')
            .reduce((sum, r) => sum + r.amount, 0);
          const expenseTotal = records
            .filter(r => r.type === 'EXPENSE')
            .reduce((sum, r) => sum + r.amount, 0);

          const groupByResult = [];
          if (incomeTotal > 0) groupByResult.push({ type: 'INCOME', _sum: { amount: incomeTotal } });
          if (expenseTotal > 0) groupByResult.push({ type: 'EXPENSE', _sum: { amount: expenseTotal } });

          (prisma.financialRecord.groupBy as jest.Mock).mockResolvedValue(groupByResult);
          (cache.get as jest.Mock).mockReturnValue(undefined);

          const result = await getSummary();

          const resultIncome = parseFloat(result.totalIncome);
          const resultExpenses = parseFloat(result.totalExpenses);
          const resultNet = parseFloat(result.netBalance);

          expect(Math.abs(resultIncome - expectedIncome)).toBeLessThan(0.01);
          expect(Math.abs(resultExpenses - expectedExpenses)).toBeLessThan(0.01);
          expect(Math.abs(resultNet - expectedNet)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 20 }
    );
  });
});
