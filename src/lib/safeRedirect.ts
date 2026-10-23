/**
 * Same-origin redirect handling for the `?next=` parameter.
 *
 * A naive guard — "starts with / and not //" — is not enough. Browsers and
 * React Router normalise backslashes to slashes, so `/\evil.com` passes that
 * check and then resolves to `https://evil.com/`. A tab does the same
 * (`/\t/evil.com`). This is exactly the CVE-2025-68470 bypass in React Router
 * (GHSA-wrjc-x8rr-h8h6), and an open redirect is a phishing vector on a site
 * used by children: a plausible-looking login link can bounce a student to a
 * lookalike page straight after they authenticate.
 *
 * The fix is to stop pattern-matching strings and let the URL parser decide,
 * because the parser applies the same normalisation the browser will.
 * Whatever it produces must still be on our own origin; anything else is
 * discarded and the caller falls back to the app root.
 */

/** Origin used when there is no browser (tests, SSR). */
export const FALLBACK_ORIGIN = 'https://ujyalo-learn.vercel.app';

export function safeRedirectPath(
  raw: string | null | undefined,
  origin: string = typeof window !== 'undefined' ? window.location.origin : FALLBACK_ORIGIN,
): string {
  if (!raw) return '';

  let url: URL;
  try {
    url = new URL(raw, origin);
  } catch {
    return '';
  }

  // Different scheme or host: never follow it.
  if (url.origin !== origin) return '';

  // A path that is not rooted (e.g. "app") would be relative to the current
  // route, which is not what ?next= means. Normalise to a rooted path.
  const path = url.pathname.startsWith('/') ? url.pathname : `/${url.pathname}`;

  // Never send the user back to the auth screens: that loops forever.
  if (/^\/(login|signup|forgot-password|verify-email)(\/|$)/.test(path)) return '';

  return `${path}${url.search}${url.hash}`;
}
