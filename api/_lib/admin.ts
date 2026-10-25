/**
 * Firebase Admin access shared by every server route.
 *
 * This is the Arena's original three-mode initialisation, lifted out so the
 * community backend can use exactly the same code path instead of growing a
 * second, subtly different one. Two copies of credential handling is how a
 * deployment ends up with one feature working and another reporting "not
 * configured" on the same key.
 *
 *   emulator        FIREBASE_AUTH_EMULATOR_HOST is set. Local tests, no keys.
 *   service-account FIREBASE_SERVICE_ACCOUNT holds the JSON key (raw or base64).
 *   unconfigured    Nothing is set. Callers must say so, not pretend.
 */
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

export type AdminMode = 'emulator' | 'service-account' | 'unconfigured';

export interface AdminEnv {
  mode: AdminMode;
  projectId: string | null;
}

const APP_NAME = 'ujyalo-server';

export function adminEnv(): AdminEnv {
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

export function adminApp(): App {
  if (cachedApp) return cachedApp;
  const existing = getApps().find((app) => app.name === APP_NAME);
  if (existing) {
    cachedApp = existing;
    return existing;
  }

  const env = adminEnv();
  if (env.mode === 'emulator') {
    cachedApp = initializeApp({ projectId: env.projectId ?? 'demo-ujyalo' }, APP_NAME);
    return cachedApp;
  }
  if (env.mode === 'service-account') {
    const credentials = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT as string);
    cachedApp = initializeApp({ credential: cert(credentials), projectId: credentials.projectId }, APP_NAME);
    return cachedApp;
  }
  throw new Error('Firebase Admin is not configured');
}

/**
 * Why the backend is in the state it is in.
 *
 * "No credentials" and "credentials present but unreadable" look identical
 * from the outside, and only one of them is fixed by pasting again. Reporting
 * the difference turns a silent demo mode into a message that names the fix.
 */
export function adminStatus(): { mode: AdminMode; problem: string | null } {
  const env = adminEnv();
  if (env.mode === 'unconfigured') return { mode: env.mode, problem: null };
  try {
    adminApp();
    return { mode: env.mode, problem: null };
  } catch (error) {
    return {
      mode: env.mode,
      problem:
        (error as Error)?.message ??
        'FIREBASE_SERVICE_ACCOUNT is present but could not be read as a service account key.',
    };
  }
}

/** Firestore handle, or null when nothing is configured (never throws to callers). */
export function adminDb(): Firestore | null {
  try {
    return getFirestore(adminApp());
  } catch {
    return null;
  }
}

/** Auth handle, or null when nothing is configured. */
export function adminAuth(): Auth | null {
  try {
    return getAuth(adminApp());
  } catch {
    return null;
  }
}
