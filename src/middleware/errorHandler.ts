import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';
import logger from '../config/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error('Operational error', { message: err.message, stack: err.stack, path: req.path });
    }
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  if (err instanceof ZodError) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', err.errors);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      sendError(res, 409, 'CONFLICT', 'A resource with this value already exists');
      return;
    }
    if (err.code === 'P2025') {
      sendError(res, 404, 'NOT_FOUND', 'Resource not found');
      return;
    }
    if (err.code === 'P2003') {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid reference: related resource not found');
      return;
    }
    sendError(res, 400, 'VALIDATION_ERROR', 'Database validation error');
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    sendError(res, 400, 'VALIDATION_ERROR', 'Invalid data provided');
    return;
  }

  logger.error('Unhandled error', { message: err.message, stack: err.stack, path: req.path });
  sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
}
