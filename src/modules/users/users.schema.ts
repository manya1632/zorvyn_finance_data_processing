import { z } from 'zod';
import { Role, UserStatus } from '@prisma/client';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.nativeEnum(Role).optional().default(Role.VIEWER),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    role: z.nativeEnum(Role).optional(),
  }).refine(data => Object.keys(data).length > 0, { message: 'At least one field must be provided' }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(UserStatus),
  }),
});

const ALLOWED_USER_SORT_FIELDS = ['name', 'createdAt', 'email'] as const;

export const listUsersQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
    role: z.nativeEnum(Role).optional(),
    status: z.nativeEnum(UserStatus).optional(),
    search: z.string().optional(),
  }),
});

export const ALLOWED_USER_SORT = ALLOWED_USER_SORT_FIELDS;

export type CreateUserDto = z.infer<typeof createUserSchema>['body'];
export type UpdateUserDto = z.infer<typeof updateUserSchema>['body'];
export type UpdateStatusDto = z.infer<typeof updateStatusSchema>['body'];
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>['query'];
