import { describe, expect, it } from 'vitest';
import { computeStreak } from '../src/lib/streak';

const date = (iso: string) => `${iso}T10:00:00.000Z`;

describe('computeStreak', () => {
  const now = new Date('2026-10-22T12:00:00.000Z');

  it('returns zeroes for no activity', () => {
    expect(computeStreak([], now)).toEqual({ current: 0, longest: 0, lastActiveDate: null });
  });

  it('counts a streak ending today', () => {
    const result = computeStreak([date('2026-10-20'), date('2026-10-21'), date('2026-10-22')], now);
    expect(result.current).toBe(3);
    expect(result.longest).toBe(3);
  });

  it('keeps the streak alive if the last activity was yesterday', () => {
    const result = computeStreak([date('2026-10-20'), date('2026-10-21')], now);
    expect(result.current).toBe(2);
  });

  it('breaks the current streak when the last activity is older than yesterday', () => {
    const result = computeStreak([date('2026-10-01'), date('2026-10-02')], now);
    expect(result.current).toBe(0);
    expect(result.longest).toBe(2);
  });

  it('ignores duplicate events on the same day', () => {
    const result = computeStreak([date('2026-10-21'), date('2026-10-21'), date('2026-10-22')], now);
    expect(result.current).toBe(2);
  });

  it('finds the longest historical run', () => {
    const result = computeStreak(
      [
        date('2026-09-01'),
        date('2026-09-02'),
        date('2026-09-03'),
        date('2026-09-04'),
        date('2026-10-21'),
        date('2026-10-22'),
      ],
      now,
    );
    expect(result.longest).toBe(4);
    expect(result.current).toBe(2);
  });
});
