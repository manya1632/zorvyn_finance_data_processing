// Feature: finance-data-processing-api, Property 4: INACTIVE user access denial
import * as fc from 'fast-check';
import jwt from 'jsonwebtoken';

jest.mock('../../config', () => ({
  config: {
    jwt: { secret: 'test_secret_at_least_32_chars_long_here', expiresIn: '24h' },
  },
}));

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findFirst: jest.fn(),
    },
  },
}));

import prisma from '../../config/database';
import { authenticate } from '../authenticate';

describe('Property 4: INACTIVE user access denial', () => {
  it('any INACTIVE user is denied regardless of role', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('VIEWER' as const, 'ANALYST' as const, 'ADMIN' as const),
        async (role) => {
          const token = jwt.sign(
            { sub: 'user-1', role },
            'test_secret_at_least_32_chars_long_here',
            { expiresIn: '1h' }
          );
          (prisma.user.findFirst as jest.Mock).mockResolvedValue({
            id: 'user-1', role, status: 'INACTIVE',
          });

          const req = { headers: { authorization: `Bearer ${token}` } } as any;
          const next = jest.fn();
          await authenticate(req, {} as any, next);

          expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
        }
      ),
      { numRuns: 20 }
    );
  });
});
