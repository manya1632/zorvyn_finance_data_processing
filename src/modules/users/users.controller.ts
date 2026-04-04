import { Request, Response } from 'express';
import { createUserSchema, updateUserSchema, updateStatusSchema, listUsersQuerySchema } from './users.schema';
import * as usersService from './users.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/errors';

export async function createUser(req: Request, res: Response): Promise<void> {
  const parsed = createUserSchema.safeParse({ body: req.body });
  if (!parsed.success) throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed', parsed.error.errors);
  const user = await usersService.createUser(parsed.data.body);
  sendSuccess(res, user, 201);
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const parsed = listUsersQuerySchema.safeParse({ query: req.query });
  if (!parsed.success) throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed', parsed.error.errors);
  const result = await usersService.listUsers(parsed.data.query);
  sendSuccess(res, result.data, 200, result.meta);
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  const user = await usersService.getUserById(req.params['id'] as string);
  sendSuccess(res, user);
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const parsed = updateUserSchema.safeParse({ body: req.body });
  if (!parsed.success) throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed', parsed.error.errors);
  const user = await usersService.updateUser(req.params['id'] as string, parsed.data.body);
  sendSuccess(res, user);
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  await usersService.softDeleteUser(req.params['id'] as string);
  sendSuccess(res, { message: 'User deleted successfully' });
}

export async function updateUserStatus(req: Request, res: Response): Promise<void> {
  const parsed = updateStatusSchema.safeParse({ body: req.body });
  if (!parsed.success) throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed', parsed.error.errors);
  const user = await usersService.updateUserStatus(req.params['id'] as string, parsed.data.body);
  sendSuccess(res, user);
}
