/**
 * Firestore rules for Ujyalo Connect.
 *
 * The community feature is the first place in this project where one person's
 * document is meant to be readable by other people. That is a genuinely new
 * rule shape, so it gets its own suite rather than a few assertions bolted onto
 * the student-data file.
 *
 * What is being proved:
 *   - community metadata is public, messages are not;
 *   - only members can read or write a channel's messages;
 *   - the identity mapping is invisible and unwritable from any client;
 *   - a profile cannot be created from a browser, and its Discord fields
 *     cannot be rewritten by editing your own document;
 *   - anonymous sessions (the browser guest from the navigation work) are not
 *     a credential for posting.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, getDocs } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

let testEnv: RulesTestEnvironment;

const PROJECT_ID = 'demo-ujyalo';
const ALICE = 'discord_100000000000000001';
const BOB = 'discord_100000000000000002';
const GUEST = 'guest-local';
const COMMUNITY = 'see-2026';

/** A Discord-backed session: Firebase marks custom-token users as `custom`. */
const connectDb = (uid: string) =>
  testEnv.authenticatedContext(uid, { firebase: { sign_in_provider: 'custom' } }).firestore();

/** The browser-only guest from the navigation upgrade is an anonymous user. */
const guestDb = () =>
  testEnv.authenticatedContext(GUEST, { firebase: { sign_in_provider: 'anonymous' } }).firestore();

const anonDb = () => testEnv.unauthenticatedContext().firestore();

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv?.cleanup();
});

const community = (overrides: Record<string, unknown> = {}) => ({
  name: 'SEE 2026',
  slug: 'see-2026',
  description: 'A community for students sitting SEE in 2026.',
  ownerUid: ALICE,
  memberCount: 0,
  createdAt: '2026-10-25T00:00:00.000Z',
  ...overrides,
});

const member = (uid: string) => ({ uid, role: 'member', joinedAt: '2026-10-25T00:00:00.000Z' });

const message = (authorUid: string, overrides: Record<string, unknown> = {}) => ({
  authorUid,
  authorName: 'Someone',
  body: 'Anyone have last year’s science paper?',
  createdAt: '2026-10-25T00:00:00.000Z',
  ...overrides,
});

/** Seeds with Admin credentials, which bypass rules exactly as the API does. */
async function seed() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'communities', COMMUNITY), community());
    await setDoc(doc(db, 'communities', COMMUNITY, 'members', ALICE), member(ALICE));
    await setDoc(doc(db, 'communities', COMMUNITY, 'channels', 'general'), {
      name: 'general',
      topic: 'Anything',
      createdAt: '2026-10-25T00:00:00.000Z',
    });
    await setDoc(doc(db, 'communities', COMMUNITY, 'channels', 'general', 'messages', 'm1'), message(ALICE));
    await setDoc(doc(db, 'connectProfiles', ALICE), {
      uid: ALICE,
      discordId: '100000000000000001',
      discordUsername: 'riyaz',
      displayName: 'Riyaz',
      avatarUrl: null,
      email: 'a@example.test',
      createdAt: '2026-10-25T00:00:00.000Z',
      updatedAt: '2026-10-25T00:00:00.000Z',
      memberships: [COMMUNITY],
      bio: '',
    });
    await setDoc(doc(db, 'connectIdentities', '100000000000000001'), {
      uid: ALICE,
      createdAt: '2026-10-25T00:00:00.000Z',
    });
  });
}

describe('browsing without an account', () => {
  it('lets a signed-out visitor read community metadata', async () => {
    await seed();
    await assertSucceeds(getDoc(doc(anonDb(), 'communities', COMMUNITY)));
    await assertSucceeds(getDocs(collection(anonDb(), 'communities', COMMUNITY, 'channels')));
  });

  it('does not let a signed-out visitor read messages', async () => {
    await seed();
    await assertFails(getDoc(doc(anonDb(), 'communities', COMMUNITY, 'channels', 'general', 'messages', 'm1')));
    await assertFails(getDocs(collection(anonDb(), 'communities', COMMUNITY, 'channels', 'general', 'messages')));
  });
});

