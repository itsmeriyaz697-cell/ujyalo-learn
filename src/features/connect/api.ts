/**
 * Ujyalo Connect — the browser side of Discord sign-in.
 *
 * Two rules shape everything here:
 *
 *   1. The client never sees the Discord client secret, the authorization code
 *      exchange, or the PKCE verifier. It only ever receives a Firebase custom
 *      token, and only once.
 *   2. Nothing redirects automatically. `startSignIn` is the one place that
 *      navigates to /api/connect/start, and it is only called from a button
 *      press — a visitor reading the community list is never sent anywhere.
 */
import { getFirebaseAuth, isFirebaseConfigured } from '@/services/firebase/client';
import { signOut as firebaseSignOut } from 'firebase/auth';
import type { ConnectStatus } from './types';

const CONNECT = '/api/connect';

export async function fetchConnectStatus(): Promise<ConnectStatus> {
  try {
    const response = await fetch(`${CONNECT}/status`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`status ${response.status}`);
    return (await response.json()) as ConnectStatus;
  } catch {
    // A failed status call must not block the page: the hub still lists
    // communities, and the sign-in button reports the problem when pressed.
    return { configured: false, oauth: false, storage: 'unknown' };
  }
}

/**
 * Sends the browser to the server, which sets the state cookie and forwards to
 * Discord. A full navigation, not fetch: the OAuth consent screen is a
 * different origin and must be a top-level page.
 */
export function startSignIn(next = '/connect'): void {
  const url = `${CONNECT}/start?next=${encodeURIComponent(next)}`;
  window.location.assign(url);
}

export type SessionResult =
  | { ok: true; uid: string; next: string }
  | { ok: false; reason: 'no_pending_session' | 'auth_unavailable' | 'not_configured' | 'failed'; message: string };

/**
 * Claims the one-time token minted by the callback and turns it into a real
 * Firebase session. The token is in an httpOnly cookie, so this is a
 * same-origin request with credentials included.
 */
export async function completeSignIn(): Promise<SessionResult> {
  if (!isFirebaseConfigured) {
    return {
      ok: false,
      reason: 'not_configured',
      message: 'This deployment has no Firebase project configured, so a Discord session cannot be created yet.',
    };
  }

  let payload: { uid?: string; token?: string; next?: string };
  try {
    const response = await fetch(`${CONNECT}/session`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (response.status === 401) {
      return { ok: false, reason: 'no_pending_session', message: 'That sign-in has already been used or has expired.' };
    }
    if (!response.ok) {
      return { ok: false, reason: 'failed', message: 'The sign-in could not be completed. Please try again.' };
    }
    payload = (await response.json()) as typeof payload;
  } catch {
    return { ok: false, reason: 'failed', message: 'The sign-in could not be completed. Check your connection.' };
  }

  if (!payload.token || !payload.uid) {
    return { ok: false, reason: 'failed', message: 'The sign-in response was incomplete.' };
  }

  try {
    const auth = await getFirebaseAuth();
    const { signInWithCustomToken } = await import('firebase/auth');
    await signInWithCustomToken(auth, payload.token);
    return { ok: true, uid: payload.uid, next: payload.next ?? '/connect' };
  } catch (error) {
    const code = (error as { code?: string }).code ?? '';
    const message =
      code === 'auth/custom-token-mismatch'
        ? 'That sign-in was issued for a different Firebase project.'
        : code === 'auth/operation-not-allowed'
          ? 'Custom-token sign-in is switched off in the Firebase console. Enable it under Authentication → Sign-in method → Advanced.'
          : 'Firebase rejected the sign-in token. Please try again.';
    return { ok: false, reason: 'failed', message };
  }
}

export async function signOutConnect(): Promise<void> {
  try {
    await fetch(`${CONNECT}/logout`, { method: 'POST', credentials: 'include' });
  } catch {
    // Clearing cookies is best-effort; the Firebase session below is what
    // actually ends the sign-in.
  }
  if (!isFirebaseConfigured) return;
  try {
    const auth = await getFirebaseAuth();
    await firebaseSignOut(auth);
  } catch {
    /* already signed out */
  }
}
