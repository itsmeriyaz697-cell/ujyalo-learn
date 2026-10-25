/**
 * Ujyalo Connect — server-side identity.
 *
 * The one job that must not be done in the browser: turning a verified Discord
 * account into exactly one Firebase uid. Two documents are written together in
 * a transaction:
 *
 *   connectIdentities/{discordId}  → { uid }        (client-inaccessible)
 *   connectProfiles/{uid}          → the profile    (readable by its owner)
 *
 * The identity document is the conflict detector. If it already points at a
 * different uid, the sign-in is refused rather than silently merged — that is
 * the "prevent duplicate accounts and identity conflicts" requirement, and it
 * is enforced in the database rather than by hoping the client behaves.
 */
import { adminAuth, adminDb } from '../admin.js';
import { avatarUrl, uidForDiscordId, type DiscordUser } from './oauth.js';

export interface ConnectProfile {
  uid: string;
  discordId: string;
  discordUsername: string;
  displayName: string;
  avatarUrl: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
  memberships: string[];
  bio: string;
}

export type UpsertResult =
  | { ok: true; profile: ConnectProfile; created: boolean }
  | { ok: false; reason: 'conflict' | 'unconfigured' | 'failed'; detail?: string };

/** Firestore rejects `undefined`; every field is normalised before writing. */
function normalise(user: DiscordUser, existing: Partial<ConnectProfile> | null, now: string): Omit<ConnectProfile, 'memberships'> & { memberships: string[] } {
  const name = (user.global_name ?? '').trim() || user.username;
  return {
    uid: uidForDiscordId(user.id),
    discordId: user.id,
    discordUsername: user.username,
    // A returning user keeps whatever display name they chose for themselves.
    displayName: existing?.displayName || name,
    avatarUrl: avatarUrl(user.id, user.avatar) ?? existing?.avatarUrl ?? null,
    email: user.email ?? existing?.email ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    memberships: Array.isArray(existing?.memberships) ? existing.memberships.slice(0, 200) : [],
    bio: typeof existing?.bio === 'string' ? existing.bio.slice(0, 400) : '',
  };
}

export async function upsertDiscordProfile(user: DiscordUser): Promise<UpsertResult> {
  const db = adminDb();
  if (!db) return { ok: false, reason: 'unconfigured' };

  const uid = uidForDiscordId(user.id);
  const now = new Date().toISOString();

  try {
    const result = await db.runTransaction(async (tx) => {
      const identityRef = db.doc(`connectIdentities/${user.id}`);
      const profileRef = db.doc(`connectProfiles/${uid}`);

      const [identitySnap, profileSnap] = await Promise.all([tx.get(identityRef), tx.get(profileRef)]);

      if (identitySnap.exists) {
        const mapped = identitySnap.get('uid') as string | undefined;
        if (mapped && mapped !== uid) {
          return { ok: false as const, reason: 'conflict' as const, detail: mapped };
        }
      }

      const existing = profileSnap.exists ? (profileSnap.data() as Partial<ConnectProfile>) : null;
      const profile = normalise(user, existing, now);

      tx.set(identityRef, { uid, createdAt: existing?.createdAt ?? now, lastSeenAt: now }, { merge: true });
      tx.set(profileRef, profile, { merge: true });

      return { ok: true as const, profile, created: !profileSnap.exists };
    });

    return result;
  } catch (error) {
    console.error('[connect] profile upsert failed:', (error as Error).message);
    return { ok: false, reason: 'failed', detail: (error as Error).message };
  }
}

/** Mints the short-lived custom token the browser exchanges for a session. */
export async function customTokenFor(uid: string): Promise<string | null> {
  const auth = adminAuth();
  if (!auth) return null;
  try {
    return await auth.createCustomToken(uid, { provider: 'discord' });
  } catch (error) {
    console.error('[connect] custom token failed:', (error as Error).message);
    return null;
  }
}

export async function profileFor(uid: string): Promise<ConnectProfile | null> {
  const db = adminDb();
  if (!db) return null;
  const snap = await db.doc(`connectProfiles/${uid}`).get();
  return snap.exists ? (snap.data() as ConnectProfile) : null;
}

export async function connectStatus(): Promise<{ mode: string; problem: string | null }> {
  const db = adminDb();
  return { mode: db ? 'configured' : 'unconfigured', problem: null };
}
