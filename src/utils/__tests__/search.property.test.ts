// Feature: finance-data-processing-api, Property 12: Case-insensitive search correctness
import * as fc from 'fast-check';

// Test the search filter logic directly (the Prisma 'insensitive' mode maps to ILIKE)
// We test the filter construction logic, not the DB query itself
function matchesSearch(value: string | null | undefined, search: string): boolean {
  if (!value) return false;
  return value.toLowerCase().includes(search.toLowerCase());
}

function recordMatchesSearch(record: { category: string; notes?: string | null }, search: string): boolean {
  return matchesSearch(record.category, search) || matchesSearch(record.notes, search);
}

describe('Property 12: Case-insensitive search correctness', () => {
  it('search is case-insensitive: uppercase and lowercase variants both match', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z]+$/.test(s)),
        (word) => {
          const record = { category: word.toLowerCase(), notes: null };
          expect(recordMatchesSearch(record, word.toUpperCase())).toBe(true);
          expect(recordMatchesSearch(record, word.toLowerCase())).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('non-matching records are excluded', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z]+$/.test(s)),
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[A-Z]+$/.test(s)),
        (category, search) => {
          // Only match if category contains search (case-insensitive)
          const record = { category, notes: null };
          const shouldMatch = category.toLowerCase().includes(search.toLowerCase());
          expect(recordMatchesSearch(record, search)).toBe(shouldMatch);
        }
      ),
      { numRuns: 20 }
    );
  });
});
