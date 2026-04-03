export type DiffResult = Record<string, { from: unknown; to: unknown }>;

export function computeDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): DiffResult {
  const diff: DiffResult = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    if (before[key] !== after[key]) {
      diff[key] = { from: before[key] ?? null, to: after[key] ?? null };
    }
  }
  return diff;
}
