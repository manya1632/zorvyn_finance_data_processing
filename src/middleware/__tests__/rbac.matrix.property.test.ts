// Feature: finance-data-processing-api, Property 5: RBAC permission matrix enforcement
import * as fc from 'fast-check';
import { authorize } from '../authorize';

describe('Property 5: RBAC permission matrix enforcement', () => {
  const mockRes = {} as any;

  it('VIEWER is only allowed on VIEWER-permitted endpoints', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('ANALYST' as const, 'ADMIN' as const),
        (requiredRole) => {
          const req = { user: { id: 'u1', role: 'VIEWER', status: 'ACTIVE' } } as any;
          const next = jest.fn();
          authorize(requiredRole)(req, mockRes, next);
          expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
        }
      ),
      { numRuns: 20 }
    );
  });

  it('ADMIN is allowed on ADMIN endpoints', () => {
    fc.assert(
      fc.property(
        fc.constant('ADMIN' as const),
        (requiredRole) => {
          const req = { user: { id: 'u1', role: 'ADMIN', status: 'ACTIVE' } } as any;
          const next = jest.fn();
          authorize(requiredRole)(req, mockRes, next);
          expect(next).toHaveBeenCalledWith(); // no error arg
        }
      ),
      { numRuns: 20 }
    );
  });

  it('ANALYST is denied ADMIN-only endpoints', () => {
    fc.assert(
      fc.property(
        fc.constant('ADMIN' as const),
        (requiredRole) => {
          const req = { user: { id: 'u1', role: 'ANALYST', status: 'ACTIVE' } } as any;
          const next = jest.fn();
          authorize(requiredRole)(req, mockRes, next);
          expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
        }
      ),
      { numRuns: 20 }
    );
  });
});
