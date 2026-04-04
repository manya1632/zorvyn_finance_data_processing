// Feature: finance-data-processing-api
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
import * as dashboardService from '../dashboard.service';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockCache = cache as jest.Mocked<typeof cache>;

describe('dashboard.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: cache miss
    (mockCache.get as jest.Mock).mockReturnValue(undefined);
  });

  describe('getSummary', () => {
    it('returns correct totalIncome, totalExpenses, netBalance from mocked groupBy', async () => {
      (mockPrisma.financialRecord.groupBy as jest.Mock).mockResolvedValue([
        { type: 'INCOME', _sum: { amount: 5000 } },
        { type: 'EXPENSE', _sum: { amount: 3200 } },
      ]);

      const result = await dashboardService.getSummary();

      expect(result.totalIncome).toBe('5000.00');
      expect(result.totalExpenses).toBe('3200.00');
      expect(result.netBalance).toBe('1800.00');
    });

    it('returns zero values when no records exist', async () => {
      (mockPrisma.financialRecord.groupBy as jest.Mock).mockResolvedValue([]);

      const result = await dashboardService.getSummary();

      expect(result.totalIncome).toBe('0.00');
      expect(result.totalExpenses).toBe('0.00');
      expect(result.netBalance).toBe('0.00');
    });

    it('cache hit path skips DB call', async () => {
      const cached = { totalIncome: '100.00', totalExpenses: '50.00', netBalance: '50.00' };
      (mockCache.get as jest.Mock).mockReturnValue(cached);

      const result = await dashboardService.getSummary();

      expect(result).toEqual(cached);
      expect(mockPrisma.financialRecord.groupBy).not.toHaveBeenCalled();
    });

    it('cache miss path queries DB and populates cache', async () => {
      (mockPrisma.financialRecord.groupBy as jest.Mock).mockResolvedValue([
        { type: 'INCOME', _sum: { amount: 1000 } },
      ]);

      const result = await dashboardService.getSummary();

      expect(mockPrisma.financialRecord.groupBy).toHaveBeenCalledTimes(1);
      expect(mockCache.set).toHaveBeenCalledWith('dashboard:summary', result, 60);
    });
  });

  describe('getCategoryBreakdown', () => {
    it('returns correct category-to-total mapping', async () => {
      (mockPrisma.financialRecord.groupBy as jest.Mock).mockResolvedValue([
        { category: 'salary', _sum: { amount: 5000 } },
        { category: 'food', _sum: { amount: 320.5 } },
      ]);

      const result = await dashboardService.getCategoryBreakdown();

      expect(result).toEqual({ salary: '5000.00', food: '320.50' });
    });

    it('cache hit skips DB call', async () => {
      const cached = { salary: '5000.00' };
      (mockCache.get as jest.Mock).mockReturnValue(cached);

      const result = await dashboardService.getCategoryBreakdown();

      expect(result).toEqual(cached);
      expect(mockPrisma.financialRecord.groupBy).not.toHaveBeenCalled();
    });

    it('cache miss queries DB and populates cache', async () => {
      (mockPrisma.financialRecord.groupBy as jest.Mock).mockResolvedValue([
        { category: 'salary', _sum: { amount: 5000 } },
      ]);

      const result = await dashboardService.getCategoryBreakdown();

      expect(mockPrisma.financialRecord.groupBy).toHaveBeenCalledTimes(1);
      expect(mockCache.set).toHaveBeenCalledWith('dashboard:category-breakdown', result, 60);
    });
  });

  describe('getMonthlyTrends', () => {
    it('returns array in { month, income, expense } shape', async () => {
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([
        { month: '2024-01', income: 5000, expense: 3200 },
        { month: '2024-02', income: 4500, expense: 2800 },
      ]);

      const result = await dashboardService.getMonthlyTrends();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ month: '2024-01', income: 5000, expense: 3200 });
      expect(result[1]).toMatchObject({ month: '2024-02', income: 4500, expense: 2800 });
    });

    it('cache hit skips DB call', async () => {
      const cached = [{ month: '2024-01', income: 5000, expense: 3200 }];
      (mockCache.get as jest.Mock).mockReturnValue(cached);

      const result = await dashboardService.getMonthlyTrends();

      expect(result).toEqual(cached);
      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('cache miss queries DB and populates cache', async () => {
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([
        { month: '2024-01', income: 5000, expense: 3200 },
      ]);

      const result = await dashboardService.getMonthlyTrends();

      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(mockCache.set).toHaveBeenCalledWith('dashboard:monthly-trends', result, 60);
    });
  });

  describe('getRecentActivity', () => {
    it('returns array of recent records', async () => {
      const records = Array.from({ length: 5 }, (_, i) => ({
        id: `rec-${i}`,
        amount: 100,
        type: 'INCOME',
        category: 'salary',
        date: new Date(),
        notes: null,
        createdById: 'user-1',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      (mockPrisma.financialRecord.findMany as jest.Mock).mockResolvedValue(records);

      const result = await dashboardService.getRecentActivity();

      expect(result).toHaveLength(5);
    });

    it('cache hit skips DB call', async () => {
      const cached = [{ id: 'rec-1' }];
      (mockCache.get as jest.Mock).mockReturnValue(cached);

      const result = await dashboardService.getRecentActivity();

      expect(result).toEqual(cached);
      expect(mockPrisma.financialRecord.findMany).not.toHaveBeenCalled();
    });
  });
});
