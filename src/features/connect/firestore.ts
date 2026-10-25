/**
 * Ujyalo Connect — Firestore reads and writes from the browser.
 *
 * Every function here is written against the rules in firestore.rules, and the
 * rules are what actually enforce them. If a caller tries something the rules
 * forbid (posting without joining, editing a message, renaming a channel it
 * does not own) the write fails and the UI shows the error — the client does
 * not try to be the security boundary.
 */
import { getFirebaseAuth, getFirebaseDb } from '@/services/firebase/client';
import type { Channel, Community, ConnectMessage, ConnectProfile } from './types';

const COMMUNITIES = 'communities';

export async function listCommunities(limit = 50): Promise<Community[]> {
  const db = await getFirebaseDb();
  const { collection, getDocs, limit: lim, orderBy, query } = await import('firebase/firestore');
  const snap = await getDocs(query(collection(db, COMMUNITIES), orderBy('memberCount', 'desc'), lim(limit)));
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Community, 'id'>) }));
}

export async function getCommunityBySlug(slug: string): Promise<Community | null> {
  const db = await getFirebaseDb();
  const { collection, getDocs, limit: lim, query, where } = await import('firebase/firestore');
  const snap = await getDocs(query(collection(db, COMMUNITIES), where('slug', '==', slug), lim(1)));
  const doc = snap.docs[0];
  return doc ? { id: doc.id, ...(doc.data() as Omit<Community, 'id'>) } : null;
}

export async function listChannels(communityId: string): Promise<Channel[]> {
  const db = await getFirebaseDb();
  const { collection, getDocs, orderBy, query } = await import('firebase/firestore');
  const snap = await getDocs(query(collection(db, COMMUNITIES, communityId, 'channels'), orderBy('createdAt', 'asc')));
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Channel, 'id'>) }));
}

/**
 * How many people are actually in a community.
 *
 * An aggregation query, so it costs one small request rather than reading
 * every member document. Falls back to the stored counter when the count
 * cannot be read, so the page still renders something rather than an error.
 */
export async function countMembers(communityId: string, fallback = 0): Promise<number> {
  try {
    const db = await getFirebaseDb();
    const { collection, getCountFromServer } = await import('firebase/firestore');
    const snap = await getCountFromServer(collection(db, COMMUNITIES, communityId, 'members'));
    return snap.data().count;
  } catch {
    return fallback;
  }
}

export async function isMember(communityId: string, uid: string): Promise<boolean> {
  const db = await getFirebaseDb();
  const { doc, getDoc } = await import('firebase/firestore');
  try {
    const snap = await getDoc(doc(db, COMMUNITIES, communityId, 'members', uid));
    return snap.exists();
  } catch {
    // "not a member" and "not allowed to look" are the same answer here.
    return false;
  }
}

async function getDocProfile(db: import('firebase/firestore').Firestore, uid: string) {
  const { doc, getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'connectProfiles', uid));
  // In the modular client SDK `exists` is a method, unlike the Admin SDK.
  return snap.exists() ? (snap.data() as ConnectProfile) : null;
}

/**
 * The communities this person belongs to.
 *
 * Read from the membership list the server keeps on the profile. It cannot be
 * edited from a browser (see firestore.rules), so it cannot be inflated — and
 * unlike a collection-group query over member documents, it does not require
 * those documents to be readable by strangers.
 */
export async function listMyMemberships(uid: string): Promise<string[]> {
  const db = await getFirebaseDb();
  const profile = await getDocProfile(db, uid);
  return Array.isArray(profile?.memberships) ? profile.memberships : [];
}

/**
 * The communities behind that id list.
 *
 * One query rather than one read per id, capped at the ten an `in` filter
 * allows — a profile in more than ten communities is not a case worth making
 * eleven round trips for.
 */
export async function listMyMemberCommunities(uid: string): Promise<Community[]> {
  const ids = (await listMyMemberships(uid)).slice(0, 10);
  if (ids.length === 0) return [];
  const db = await getFirebaseDb();
  const { collection, documentId, getDocs, query, where } = await import('firebase/firestore');
  const snap = await getDocs(query(collection(db, COMMUNITIES), where(documentId(), 'in', ids)));
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Community, 'id'>) }));
}

/**
 * Joins a community.
 *
 * Server-side, because one join writes three documents and the rules (rightly)
 * let a browser write none of the other two.
 */
