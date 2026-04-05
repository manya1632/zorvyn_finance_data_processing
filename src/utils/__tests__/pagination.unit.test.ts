// Feature: finance-data-processing-api
import { parsePaginationParams, buildPaginationMeta } from '../pagination';

describe('parsePaginationParams', () => {
  it('returns default values when no params provided', () => {
    const result = parsePaginationParams({});
    expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it('caps limit at 100 when value > 100', () => {
    const result = parsePaginationParams({ limit: '200' });
    expect(result.limit).toBe(100);
  });

  it('caps limit at 100 for very large values', () => {
    const result = parsePaginationParams({ limit: '99999' });
    expect(result.limit).toBe(100);
  });

  it('computes skip correctly as (page - 1) * limit', () => {
    const result = parsePaginationParams({ page: '3', limit: '10' });
    expect(result.skip).toBe(20);
    expect(result.page).toBe(3);
    expect(result.limit).toBe(10);
  });

  it('defaults page to 1 for invalid page value', () => {
    const result = parsePaginationParams({ page: 'abc' });
    expect(result.page).toBe(1);
  });

  it('defaults limit to 20 for invalid limit value', () => {
    const result = parsePaginationParams({ limit: 'abc' });
    expect(result.limit).toBe(20);
  });

  it('enforces minimum page of 1', () => {
    const result = parsePaginationParams({ page: '-5' });
    expect(result.page).toBe(1);
  });
});

describe('buildPaginationMeta', () => {
  it('computes totalPages as ceil(total / limit)', () => {
    expect(buildPaginationMeta(25, 1, 10)).toEqual({ page: 1, limit: 10, total: 25, totalPages: 3 });
  });

  it('returns totalPages 1 when total <= limit', () => {
    expect(buildPaginationMeta(5, 1, 20)).toEqual({ page: 1, limit: 20, total: 5, totalPages: 1 });
  });

  it('returns totalPages 0 when total is 0', () => {
    expect(buildPaginationMeta(0, 1, 20)).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 });
  });
});
