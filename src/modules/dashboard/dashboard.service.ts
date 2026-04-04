import prisma from '../../config/database';
import cache from '../../config/cache';
import logger from '../../config/logger';
import { config } from '../../config';

const CACHE_KEYS = {
  SUMMARY: 'dashboard:summary',
  CATEGORY_BREAKDOWN: 'dashboard:category-breakdown',
  MONTHLY_TRENDS: 'dashboard:monthly-trends',
  RECENT_ACTIVITY: 'dashboard:recent-activity',
} as const;

export interface DashboardSummary {
  totalIncome: string;
  totalExpenses: string;
  netBalance: string;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
}

async function withCache<T>(key: string, queryDB: () => Promise<T>): Promise<T> {
  try {
    const cached = cache.get<T>(key);
    if (cached !== undefined) return cached;
  } catch (err) {
    logger.warn('Cache get failed, falling back to DB', { key, err });
  }

  const result = await queryDB();

  try {
    cache.set(key, result, config.cache.ttlSeconds);
  } catch (err) {
    logger.warn('Cache set failed', { key, err });
  }

  return result;
}

export async function getSummary(): Promise<DashboardSummary> {
  return withCache(CACHE_KEYS.SUMMARY, async () => {
    const groups = await prisma.financialRecord.groupBy({
      by: ['type'],
      where: { deletedAt: null },
      _sum: { amount: true },
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const group of groups) {
      const sum = Number(group._sum.amount ?? 0);
      if (group.type === 'INCOME') totalIncome = sum;
      else if (group.type === 'EXPENSE') totalExpenses = sum;
    }

    const netBalance = totalIncome - totalExpenses;

    return {
      totalIncome: totalIncome.toFixed(2),
      totalExpenses: totalExpenses.toFixed(2),
      netBalance: netBalance.toFixed(2),
    };
  });
}

export async function getCategoryBreakdown(): Promise<Record<string, string>> {
  return withCache(CACHE_KEYS.CATEGORY_BREAKDOWN, async () => {
    const groups = await prisma.financialRecord.groupBy({
      by: ['category'],
      where: { deletedAt: null },
      _sum: { amount: true },
    });

    const result: Record<string, string> = {};
    for (const group of groups) {
      result[group.category] = Number(group._sum.amount ?? 0).toFixed(2);
    }
    return result;
  });
}

interface MonthlyTrendRow {
  month: string;
  income: number;
  expense: number;
}

export async function getMonthlyTrends(): Promise<MonthlyTrend[]> {
  return withCache(CACHE_KEYS.MONTHLY_TRENDS, async () => {
    const rows = await prisma.$queryRaw<MonthlyTrendRow[]>`
      SELECT
        TO_CHAR(date, 'YYYY-MM') AS month,
        SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END)::float AS income,
        SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END)::float AS expense
      FROM financial_records
      WHERE "deletedAt" IS NULL
        AND date >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month ASC
    `;

    return rows.map(row => ({
      month: row.month,
      income: Number(row.income),
      expense: Number(row.expense),
    }));
  });
}

export async function getRecentActivity() {
  return withCache(CACHE_KEYS.RECENT_ACTIVITY, async () => {
    return prisma.financialRecord.findMany({
      where: { deletedAt: null },
      orderBy: { date: 'desc' },
      take: 10,
    });
  });
}
