import * as fc from 'fast-check';
import jwt from 'jsonwebtoken';

jest.mock('../../../config', () => ({
  config: {
    jwt: { secret: 'correct_secret_at_least_32_chars_long_here', expiresIn: '24h' },
  },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findFirst: jest.fn(),
    },
  },
}));

import prisma from '../../../config/database';
import { authenticate } from '../../../middleware/authenticate';

describe('Property 3: Token secret enforcement', () => {
  it('rejects any JWT signed with a different secret', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 50 }).filter(s => s !== 'correct_secret_at_least_32_chars_long_here'),
        async (wrongSecret) => {
          const token = jwt.sign({ sub: 'user-1', role: 'ADMIN' }, wrongSecret, { expiresIn: '1h' });

          const req = {
            headers: { authorization: `Bearer ${token}` },
            user: undefined,
          } as any;
          const res = {} as any;
          const next = jest.fn();

          await authenticate(req, res, next);

          expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
        }
      ),
      { numRuns: 20 }
    );
  });
});
