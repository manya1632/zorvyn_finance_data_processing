import { Request, Response } from 'express';
import * as auditService from './audit.service';
import { sendSuccess } from '../../utils/response';

export async function listAuditLogs(req: Request, res: Response): Promise<void> {
  const params = {
    page: req.query.page as string | undefined,
    limit: req.query.limit as string | undefined,
    resourceType: req.query.resourceType as string | undefined,
    actorId: req.query.actorId as string | undefined,
    startDate: req.query.startDate as string | undefined,
    endDate: req.query.endDate as string | undefined,
  };

  const result = await auditService.listAuditLogs(params);
  sendSuccess(res, result.data, 200, result.meta);
}
