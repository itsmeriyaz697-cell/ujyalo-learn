/**
 * Analytics helpers.
 *
 * Everything here is a no-op until the visitor has accepted analytics, because
 * `window.gtag` only exists once public/analytics.js has decided to load.
 *
 * Rules this file follows:
 * - No personal data. Never send an email, display name, uid, note text, chat
 *   message or quiz answer. Events carry counts, modes and page paths only.
 * - No advertising identifiers or remarketing parameters.
 */
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    ujyaloAnalytics?: { state: () => string | null; load: () => void; measurementId: string };
  }
}

export type AnalyticsEvent =
  | 'sign_up'
  | 'login'
  | 'guest_start'
  | 'guest_upgrade'
  | 'onboarding_complete'
  | 'onboarding_skipped'
  | 'quiz_started'
  | 'quiz_completed'
  | 'tutor_question'
  | 'note_saved'
  | 'flashcards_created'
  | 'outbound_click'
  | 'consent_update';

type Params = Record<string, string | number | boolean | undefined>;

export function analyticsEnabled(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

export function track(event: AnalyticsEvent, params: Params = {}): void {
  if (!analyticsEnabled()) return;
  window.gtag?.('event', event, params);
}

/** Called on every route change; GA4 counts this as a page view. */
export function trackPageView(path: string, title?: string): void {
  if (!analyticsEnabled()) return;
  window.gtag?.('event', 'page_view', {
    page_path: path,
    page_location: typeof window !== 'undefined' ? window.location.href : undefined,
    page_title: title ?? (typeof document !== 'undefined' ? document.title : undefined),
  });
}

export function setConsent(choice: 'granted' | 'denied'): void {
  try {
    localStorage.setItem('ujyalo:analytics-consent', choice);
  } catch {
    // Private mode: the choice simply will not persist.
  }
  window.dispatchEvent(new CustomEvent('ujyalo:consent', { detail: choice }));
  if (choice === 'granted') track('consent_update', { choice });
}

export function readConsent(): 'granted' | 'denied' | null {
  try {
    const value = localStorage.getItem('ujyalo:analytics-consent');
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}
