/**
 * Global Quiz Arena — server-only persistence.
 *
 * The Arena is the only part of Ujyalo Learn where students compete, so it is
 * the only part where a tampered browser must change nothing. Every write in
 * this file runs with Admin credentials and is reachable only from the API.
 *
 * Three environments, chosen explicitly:
 *
 *   emulator       FIREBASE_AUTH_EMULATOR_HOST is set. Used by the local test
 *                  run; no credentials needed.
 *   service-account FIREBASE_SERVICE_ACCOUNT holds the JSON key in a server
 *                  environment variable. Never in the repo, never in the client.
 *   unconfigured   Nothing is set. The API reports this honestly and the UI
 *                  falls back to its labelled demo mode.
 *
 * There is deliberately no fourth "just trust the client" mode.
 */
import { getAuth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { adminApp, adminDb, adminEnv, adminStatus, type AdminMode } from '../admin.js';

export type ArenaMode = AdminMode;

export interface ArenaEnv {
  mode: ArenaMode;
  projectId: string | null;
}

/**
 * The Arena's view of the shared credential handling in `api/_lib/admin.ts`.
 * These wrappers are kept so the Arena code and its tests read the same as
 * before; the initialisation itself lives in one place now.
 */
export function arenaEnv(): ArenaEnv {
  return adminEnv();
}

export function arenaStatus(): { mode: ArenaMode; problem: string | null } {
  return adminStatus();
}

/** Firestore handle, or null when nothing is configured (never throws to callers). */
export function arenaDb(): Firestore | null {
  return adminDb();
}

export interface Caller {
  uid: string;
  /** True when the token is a real Firebase ID token, false for emulator test auth. */
  verified: boolean;
}

/**
 * Identify the caller.
 *
 * Production path: verify the Firebase ID token properly. A browser can forge
 * the header, but it cannot forge a signature, so the uid comes from Google's
 * verification and not from anything the client typed.
 *
 * Emulator path: `ARENA_ALLOW_TEST_AUTH=1` permits an explicit uid header. The
 * flag is refused outright when NODE_ENV is production or VERCEL_ENV is
 * production/preview, so it can never be switched on by accident in the
 * deployed system.
 */
export async function verifyCaller(req: {
  headers: Record<string, string | string[] | undefined>;
}): Promise<Caller | null> {
  const header = req.headers.authorization;
  const value = Array.isArray(header) ? header[0] : header;

  if (value?.startsWith('Bearer ')) {
    const token = value.slice(7).trim();
    if (!token) return null;
    try {
      const decoded = await getAuth(adminApp()).verifyIdToken(token, true);
      return { uid: decoded.uid, verified: true };
    } catch {
      return null;
    }
  }

  const testAuthAllowed =
    process.env.ARENA_ALLOW_TEST_AUTH === '1' &&
    process.env.NODE_ENV !== 'production' &&
    process.env.VERCEL_ENV !== 'production' &&
    process.env.VERCEL_ENV !== 'preview';

  if (testAuthAllowed) {
    const raw = req.headers['x-arena-test-uid'];
    const uid = Array.isArray(raw) ? raw[0] : raw;
    if (uid && /^[a-zA-Z0-9_-]{3,64}$/.test(uid)) return { uid, verified: false };
  }

  return null;
}

/** Rejects anonymous Firebase users, who have no stable identity to rank. */
export async function isAnonymousUser(uid: string): Promise<boolean> {
  try {
    const record = await getAuth(adminApp()).getUser(uid);
    return record.providerData.length === 0;
  } catch {
    return false;
  }
}
