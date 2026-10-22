import { beforeEach, describe, expect, it } from 'vitest';
import { checkAndConsume, hashClient, limitKey, resetRateLimits } from '../api/_lib/rateLimit';

const limits = { perMinute: 3, perDay: 5 };

describe('rate limiting', () => {
  beforeEach(() => resetRateLimits());

  it('allows requests under the per-minute limit', () => {
    const now = Date.parse('2026-10-22T10:00:00.000Z');
    expect(checkAndConsume('u:1', limits, now).allowed).toBe(true);
    expect(checkAndConsume('u:1', limits, now + 1000).allowed).toBe(true);
    expect(checkAndConsume('u:1', limits, now + 2000).allowed).toBe(true);
  });

  it('blocks the request that exceeds the per-minute limit and reports retry time', () => {
    const now = Date.parse('2026-10-22T10:00:00.000Z');
    checkAndConsume('u:1', limits, now);
    checkAndConsume('u:1', limits, now + 1000);
    checkAndConsume('u:1', limits, now + 2000);
    const blocked = checkAndConsume('u:1', limits, now + 3000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toBe('minute');
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('recovers after the minute window passes', () => {
    const now = Date.parse('2026-10-22T10:00:00.000Z');
    checkAndConsume('u:1', limits, now);
    checkAndConsume('u:1', limits, now);
    checkAndConsume('u:1', limits, now);
    expect(checkAndConsume('u:1', limits, now + 61_000).allowed).toBe(true);
  });

  it('enforces the daily cap across minute windows', () => {
    const day = Date.parse('2026-10-22T09:00:00.000Z');
    for (let i = 0; i < 5; i += 1) {
      expect(checkAndConsume('u:2', { perMinute: 10, perDay: 5 }, day + i * 60_000).allowed).toBe(true);
    }
    const blocked = checkAndConsume('u:2', { perMinute: 10, perDay: 5 }, day + 6 * 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toBe('day');
    expect(blocked.remainingToday).toBe(0);
  });

  it('resets the daily counter for a new UTC day', () => {
    const first = Date.parse('2026-10-22T23:59:00.000Z');
    for (let i = 0; i < 5; i += 1) checkAndConsume('u:3', { perMinute: 10, perDay: 5 }, first + i * 1000);
    expect(checkAndConsume('u:3', { perMinute: 10, perDay: 5 }, first + 1000).allowed).toBe(false);
    expect(checkAndConsume('u:3', { perMinute: 10, perDay: 5 }, Date.parse('2026-10-23T00:00:30.000Z')).allowed).toBe(true);
  });

  it('keys authenticated and anonymous clients separately', () => {
    const ipHash = hashClient('203.0.113.5');
    expect(limitKey('uid1', ipHash)).toBe('u:uid1');
    expect(limitKey(null, ipHash)).toBe(`ip:${ipHash}`);
    expect(hashClient('203.0.113.5')).toBe(hashClient('203.0.113.5'));
    expect(hashClient('203.0.113.5')).not.toBe(hashClient('203.0.113.6'));
  });
});
