// Feature: finance-data-processing-api, Property 11: Pagination envelope correctness
import * as fc from 'fast-check';
import { parsePaginationParams, buildPaginationMeta } from '../pagination';

describe('Property 11: Pagination envelope correctness', () => {
  it('limit is always capped at 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        (rawLimit) => {
          const result = parsePaginationParams({ limit: String(rawLimit) });
          expect(result.limit).toBeLessThanOrEqual(100);
          expect(result.limit).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('skip is always (page - 1) * limit', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (page, limit) => {
          const result = parsePaginationParams({ page: String(page), limit: String(limit) });
          expect(result.skip).toBe((result.page - 1) * result.limit);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('totalPages is always ceil(total / limit)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        fc.integer({ min: 1, max: 100 }),
        (total, limit) => {
          const meta = buildPaginationMeta(total, 1, limit);
          expect(meta.totalPages).toBe(Math.ceil(total / limit));
        }
      ),
      { numRuns: 20 }
    );
  });
});