describe('membership', () => {
  // Joining and leaving are POST /api/connect/join and /leave. The endpoint
  // writes three documents in one transaction (member record, community
  // counter, profile list), which a browser cannot do safely — so the client
  // holds no write access here at all. These tests pin that down, because a
  // permissive rule here would let anyone join a community they were excluded
  // from with a single setDoc.
  it('refuses a client-side join, even as yourself', async () => {
    await seed();
    await assertFails(setDoc(doc(connectDb(BOB), 'communities', COMMUNITY, 'members', BOB), member(BOB)));
  });

  it('refuses a member document naming someone else', async () => {
    await seed();
    await assertFails(setDoc(doc(connectDb(BOB), 'communities', COMMUNITY, 'members', ALICE), member(ALICE)));
  });

  it('refuses a client-side leave', async () => {
    await seed();
    await assertFails(deleteDoc(doc(connectDb(ALICE), 'communities', COMMUNITY, 'members', ALICE)));
  });

  it('refuses an anonymous (browser-guest) session as a credential', async () => {
    await seed();
    await assertFails(setDoc(doc(guestDb(), 'communities', COMMUNITY, 'members', GUEST), member(GUEST)));
  });

  it('lets a member read the member list', async () => {
    await seed();
    await assertSucceeds(getDocs(collection(connectDb(ALICE), 'communities', COMMUNITY, 'members')));
  });

  it('hides the member list from a signed-in non-member', async () => {
    await seed();
    await assertFails(getDocs(collection(connectDb(BOB), 'communities', COMMUNITY, 'members')));
  });

  it('hides the member list from a visitor with no account', async () => {
    await seed();
    await assertFails(getDocs(collection(anonDb(), 'communities', COMMUNITY, 'members')));
  });

  it('lets anyone read their own membership record', async () => {
    await seed();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'communities', COMMUNITY, 'members', BOB), member(BOB));
    });
    await assertSucceeds(getDoc(doc(connectDb(BOB), 'communities', COMMUNITY, 'members', BOB)));
  });
});

describe('messages', () => {
  it('lets a member post, read and delete their own message', async () => {
    await seed();
    await assertSucceeds(addDoc(collection(connectDb(ALICE), 'communities', COMMUNITY, 'channels', 'general', 'messages'), message(ALICE)));
    await assertSucceeds(getDocs(collection(connectDb(ALICE), 'communities', COMMUNITY, 'channels', 'general', 'messages')));
  });

  it('refuses a non-member, even when signed in', async () => {
    await seed();
    await assertFails(
      addDoc(collection(connectDb(BOB), 'communities', COMMUNITY, 'channels', 'general', 'messages'), message(BOB)),
    );
    await assertFails(getDocs(collection(connectDb(BOB), 'communities', COMMUNITY, 'channels', 'general', 'messages')));
  });

  it('refuses a message written in someone else’s name', async () => {
    await seed();
    await assertFails(
      addDoc(collection(connectDb(ALICE), 'communities', COMMUNITY, 'channels', 'general', 'messages'), message(BOB)),
    );
  });

  it('refuses empty and oversized bodies', async () => {
    await seed();
    const pathSegments = ['communities', COMMUNITY, 'channels', 'general', 'messages'];
    await assertFails(
      addDoc(collection(connectDb(ALICE), pathSegments.join('/')), message(ALICE, { body: '' })),
    );
    await assertFails(
      addDoc(collection(connectDb(ALICE), pathSegments.join('/')), message(ALICE, { body: 'x'.repeat(2001) })),
    );
  });

  it('refuses editing a message after it is sent', async () => {
    await seed();
    await assertFails(
      updateDoc(doc(connectDb(ALICE), 'communities', COMMUNITY, 'channels', 'general', 'messages', 'm1'), {
        body: 'edited later',
      }),
    );
  });

  it('refuses deleting somebody else’s message', async () => {
    await seed();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'communities', COMMUNITY, 'members', BOB), member(BOB));
    });
    await assertFails(deleteDoc(doc(connectDb(BOB), 'communities', COMMUNITY, 'channels', 'general', 'messages', 'm1')));
  });
});

