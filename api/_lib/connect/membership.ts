/**
 * Membership, written on the server.
 *
 * Why this is not a client-side `setDoc`.
 *
 * Joining looks like one write and is really three: the member document (which
 * the rules read to decide whether messages are visible), the community's
 * member count, and the list of communities on the person's profile. A browser
 * cannot be trusted with the last two — the rules only let a community's owner
 * edit the community document, and the membership list on a profile is
 * server-owned so it cannot be forged. Doing it here keeps all three in one
 * transaction and lets the member documents stay readable to members only,
 * instead of every visitor being able to enumerate who is in what.
 */
import { adminDb } from '../admin.js';
import type { Firestore } from 'firebase-admin/firestore';

export type MembershipResult =
  | { ok: true; communityId: string; memberCount: number; joined: boolean }
  | { ok: false; reason: 'unconfigured' | 'not_found' | 'failed'; detail?: string };

const MAX_MEMBERSHIPS = 200;

function db(): Firestore | null {
  return adminDb();
}

/** The uid must be a Connect identity: derived from a Discord id. */
export function isConnectUid(uid: string): boolean {
  return /^discord_[0-9]{5,25}$/.test(uid);
}

async function updateMembership(
  uid: string,
  rawCommunityId: string,
  action: 'join' | 'leave',
): Promise<MembershipResult> {
  const store = db();
  if (!store) return { ok: false, reason: 'unconfigured' };

  // A document id, not a slug: Firestore-generated ids are mixed case, so the
  // slug pattern (lowercase, dashes) would reject every community this app
  // creates. Only the shape that could escape the collection is refused.
  const communityId = String(rawCommunityId ?? '').trim();
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(communityId)) {
    return { ok: false, reason: 'not_found' };
  }

  try {
    return await store.runTransaction(async (tx) => {
      const communityRef = store.doc(`communities/${communityId}`);
      const memberRef = store.doc(`communities/${communityId}/members/${uid}`);
      const profileRef = store.doc(`connectProfiles/${uid}`);

      const [communitySnap, memberSnap, profileSnap] = await Promise.all([
        tx.get(communityRef),
        tx.get(memberRef),
        tx.get(profileRef),
      ]);

      if (!communitySnap.exists) return { ok: false as const, reason: 'not_found' as const };

      const profile = profileSnap.exists ? profileSnap.data() ?? {} : {};
      const listed: string[] = Array.isArray(profile.memberships) ? profile.memberships : [];
      const count = Number(communitySnap.get('memberCount') ?? 0);

      if (action === 'join') {
        if (memberSnap.exists) {
          return { ok: true as const, communityId, memberCount: count, joined: false };
        }
        tx.set(memberRef, { uid, role: 'member', joinedAt: new Date().toISOString() });
        tx.set(communityRef, { memberCount: count + 1 }, { merge: true });
        if (!listed.includes(communityId)) {
          tx.set(profileRef, { memberships: [...listed, communityId].slice(0, MAX_MEMBERSHIPS) }, { merge: true });
        }
        return { ok: true as const, communityId, memberCount: count + 1, joined: true };
      }

      if (!memberSnap.exists) {
        return { ok: true as const, communityId, memberCount: count, joined: false };
      }
      tx.delete(memberRef);
      tx.set(communityRef, { memberCount: Math.max(0, count - 1) }, { merge: true });
      tx.set(
        profileRef,
        { memberships: listed.filter((id) => id !== communityId).slice(0, MAX_MEMBERSHIPS) },
        { merge: true },
      );
      return { ok: true as const, communityId, memberCount: Math.max(0, count - 1), joined: false };
    });
  } catch (error) {
    console.error('[connect] membership write failed:', (error as Error).message);
    return { ok: false, reason: 'failed', detail: (error as Error).message };
  }
}

export function joinCommunity(uid: string, communityId: string): Promise<MembershipResult> {
  return updateMembership(uid, communityId, 'join');
}

export function leaveCommunity(uid: string, communityId: string): Promise<MembershipResult> {
  return updateMembership(uid, communityId, 'leave');
}
