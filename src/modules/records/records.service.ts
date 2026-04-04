import { Role } from '@prisma/client';
import prisma from '../../config/database';
import cache from '../../config/cache';
import logger from '../../config/logger';
import { AppError } from '../../utils/errors';
import { parsePaginationParams, buildPaginationMeta } from '../../utils/pagination';
import { computeDiff } from '../../utils/diff';
import * as auditService from '../audit/audit.service'
import type { CreateRecordDto, UpdateRecordDto, ListRecordsQuery } from './records.schema';
import { ALLOWED_RECORD_SORT_FIELDS } from './records.schema';

const DASHBOARD_CACHE_KEYS = [
  'dashboard:summary',
  'dashboard:category-breakdown',
  'dashboard:monthly-trends',
  'dashboard:recent-activity',
];

function invalidateDashboardCache(): void {
  DASHBOARD_CACHE_KEYS.forEach(key => cache.del(key));
}

function parseSortParam(sort?: string): { field: string; order: 'asc' | 'desc' } {
  if (!sort) return { field: 'createdAt', order: 'desc' };
  const [field, order] = sort.split(':');
  if (!ALLOWED_RECORD_SORT_FIELDS.includes(field as typeof ALLOWED_RECORD_SORT_FIELDS[number])) {
    throw new AppError(400, 'VALIDATION_ERROR', `Invalid sort field: ${field}. Allowed: ${ALLOWED_RECORD_SORT_FIELDS.join(', ')}`);
  }
  return { field, order: order === 'asc' ? 'asc' : 'desc' };
}

export async function createRecord(dto: CreateRecordDto, actorId: string, actorRole: Role) {
  const record = await prisma.financialRecord.create({
    data: {
      amount: dto.amount,
      type: dto.type,
      category: dto.category,
      date: new Date(dto.date),
      notes: dto.notes,
      createdById: actorId,
    },
  });

  invalidateDashboardCache();

  setImmediate(() => {
    auditService.writeAuditLog({
      actorId,
      actorRole,
      action: 'CREATE',
      resourceType: 'FinancialRecord',
      resourceId: record.id,
      diff: computeDiff({}, record as unknown as Record<string, unknown>),
    }).catch(err => logger.error('Audit log write failed', { err }));
  });

  return record;
}

export async function listRecords(query: ListRecordsQuery) {
  const { page, limit, skip } = parsePaginationParams(query as Record<string, unknown>);
  const { field, order } = parseSortParam(query.sort);

  const searchFilter = query.search
    ? {
        OR: [
          { category: { contains: query.search, mode: 'insensitive' as const } },
          { notes: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const dateFilter =
    query.startDate || query.endDate
      ? {
          date: {
            ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
            ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
          },
        }
      : {};

  const where = {
    deletedAt: null,
    ...(query.type && { type: query.type }),
    ...(query.category && { category: query.category }),
    ...dateFilter,
    ...searchFilter,
  };

  const [records, total] = await prisma.$transaction([
    prisma.financialRecord.findMany({
      where,
      orderBy: { [field]: order },
      skip,
      take: limit,
    }),
    prisma.financialRecord.count({ where }),
  ]);

  return { data: records, meta: buildPaginationMeta(total, page, limit) };
}

export async function getRecordById(id: string) {
  const record = await prisma.financialRecord.findFirst({ where: { id, deletedAt: null } });
  if (!record) throw new AppError(404, 'NOT_FOUND', 'Record not found');
  return record;
}

export async function updateRecord(id: string, dto: UpdateRecordDto, actorId: string, actorRole: Role) {
  const before = await getRecordById(id);

  const updateData: Record<string, unknown> = {};
  if (dto.amount !== undefined) updateData.amount = dto.amount;
  if (dto.type !== undefined) updateData.type = dto.type;
  if (dto.category !== undefined) updateData.category = dto.category;
  if (dto.date !== undefined) updateData.date = new Date(dto.date);
  if (dto.notes !== undefined) updateData.notes = dto.notes;

  const after = await prisma.financialRecord.update({
    where: { id },
    data: updateData,
  });

  invalidateDashboardCache();

  setImmediate(() => {
    auditService.writeAuditLog({
      actorId,
      actorRole,
      action: 'UPDATE',
      resourceType: 'FinancialRecord',
      resourceId: id,
      diff: computeDiff(before as unknown as Record<string, unknown>, after as unknown as Record<string, unknown>),
    }).catch(err => logger.error('Audit log write failed', { err }));
  });

  return after;
}

export async function softDeleteRecord(id: string, actorId: string, actorRole: Role) {
  const before = await getRecordById(id);

  const deletedAt = new Date();
  await prisma.financialRecord.update({ where: { id }, data: { deletedAt } });

  invalidateDashboardCache();

  setImmediate(() => {
    auditService.writeAuditLog({
      actorId,
      actorRole,
      action: 'DELETE',
      resourceType: 'FinancialRecord',
      resourceId: id,
      diff: computeDiff(before as unknown as Record<string, unknown>, { deletedAt }),
    }).catch(err => logger.error('Audit log write failed', { err }));
  });
}