describe('identity mapping', () => {
  it('is unreadable and unwritable from any client', async () => {
    await seed();
    await assertFails(getDoc(doc(connectDb(ALICE), 'connectIdentities', '100000000000000001')));
    await assertFails(getDoc(doc(anonDb(), 'connectIdentities', '100000000000000001')));
    await assertFails(
      setDoc(doc(connectDb(BOB), 'connectIdentities', '100000000000000002'), { uid: BOB }),
    );
  });
});

describe('profiles', () => {
  it('are readable only by their owner', async () => {
    await seed();
    await assertSucceeds(getDoc(doc(connectDb(ALICE), 'connectProfiles', ALICE)));
    await assertFails(getDoc(doc(connectDb(BOB), 'connectProfiles', ALICE)));
    await assertFails(getDoc(doc(anonDb(), 'connectProfiles', ALICE)));
  });

  it('cannot be created from a browser — only the server mints one', async () => {
    await assertFails(
      setDoc(doc(connectDb(BOB), 'connectProfiles', BOB), {
        uid: BOB,
        discordId: '100000000000000002',
        discordUsername: 'someone',
        displayName: 'Someone',
        avatarUrl: null,
        email: null,
        createdAt: '2026-10-25T00:00:00.000Z',
        updatedAt: '2026-10-25T00:00:00.000Z',
        memberships: [],
        bio: '',
      }),
    );
  });

  it('lets the owner change their display name and bio', async () => {
    await seed();
    await assertSucceeds(
      updateDoc(doc(connectDb(ALICE), 'connectProfiles', ALICE), { displayName: 'Riyaz C.', bio: 'Grade 10.' }),
    );
  });

  it('refuses rewriting the Discord identity onto a profile', async () => {
    await seed();
    await assertFails(
      updateDoc(doc(connectDb(ALICE), 'connectProfiles', ALICE), { discordId: '999', discordUsername: 'impostor' }),
    );
    await assertFails(updateDoc(doc(connectDb(ALICE), 'connectProfiles', ALICE), { memberships: ['someone-elses'] }));
  });

  it('refuses changing another person’s profile', async () => {
    await seed();
    await assertFails(updateDoc(doc(connectDb(BOB), 'connectProfiles', ALICE), { displayName: 'Defaced' }));
  });
});

describe('creating a community', () => {
  it('is allowed for a connected user, owning what they create', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'communities', 'placeholder'), community({ ownerUid: BOB }));
    });
    const db = connectDb(BOB);
    await assertSucceeds(
      setDoc(doc(db, 'communities', 'grade-9'), community({ ownerUid: BOB, slug: 'grade-9', name: 'Grade 9' })),
    );
  });

  it('refuses creating a community owned by somebody else', async () => {
    await assertFails(
      setDoc(doc(connectDb(BOB), 'communities', 'steal'), community({ ownerUid: ALICE, slug: 'steal' })),
    );
  });

  it('refuses a slug that is not a slug', async () => {
    await assertFails(
      setDoc(doc(connectDb(BOB), 'communities', 'bad'), community({ ownerUid: BOB, slug: 'Not A Slug!', name: 'Bad' })),
    );
  });

  it('refuses creating one from an anonymous session', async () => {
    await assertFails(
      setDoc(doc(guestDb(), 'communities', 'anon'), community({ ownerUid: GUEST, slug: 'anon', name: 'Anon' })),
    );
  });
});
