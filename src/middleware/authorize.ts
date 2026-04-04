import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Role } from '@prisma/client';
import { AppError } from '../utils/errors';

export function authorize(...roles: Role[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(403, 'FORBIDDEN', 'Access denied'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', `Access denied. Required roles: ${roles.join(', ')}`));
    }
    next();
  };
}
