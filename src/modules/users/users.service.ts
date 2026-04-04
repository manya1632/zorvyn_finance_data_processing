import bcrypt from 'bcrypt';
import { Role, UserStatus } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../utils/errors';
import { parsePaginationParams, buildPaginationMeta } from '../../utils/pagination';
import type { CreateUserDto, UpdateUserDto, UpdateStatusDto, ListUsersQuery } from './users.schema';
import { ALLOWED_USER_SORT } from './users.schema';

const BCRYPT_ROUNDS = 12;

const USER_SELECT = {
  id: true, name: true, email: true, role: true, status: true, deletedAt: true, createdAt: true, updatedAt: true,
} as const;

function parseSortParam(sort?: string): { field: string; order: 'asc' | 'desc' } {
  if (!sort) return { field: 'createdAt', order: 'desc' };
  const [field, order] = sort.split(':');
  if (!ALLOWED_USER_SORT.includes(field as typeof ALLOWED_USER_SORT[number])) {
    throw new AppError(400, 'VALIDATION_ERROR', `Invalid sort field: ${field}. Allowed: ${ALLOWED_USER_SORT.join(', ')}`);
  }
  return { field, order: order === 'asc' ? 'asc' : 'desc' };
}

export async function createUser(dto: CreateUserDto) {
  const existing = await prisma.user.findFirst({ where: { email: dto.email, deletedAt: null } });
  if (existing) throw new AppError(409, 'CONFLICT', 'A user with this email already exists');

  const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
  return prisma.user.create({
    data: { name: dto.name, email: dto.email, password: hashedPassword, role: dto.role },
    select: USER_SELECT,
  });
}

export async function listUsers(query: ListUsersQuery) {
  const { page, limit, skip } = parsePaginationParams(query as Record<string, unknown>);
  const { field, order } = parseSortParam(query.sort);

  const searchFilter = query.search
    ? {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { email: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const where = {
    deletedAt: null,
    ...(query.role && { role: query.role }),
    ...(query.status && { status: query.status }),
    ...searchFilter,
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({ where, select: USER_SELECT, orderBy: { [field]: order }, skip, take: limit }),
    prisma.user.count({ where }),
  ]);

  return { data: users, meta: buildPaginationMeta(total, page, limit) };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findFirst({ where: { id, deletedAt: null }, select: USER_SELECT });
  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
  return user;
}

export async function updateUser(id: string, dto: UpdateUserDto) {
  await getUserById(id);

  if (dto.email) {
    const conflict = await prisma.user.findFirst({ where: { email: dto.email, deletedAt: null, NOT: { id } } });
    if (conflict) throw new AppError(409, 'CONFLICT', 'Email already in use');
  }

  return prisma.user.update({
    where: { id },
    data: dto,
    select: USER_SELECT,
  });
}

export async function softDeleteUser(id: string) {
  await getUserById(id); 
  await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function updateUserStatus(id: string, dto: UpdateStatusDto) {
  await getUserById(id);
  return prisma.user.update({
    where: { id },
    data: { status: dto.status },
    select: USER_SELECT,
  });
}
