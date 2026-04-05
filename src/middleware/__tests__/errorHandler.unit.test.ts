// Feature: finance-data-processing-api
import { Prisma } from '@prisma/client';
import { ZodError, ZodIssue } from 'zod';
import { AppError } from '../../utils/errors';

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

import { errorHandler } from '../errorHandler';

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const mockReq = { path: '/test' } as any;
const mockNext = jest.fn();

describe('errorHandler middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  it('maps AppError to its own statusCode and code', () => {
    const res = makeRes();
    const err = new AppError(422, 'VALIDATION_ERROR', 'Custom error');
    errorHandler(err, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.objectContaining({ code: 'VALIDATION_ERROR', message: 'Custom error' }),
    }));
  });

  it('maps Prisma P2002 to 409 CONFLICT', () => {
    const res = makeRes();
    const err = new Prisma.PrismaClientKnownRequestError('Unique constraint', { code: 'P2002', clientVersion: '5.0.0' });
    errorHandler(err, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.objectContaining({ code: 'CONFLICT' }),
    }));
  });

  it('maps Prisma P2025 to 404 NOT_FOUND', () => {
    const res = makeRes();
    const err = new Prisma.PrismaClientKnownRequestError('Record not found', { code: 'P2025', clientVersion: '5.0.0' });
    errorHandler(err, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.objectContaining({ code: 'NOT_FOUND' }),
    }));
  });

  it('maps ZodError to 400 VALIDATION_ERROR with details', () => {
    const res = makeRes();
    const zodIssue: ZodIssue = { code: 'invalid_type', expected: 'string', received: 'number', path: ['email'], message: 'Expected string' };
    const err = new ZodError([zodIssue]);
    errorHandler(err, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.objectContaining({ code: 'VALIDATION_ERROR', details: expect.any(Array) }),
    }));
  });

  it('maps unhandled Error to 500 INTERNAL_ERROR', () => {
    const res = makeRes();
    const err = new Error('Something went wrong');
    errorHandler(err, mockReq, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.objectContaining({ code: 'INTERNAL_ERROR' }),
    }));
  });
});
