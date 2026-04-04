import * as fc from 'fast-check';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    auditLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

import prisma from '../../../config/database';
import { writeAuditLog } from '../audit.service';

describe('Property 13: Audit log completeness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.auditLog.create as jest.Mock).mockResolvedValue({});
  });

  it('writeAuditLog is called with correct actorId, actorRole, action, resourceType, resourceId, and non-empty diff', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          actorId: fc.uuid(),
          actorRole: fc.constantFrom('ADMIN' as const, 'ANALYST' as const),
          action: fc.constantFrom('CREATE' as const, 'UPDATE' as const, 'DELETE' as const),
          resourceType: fc.constantFrom('FinancialRecord' as const, 'User' as const),
          resourceId: fc.uuid(),
          diff: fc.object({ maxDepth: 2 }),
        }),
        async (entry) => {
          (prisma.auditLog.create as jest.Mock).mockClear();

          await writeAuditLog(entry);

          expect(prisma.auditLog.create).toHaveBeenCalledWith({
            data: {
              actorId: entry.actorId,
              actorRole: entry.actorRole,
              action: entry.action,
              resourceType: entry.resourceType,
              resourceId: entry.resourceId,
              diff: entry.diff,
            },
          });

          const callArgs = (prisma.auditLog.create as jest.Mock).mock.calls[0][0];
          expect(callArgs.data.actorId).toBe(entry.actorId);
          expect(callArgs.data.actorRole).toBe(entry.actorRole);
          expect(callArgs.data.action).toBe(entry.action);
          expect(callArgs.data.resourceType).toBe(entry.resourceType);
          expect(callArgs.data.resourceId).toBe(entry.resourceId);
        }
      ),
      { numRuns: 20 }
    );
  });
});
