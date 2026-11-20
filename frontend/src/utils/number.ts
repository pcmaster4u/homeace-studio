/**
 * Limits a number to a range.
 *
 * @param value - Any number; NaN is treated as `min`.
 * @param min - Lower bound (inclusive).
 * @param max - Upper bound (inclusive); if it is below `min`, `min` wins.
 * @returns `value` moved into [min, max].
 * @example clampNumber(812, 300, 700) // 700
 */
export function clampNumber(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
}
