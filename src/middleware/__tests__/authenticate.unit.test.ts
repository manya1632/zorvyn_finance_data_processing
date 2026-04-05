// Feature: finance-data-processing-api
import jwt from 'jsonwebtoken';
import { AppError } from '../../utils/errors';

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

const mockNext = jest.fn();
const mockRes = {} as any;

const validToken = jwt.sign(
  { sub: 'user-1', role: 'ADMIN' },
  'test_secret_at_least_32_chars_long_here',
  { expiresIn: '1h' }
);

describe('authenticate middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when Authorization header is missing', async () => {
    const req = { headers: {} } as any;
    await authenticate(req, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('returns 401 when Authorization header does not start with Bearer', async () => {
    const req = { headers: { authorization: 'Basic abc123' } } as any;
    await authenticate(req, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('returns 401 for malformed JWT', async () => {
    const req = { headers: { authorization: 'Bearer not.a.valid.jwt' } } as any;
    await authenticate(req, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('returns 401 for expired JWT', async () => {
    const expiredToken = jwt.sign(
      { sub: 'user-1', role: 'ADMIN' },
      'test_secret_at_least_32_chars_long_here',
      { expiresIn: '-1s' }
    );
    const req = { headers: { authorization: `Bearer ${expiredToken}` } } as any;
    await authenticate(req, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('attaches req.user for valid JWT and active user', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: 'user-1', role: 'ADMIN', status: 'ACTIVE',
    });
    const req = { headers: { authorization: `Bearer ${validToken}` } } as any;
    await authenticate(req, mockRes, mockNext);
    expect(req.user).toEqual({ id: 'user-1', role: 'ADMIN', status: 'ACTIVE' });
    expect(mockNext).toHaveBeenCalledWith(); // called with no args = success
  });

  it('returns 403 for INACTIVE user', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: 'user-1', role: 'ADMIN', status: 'INACTIVE',
    });
    const req = { headers: { authorization: `Bearer ${validToken}` } } as any;
    await authenticate(req, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('returns 401 when user not found in DB', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
    const req = { headers: { authorization: `Bearer ${validToken}` } } as any;
    await authenticate(req, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
