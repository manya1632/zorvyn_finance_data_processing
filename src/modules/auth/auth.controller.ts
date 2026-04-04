import { Request, Response } from 'express';
import { registerSchema, loginSchema } from './auth.schema';
import { registerUser, loginUser } from './auth.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/errors';

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.safeParse({ body: req.body });
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed', parsed.error.errors);
  }
  const result = await registerUser(parsed.data.body);
  sendSuccess(res, result, 201);
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse({ body: req.body });
  if (!parsed.success) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed', parsed.error.errors);
  }
  const result = await loginUser(parsed.data.body);
  sendSuccess(res, result);
}
