import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../config/database';
import { AppError } from '../utils/errors';

interface JwtPayload {
  sub: string;
  role: string;
  iat: number;
  exp: number;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication token is required');
    }

    const token = authHeader.split(' ')[1];
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired authentication token');
    }

    const user = await prisma.user.findFirst({
      where: { id: decoded.sub, deletedAt: null },
      select: { id: true, role: true, status: true },
    });

    if (!user) {
      throw new AppError(401, 'UNAUTHORIZED', 'User not found');
    }

    if (user.status === 'INACTIVE') {
      throw new AppError(403, 'FORBIDDEN', 'Your account has been deactivated');
    }

    (req as any).user = { id: user.id, role: user.role, status: user.status };
    next();
  } catch (err) {
    next(err);
  }
}
