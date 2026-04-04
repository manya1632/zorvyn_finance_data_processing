import * as fc from 'fast-check';
import jwt from 'jsonwebtoken';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../../config', () => ({
  config: {
    jwt: { secret: 'test_secret_at_least_32_chars_long_here', expiresIn: '24h' },
  },
}));

import prisma from '../../../config/database';
import { registerUser } from '../auth.service';

describe('Property 1: Auth registration and login round-trip', () => {
  it('for any valid registration payload, JWT payload contains correct sub, role, and exp = iat + 86400', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 50 }),
          role: fc.constantFrom('VIEWER' as const, 'ANALYST' as const, 'ADMIN' as const),
        }),
        async (dto) => {
          const userId = `user-${Math.random()}`;
          (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
          (prisma.user.create as jest.Mock).mockResolvedValue({
            id: userId, name: dto.name, email: dto.email, role: dto.role, status: 'ACTIVE', createdAt: new Date(),
          });

          const result = await registerUser(dto);
          const decoded = jwt.decode(result.token) as { sub: string; role: string; iat: number; exp: number };

          expect(decoded.sub).toBe(userId);
          expect(decoded.role).toBe(dto.role);
          expect(decoded.exp - decoded.iat).toBe(86400);
          expect(result.user).not.toHaveProperty('password');
        }
      ),
      { numRuns: 20 }
    );
  });
});
