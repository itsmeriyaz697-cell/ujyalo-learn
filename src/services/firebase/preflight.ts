import { getFirebaseDb } from '@/services/firebase/client';

/**
 * Is the database actually usable before we create an account?
 *
 * Without this, a fresh Firebase project strands every new student: signup
 * succeeds because Authentication is a different service from Firestore, then
 * onboarding fails to save the profile with a raw "Missing or insufficient
 * permissions". The account now exists, so retrying says "email already in
 * use", and the student has no way forward and no idea what happened.
 *
 * The probe reads `settings/site`, which the rules expose to everyone. If that
 * is refused, the deployed rules are still the locked defaults and nothing in
 * the app can work — so refuse before consuming the email address.
 */

export const DATABASE_NOT_READY =
  'This site is not finished setting up its database yet, so accounts cannot be created. ' +
  'Please try again later — no account was created.';

export type DatabaseState = 'ready' | 'locked' | 'unreachable';

/** Separated from the probe so the classification can be tested directly. */
export function classifyProbeFailure(error: unknown): DatabaseState {
  const code = (error as { code?: string })?.code ?? '';
  const message = (error as Error)?.message ?? '';
  if (code === 'permission-denied' || /insufficient permissions/i.test(message)) return 'locked';
  return 'unreachable';
}

export class DatabaseNotReadyError extends Error {
  readonly code: string;
  constructor(state: DatabaseState) {
    super(
      state === 'locked'
        ? DATABASE_NOT_READY
        : 'Could not reach the server. Check your internet connection and try again.',
    );
    this.code = state === 'locked' ? 'app/database-not-ready' : 'app/database-unreachable';
    this.name = 'DatabaseNotReadyError';
  }
}

export async function assertDatabaseReady(): Promise<void> {
  try {
    const [{ doc, getDoc }, db] = await Promise.all([import('firebase/firestore'), getFirebaseDb()]);
    await getDoc(doc(db, 'settings', 'site'));
  } catch (error) {
    throw new DatabaseNotReadyError(classifyProbeFailure(error));
  }
}
