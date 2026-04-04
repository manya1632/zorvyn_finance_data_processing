import { Request, Response } from 'express';
import { createRecordSchema, updateRecordSchema, listRecordsQuerySchema } from './records.schema';
import * as recordsService from './records.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/errors';

export async function createRecord(req: Request, res: Response): Promise<void> {
  const parsed = createRecordSchema.safeParse({ body: req.body });
  if (!parsed.success) throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed', parsed.error.errors);
  const record = await recordsService.createRecord(parsed.data.body, req.user!.id, req.user!.role);
  sendSuccess(res, record, 201);
}

export async function listRecords(req: Request, res: Response): Promise<void> {
  const parsed = listRecordsQuerySchema.safeParse({ query: req.query });
  if (!parsed.success) throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed', parsed.error.errors);
  const result = await recordsService.listRecords(parsed.data.query);
  sendSuccess(res, result.data, 200, result.meta);
}

export async function getRecordById(req: Request, res: Response): Promise<void> {
  const record = await recordsService.getRecordById(req.params['id'] as string);
  sendSuccess(res, record);
}

export async function updateRecord(req: Request, res: Response): Promise<void> {
  const parsed = updateRecordSchema.safeParse({ body: req.body });
  if (!parsed.success) throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed', parsed.error.errors);
  const record = await recordsService.updateRecord(req.params['id'] as string, parsed.data.body, req.user!.id, req.user!.role);
  sendSuccess(res, record);
}

export async function deleteRecord(req: Request, res: Response): Promise<void> {
  await recordsService.softDeleteRecord(req.params['id'] as string, req.user!.id, req.user!.role);
  sendSuccess(res, { message: 'Record deleted' });
}