export async function joinCommunity(communityId: string, _uid: string): Promise<void> {
  await postMembership('join', communityId);
}

/**
 * Leaves a community, by the same route.
 */
export async function leaveCommunity(communityId: string, _uid: string): Promise<void> {
  await postMembership('leave', communityId);
}

async function postMembership(action: 'join' | 'leave', communityId: string): Promise<void> {
  const auth = await getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('You need to be signed in to do that.');
  const token = await user.getIdToken();
  const response = await fetch(`/api/connect/${action}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ communityId }),
  });
  if (response.ok) return;
  const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
  if (response.status === 401) throw new Error('Your session expired. Sign in again to continue.');
  throw new Error(body.message ?? 'That did not save. Try again.');
}

/**
 * Live messages for a channel.
 *
 * `orderBy('createdAt')` with `limit` keeps the subscription cheap; older
 * messages are not loaded, which is an honest trade for a community that is
 * only starting. The unsubscribe is returned so a page can close the socket.
 */
export async function subscribeMessages(
  communityId: string,
  channelId: string,
  onMessages: (messages: ConnectMessage[]) => void,
  onError: (message: string) => void,
): Promise<() => void> {
  const db = await getFirebaseDb();
  const { collection, onSnapshot, orderBy, query, limit } = await import('firebase/firestore');
  const q = query(
    collection(db, COMMUNITIES, communityId, 'channels', channelId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(200),
  );
  return onSnapshot(
    q,
    (snap) => {
      onMessages(
        snap.docs.map((doc) => {
          const data = doc.data() as Omit<ConnectMessage, 'id'>;
          return { id: doc.id, ...data };
        }),
      );
    },
    (error) => {
      const code = (error as { code?: string }).code ?? '';
      onError(
        code === 'permission-denied'
          ? 'Messages are only visible to members of this community. Join to read and reply.'
          : 'The message feed could not be loaded.',
      );
    },
  );
}

export async function sendMessage(input: {
  communityId: string;
  channelId: string;
  uid: string;
  authorName: string;
  authorAvatar: string | null;
  body: string;
}): Promise<void> {
  const db = await getFirebaseDb();
  const { addDoc, collection } = await import('firebase/firestore');
  if (input.body.length > 2000) throw new Error('Messages are limited to 2000 characters.');
  await addDoc(collection(db, COMMUNITIES, input.communityId, 'channels', input.channelId, 'messages'), {
    authorUid: input.uid,
    authorName: input.authorName.slice(0, 60),
    authorAvatar: input.authorAvatar,
    body: input.body,
    createdAt: new Date().toISOString(),
  });
}

export async function createCommunity(input: {
  name: string;
  slug: string;
  description: string;
  uid: string;
}): Promise<string> {
  const db = await getFirebaseDb();
  const { collection, doc, writeBatch } = await import('firebase/firestore');
  const now = new Date().toISOString();
  // `doc(collection(...))` generates the id locally, so the community, its
  // membership and its first channel are written in a single atomic batch —
  // there is no window where a community exists that nobody can post in.
  const ref = doc(collection(db, COMMUNITIES));

  const batch = writeBatch(db);
  batch.set(ref, {
    name: input.name,
    slug: input.slug,
    description: input.description,
    ownerUid: input.uid,
    memberCount: 1,
    createdAt: now,
  });
  batch.set(doc(db, COMMUNITIES, ref.id, 'members', input.uid), {
    uid: input.uid,
    role: 'member',
    joinedAt: now,
  });
  batch.set(doc(db, COMMUNITIES, ref.id, 'channels', 'general'), {
    name: 'general',
    topic: 'Say hello',
    createdAt: now,
  });
  await batch.commit();

  // The person who creates a community is in it. Membership is written by the
  // server (member document, counter and profile list in one transaction), so
  // this is the same call the Join button makes.
  await postMembership('join', ref.id);

  return ref.id;
}

export async function updateMyProfile(uid: string, patch: { displayName?: string; bio?: string }): Promise<void> {
  const db = await getFirebaseDb();
  const { doc, updateDoc } = await import('firebase/firestore');
  await updateDoc(doc(db, 'connectProfiles', uid), {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}

export async function getMyProfile(uid: string): Promise<ConnectProfile | null> {
  const db = await getFirebaseDb();
  return getDocProfile(db, uid);
}
