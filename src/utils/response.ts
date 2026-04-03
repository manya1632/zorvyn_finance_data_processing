import { Response } from 'express';
import { ErrorCodeType } from './errors';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function sendSuccess(
  res: Response,
  data: unknown,
  statusCode = 200,
  meta?: PaginationMeta,
): void {
  res.status(statusCode).json({
    success: true,
    data,
    ...(meta && { meta }),
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  code: ErrorCodeType,
  message: string,
  details?: unknown,
): void {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  });
}
