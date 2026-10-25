/**
 * Ujyalo Connect — Firestore reads and writes from the browser.
 *
 * Every function here is written against the rules in firestore.rules, and the
 * rules are what actually enforce them. If a caller tries something the rules
 * forbid (posting without joining, editing a message, renaming a channel it
 * does not own) the write fails and the UI shows the error — the client does
 * not try to be the security boundary.
 */
import { getFirebaseDb } from '@/services/firebase/client';
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

export async function isMember(communityId: string, uid: string): Promise<boolean> {
  const db = await getFirebaseDb();
  const { doc, getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, COMMUNITIES, communityId, 'members', uid));
  return snap.exists();
}

export async function listMyMemberships(uid: string): Promise<string[]> {
  const db = await getFirebaseDb();
  // Memberships live in two places: a member document per community (which the
  // rules use) and an id list on the profile (which is one read instead of a
  // collection-group query that would need its own index).
  const profile = await getDocProfile(db, uid);
  return profile?.memberships ?? [];
}

export async function joinCommunity(communityId: string, uid: string): Promise<void> {
  const db = await getFirebaseDb();
  const { doc, setDoc, updateDoc, increment } = await import('firebase/firestore');
  await setDoc(doc(db, COMMUNITIES, communityId, 'members', uid), {
    uid,
    role: 'member',
    joinedAt: new Date().toISOString(),
  });
  // memberCount is display metadata; a failure here does not undo the join.
  try {
    await updateDoc(doc(db, COMMUNITIES, communityId), { memberCount: increment(1) });
  } catch {
    /* counters are cosmetic */
  }
  try {
    const current = (await getDocProfile(db, uid))?.memberships ?? [];
    if (!current.includes(communityId)) {
      await updateDoc(doc(db, 'connectProfiles', uid), { memberships: [...current, communityId].slice(0, 200) });
    }
  } catch {
    /* profile is written by the server on next sign-in */
  }
}

async function getDocProfile(db: import('firebase/firestore').Firestore, uid: string) {
  const { doc, getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'connectProfiles', uid));
  // In the modular client SDK `exists` is a method, unlike the Admin SDK.
  return snap.exists() ? (snap.data() as ConnectProfile) : null;
}

export async function leaveCommunity(communityId: string, uid: string): Promise<void> {
  const db = await getFirebaseDb();
  const { doc, deleteDoc, updateDoc, increment } = await import('firebase/firestore');
  await deleteDoc(doc(db, COMMUNITIES, communityId, 'members', uid));
  try {
    await updateDoc(doc(db, COMMUNITIES, communityId), { memberCount: increment(-1) });
  } catch {
    /* cosmetic */
  }
  try {
    const profile = await getDocProfile(db, uid);
    const next = (profile?.memberships ?? []).filter((id) => id !== communityId);
    await updateDoc(doc(db, 'connectProfiles', uid), { memberships: next });
  } catch {
    /* ignore */
  }
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

  // The profile's membership list is display metadata; failing here does not
  // undo the community, and the server rewrites the list on next sign-in.
  try {
    const profile = await getDocProfile(db, input.uid);
    const current = profile?.memberships ?? [];
    if (!current.includes(ref.id)) {
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'connectProfiles', input.uid), { memberships: [...current, ref.id].slice(0, 200) });
    }
  } catch {
    /* ignore */
  }

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
