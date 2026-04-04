import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import prisma from '../../config/database';
import { AppError } from '../../utils/errors';
import type { RegisterDto, LoginDto } from './auth.schema';

const BCRYPT_ROUNDS = 12;

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
}

function toSafeUser(user: { id: string; name: string; email: string; role: string; status: string; createdAt: Date }): SafeUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, createdAt: user.createdAt };
}

function signToken(userId: string, role: string): string {
  return jwt.sign(
    { sub: userId, role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'] }
  );
}

export async function registerUser(dto: RegisterDto): Promise<{ token: string; user: SafeUser }> {
  const existing = await prisma.user.findFirst({ where: { email: dto.email, deletedAt: null } });
  if (existing) {
    throw new AppError(409, 'CONFLICT', 'A user with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: dto.role,
    },
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
  });

  const token = signToken(user.id, user.role);
  return { token, user: toSafeUser(user) };
}

export async function loginUser(dto: LoginDto): Promise<{ token: string; user: SafeUser }> {
  const user = await prisma.user.findFirst({
    where: { email: dto.email, deletedAt: null },
    select: { id: true, name: true, email: true, password: true, role: true, status: true, createdAt: true },
  });

  if (!user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
  }

  const passwordMatch = await bcrypt.compare(dto.password, user.password);
  if (!passwordMatch) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
  }

  const token = signToken(user.id, user.role);
  const { password: _, ...safeUser } = user;
  return { token, user: toSafeUser(safeUser) };
}
