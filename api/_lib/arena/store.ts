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
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

export type ArenaMode = 'emulator' | 'service-account' | 'unconfigured';

export interface ArenaEnv {
  mode: ArenaMode;
  projectId: string | null;
}

const APP_NAME = 'ujyalo-arena';

export function arenaEnv(): ArenaEnv {
  const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'demo-ujyalo';

  if (emulatorHost) return { mode: 'emulator', projectId };

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw && raw.trim()) return { mode: 'service-account', projectId };

  return { mode: 'unconfigured', projectId: null };
}

function parseServiceAccount(raw: string): { projectId: string; clientEmail: string; privateKey: string } {
  // Accept raw JSON, or JSON that was base64-encoded to survive shell quoting.
  let text = raw.trim();
  if (!text.startsWith('{')) {
    try {
      text = Buffer.from(text, 'base64').toString('utf8');
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT is neither JSON nor base64-encoded JSON');
    }
  }
  const parsed = JSON.parse(text) as { project_id?: string; client_email?: string; private_key?: string };
  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is missing project_id, client_email or private_key');
  }
  return {
    projectId: parsed.project_id,
    clientEmail: parsed.client_email,
    // Environments often store the key with escaped newlines.
    privateKey: parsed.private_key.replace(/\\n/g, '\n'),
  };
}

let cachedApp: App | null = null;

function adminApp(): App {
  if (cachedApp) return cachedApp;
  const existing = getApps().find((app) => app.name === APP_NAME);
  if (existing) {
    cachedApp = existing;
    return existing;
  }

  const env = arenaEnv();
  if (env.mode === 'emulator') {
    cachedApp = initializeApp({ projectId: env.projectId ?? 'demo-ujyalo' }, APP_NAME);
    return cachedApp;
  }
  if (env.mode === 'service-account') {
    const credentials = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT as string);
    cachedApp = initializeApp({ credential: cert(credentials), projectId: credentials.projectId }, APP_NAME);
    return cachedApp;
  }
  throw new Error('Arena storage is not configured');
}

/** Firestore handle, or null when nothing is configured (never throws to callers). */
export function arenaDb(): Firestore | null {
  try {
    return getFirestore(adminApp());
  } catch {
    return null;
  }
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
