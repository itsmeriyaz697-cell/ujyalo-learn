import { createHash } from 'node:crypto';

/**
 * In-memory, best-effort rate limiting.
 *
 * Serverless instances do not share memory, so these limits are per-instance.
 * They still stop runaway loops from a single client and are combined with
 * the provider's own account-level quotas. For strict global limits the owner
 * should add a shared store (see README → usage controls). This is documented
 * honestly rather than presented as a global guarantee.
 */

interface Bucket {
  timestamps: number[];
}

const minuteBuckets = new Map<string, Bucket>();
const dayCounts = new Map<string, { date: string; count: number }>();

export interface LimitDecision {
  allowed: boolean;
  reason?: 'minute' | 'day';
  retryAfterSeconds?: number;
  remainingToday: number;
}

const MINUTE = 60_000;
const DAY = 86_400_000;

export function hashClient(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 24);
}

export function limitKey(uid: string | null, ipHash: string): string {
  return uid ? `u:${uid}` : `ip:${ipHash}`;
}

export function checkAndConsume(
  key: string,
  limits: { perMinute: number; perDay: number },
  now = Date.now(),
): LimitDecision {
  const today = new Date(now).toISOString().slice(0, 10);
  const bucket = minuteBuckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < MINUTE);
  const dayEntry = dayCounts.get(key);
  if (!dayEntry || dayEntry.date !== today) {
    dayCounts.set(key, { date: today, count: 0 });
  }
  const day = dayCounts.get(key)!;

  if (bucket.timestamps.length >= limits.perMinute) {
    const oldest = bucket.timestamps[0] ?? now;
    return {
      allowed: false,
      reason: 'minute',
      retryAfterSeconds: Math.max(1, Math.ceil((MINUTE - (now - oldest)) / 1000)),
      remainingToday: Math.max(0, limits.perDay - day.count),
    };
  }
  if (day.count >= limits.perDay) {
    return {
      allowed: false,
      reason: 'day',
      retryAfterSeconds: Math.max(1, Math.ceil((DAY - (now % DAY)) / 1000)),
      remainingToday: 0,
    };
  }

  bucket.timestamps.push(now);
  minuteBuckets.set(key, bucket);
  day.count += 1;
  dayCounts.set(key, day);

  // Opportunistic cleanup so the maps do not grow without bound.
  if (minuteBuckets.size > 5000) {
    for (const [k, v] of minuteBuckets) {
      if (!v.timestamps.length || now - v.timestamps[v.timestamps.length - 1] > MINUTE) minuteBuckets.delete(k);
    }
  }
  if (dayCounts.size > 5000) {
    for (const [k, v] of dayCounts) if (v.date !== today) dayCounts.delete(k);
  }

  return { allowed: true, remainingToday: Math.max(0, limits.perDay - day.count) };
}

/** Test helper. */
export function resetRateLimits() {
  minuteBuckets.clear();
  dayCounts.clear();
}
