import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Role } from '@prisma/client';
import { AppError } from '../utils/errors';

export function authorize(...roles: Role[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as any).user as { id: string; role: Role; status: string } | undefined;
    if (!user) {
      return next(new AppError(403, 'FORBIDDEN', 'Access denied'));
    }
    if (!roles.includes(user.role)) {
      return next(new AppError(403, 'FORBIDDEN', `Access denied. Required roles: ${roles.join(', ')}`));
    }
    next();
  };
}
