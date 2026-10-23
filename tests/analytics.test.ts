import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Analytics is opt-in and carries no personal data. These tests pin the two
 * properties that matter legally and technically:
 *   - nothing is sent unless the visitor allowed it, and
 *   - what is sent contains only page paths and counts.
 */

const store = new Map<string, string>();
const dispatched: string[] = [];

vi.stubGlobal('localStorage', {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, value),
  removeItem: (key: string) => void store.delete(key),
});

vi.stubGlobal('window', {
  dispatchEvent: (event: Event & { detail?: string }) => {
    dispatched.push(String(event.detail ?? ''));
    return true;
  },
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  location: { href: 'https://example.test/features' },
});

describe('analytics helpers', () => {
  beforeEach(() => {
    store.clear();
    dispatched.length = 0;
    delete (globalThis as { window?: { gtag?: unknown } }).window?.gtag;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('does nothing when the visitor has not allowed analytics', async () => {
    const calls: unknown[][] = [];
    const analytics = await import('@/lib/analytics');

    analytics.trackPageView('/features');
    analytics.track('guest_start');

    expect((globalThis as { window?: { gtag?: unknown } }).window?.gtag).toBeUndefined();
    expect(calls).toHaveLength(0);
  });

  it('sends a page view with a path and no personal data once allowed', async () => {
    const sent: unknown[][] = [];
    (globalThis as { window?: { gtag?: (...args: unknown[]) => void } }).window!.gtag = (...args: unknown[]) => {
      sent.push(args);
    };

    const analytics = await import('@/lib/analytics');
    analytics.trackPageView('/features', 'Features');

    expect(sent[0]?.[0]).toBe('event');
    expect(sent[0]?.[1]).toBe('page_view');
    const params = sent[0]?.[2] as Record<string, unknown>;
    expect(params.page_path).toBe('/features');
    expect(JSON.stringify(params)).not.toMatch(/@|uid|email/i);
  });

  it('remembers the choice and announces it', async () => {
    const analytics = await import('@/lib/analytics');

    expect(analytics.readConsent()).toBeNull();
    analytics.setConsent('denied');
    expect(analytics.readConsent()).toBe('denied');
    expect(store.get('ujyalo:analytics-consent')).toBe('denied');
    expect(dispatched).toContain('denied');
  });

  it('treats an unknown stored value as "not decided"', async () => {
    store.set('ujyalo:analytics-consent', 'maybe');
    const analytics = await import('@/lib/analytics');
    expect(analytics.readConsent()).toBeNull();
  });
});
