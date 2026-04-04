import { AuditAction, Prisma } from '@prisma/client';
import prisma from '../../config/database';
import logger from '../../config/logger';
import { parsePaginationParams, buildPaginationMeta } from '../../utils/pagination';

export interface AuditLogEntry {
  actorId: string;
  actorRole: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  diff: Record<string, unknown>;
}

export interface ListAuditParams {
  page?: string;
  limit?: string;
  resourceType?: string;
  actorId?: string;
  startDate?: string;
  endDate?: string;
}

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId,
        actorRole: entry.actorRole,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        diff: entry.diff as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    logger.error('Failed to write audit log', { err });
  }
}

export async function listAuditLogs(params: ListAuditParams) {
  const { page, limit, skip } = parsePaginationParams(params as Record<string, unknown>);

  const where = {
    ...(params.resourceType && { resourceType: params.resourceType }),
    ...(params.actorId && { actorId: params.actorId }),
    ...((params.startDate || params.endDate) && {
      timestamp: {
        ...(params.startDate ? { gte: new Date(params.startDate) } : {}),
        ...(params.endDate ? { lte: new Date(params.endDate) } : {}),
      },
    }),
  };

  const [logs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({ where, orderBy: { timestamp: 'desc' }, skip, take: limit }),
    prisma.auditLog.count({ where }),
  ]);

  return { data: logs, meta: buildPaginationMeta(total, page, limit) };
}
