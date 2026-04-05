// Feature: finance-data-processing-api
import { authorize } from '../authorize';
import { AppError } from '../../utils/errors';

describe('authorize middleware', () => {
  const mockRes = {} as any;
  const mockNext = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('calls next() with no args when role matches', () => {
    const req = { user: { id: 'u1', role: 'ADMIN', status: 'ACTIVE' } } as any;
    authorize('ADMIN')(req, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('calls next() when role is in the allowed list', () => {
    const req = { user: { id: 'u1', role: 'ANALYST', status: 'ACTIVE' } } as any;
    authorize('ANALYST', 'ADMIN')(req, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('calls next(AppError 403) when role does not match', () => {
    const req = { user: { id: 'u1', role: 'VIEWER', status: 'ACTIVE' } } as any;
    authorize('ADMIN')(req, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403, code: 'FORBIDDEN' }));
  });

  it('calls next(AppError 403) when req.user is missing', () => {
    const req = {} as any;
    authorize('ADMIN')(req, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403, code: 'FORBIDDEN' }));
  });

  it('VIEWER is denied ADMIN-only endpoint', () => {
    const req = { user: { id: 'u1', role: 'VIEWER', status: 'ACTIVE' } } as any;
    authorize('ADMIN')(req, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('ANALYST is denied ADMIN-only endpoint', () => {
    const req = { user: { id: 'u1', role: 'ANALYST', status: 'ACTIVE' } } as any;
    authorize('ADMIN')(req, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });
});
