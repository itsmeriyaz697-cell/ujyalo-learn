/**
 * Firestore security-rule tests.
 *
 * These run against the real Firestore emulator with the real firestore.rules
 * file, so they verify what the database actually enforces — not what the React
 * app chooses to do. Until these existed, the rules had never been executed at
 * all, which meant "students can only read their own data" was an intention
 * rather than a tested guarantee.
 *
 * Run with:  npm run test:rules
 * (that command starts the emulator, runs this file, then shuts it down)
 *
 * Not part of `npm test`, because it needs Java and a Firestore emulator.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

let testEnv: RulesTestEnvironment;

const PROJECT_ID = 'demo-ujyalo';
const ALICE = 'alice-uid';
const BOB = 'bob-uid';
const EDITOR = 'editor-uid';
const ADMIN = 'admin-uid';
const OWNER = 'owner-uid';

const db = (uid?: string) =>
  uid ? testEnv.authenticatedContext(uid).firestore() : testEnv.unauthenticatedContext().firestore();

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

// ── Fixtures matching what the app actually writes ──────────────────────────

const profile = (uid: string, overrides: Record<string, unknown> = {}) => ({
  uid,
  displayName: 'Student',
  email: `${uid}@example.com`,
  preferences: { subjects: ['mathematics'], goals: ['exam'], language: 'en' },
  onboardingComplete: true,
  createdAt: '2026-10-23T00:00:00.000Z',
  updatedAt: '2026-10-23T00:00:00.000Z',
  ...overrides,
});

const note = (ownerId: string, overrides: Record<string, unknown> = {}) => ({
  id: 'note-1',
  ownerId,
  title: 'Fractions',
  content: 'Body',
  subjectId: 'mathematics',
  topic: 'fractions',
  source: 'student',
  favorite: false,
  tags: [],
  createdAt: '2026-10-23T00:00:00.000Z',
  updatedAt: '2026-10-23T00:00:00.000Z',
  ...overrides,
});

const course = (overrides: Record<string, unknown> = {}) => ({
  id: 'c1',
  slug: 'see-mathematics-core',
  title: 'SEE Mathematics',
  summary: 'Core skills',
  description: 'A path',
  subjectId: 'mathematics',
  gradeMin: 9,
  gradeMax: 10,
  level: 'see',
  status: 'published',
  outcomes: [],
  lessons: [],
  tags: [],
  createdAt: '2026-10-23T00:00:00.000Z',
  updatedAt: '2026-10-23T00:00:00.000Z',
  ...overrides,
});

const resource = (overrides: Record<string, unknown> = {}) => ({
  id: 'r1',
  slug: 'active-recall',
  title: 'Active recall',
  description: 'A guide',
  status: 'published',
  type: 'guide',
  source: 'Ujyalo Learn original',
  license: 'CC BY 4.0',
  body: ['Section one'],
  tags: [],
  createdAt: '2026-10-23T00:00:00.000Z',
  updatedAt: '2026-10-23T00:00:00.000Z',
  ...overrides,
});

/** Seed with rules bypassed, as an administrator would. */
async function seed() {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.firestore();
    await setDoc(doc(d, 'roles', EDITOR), { role: 'editor' });
    await setDoc(doc(d, 'roles', ADMIN), { role: 'admin' });
    await setDoc(doc(d, 'roles', OWNER), { role: 'owner' });
    await setDoc(doc(d, 'users', ALICE), profile(ALICE));
    await setDoc(doc(d, 'users', BOB), profile(BOB));
    await setDoc(doc(d, 'users', ALICE, 'notes', 'note-1'), note(ALICE));
    await setDoc(doc(d, 'courses', 'draft-1'), course({ id: 'draft-1', slug: 'draft-course', status: 'draft' }));
    await setDoc(doc(d, 'courses', 'pub-1'), course({ id: 'pub-1' }));
  });
}

// ── Student data isolation ──────────────────────────────────────────────────

describe('student data is private to its owner', () => {
  it('blocks an unauthenticated reader', async () => {
    await seed();
    await assertFails(getDoc(doc(db(), 'users', ALICE)));
    await assertFails(getDoc(doc(db(), 'users', ALICE, 'notes', 'note-1')));
  });

  it('lets a student read their own profile and notes', async () => {
    await seed();
    await assertSucceeds(getDoc(doc(db(ALICE), 'users', ALICE)));
    await assertSucceeds(getDoc(doc(db(ALICE), 'users', ALICE, 'notes', 'note-1')));
  });

  it("blocks a student from reading another student's profile", async () => {
    await seed();
    await assertFails(getDoc(doc(db(BOB), 'users', ALICE)));
  });

  it("blocks a student from listing another student's notes", async () => {
    await seed();
    await assertFails(getDocs(collection(db(BOB), 'users', ALICE, 'notes')));
  });

  it("blocks a student from writing into another student's subtree", async () => {
    await seed();
    await assertFails(setDoc(doc(db(BOB), 'users', ALICE, 'notes', 'evil'), note(ALICE)));
    await assertFails(
      updateDoc(doc(db(BOB), 'users', ALICE, 'notes', 'note-1'), { title: 'changed' }),
    );
    await assertFails(deleteDoc(doc(db(BOB), 'users', ALICE, 'notes', 'note-1')));
  });
});

describe('profile validation', () => {
  it('accepts a well-formed profile for the owning uid', async () => {
    await seed();
    await assertSucceeds(setDoc(doc(db(ALICE), 'users', ALICE), profile(ALICE)));
  });

  it('rejects a uid that does not match the authenticated user', async () => {
    await seed();
    await assertFails(setDoc(doc(db(ALICE), 'users', BOB), profile(ALICE)));
  });

  it('rejects an over-long display name', async () => {
    await seed();
    await assertFails(
      setDoc(doc(db(ALICE), 'users', ALICE), profile(ALICE, { displayName: 'x'.repeat(81) })),
    );
  });

  it('rejects a profile missing the preferences map', async () => {
    await seed();
    const { preferences: _dropped, ...rest } = profile(ALICE);
    await assertFails(setDoc(doc(db(ALICE), 'users', ALICE), rest));
  });
});

describe('note ownership cannot be reassigned', () => {
  it('rejects creating a note owned by somebody else', async () => {
    await seed();
    await assertFails(setDoc(doc(db(ALICE), 'users', ALICE, 'notes', 'n2'), note(BOB)));
  });

  it('rejects changing ownerId on update', async () => {
    await seed();
    await assertFails(
      updateDoc(doc(db(ALICE), 'users', ALICE, 'notes', 'note-1'), { ownerId: BOB }),
    );
  });

  it('rejects an over-long note body', async () => {
    await seed();
    await assertFails(
      setDoc(doc(db(ALICE), 'users', ALICE, 'notes', 'n3'), note(ALICE, { content: 'x'.repeat(20001) })),
    );
  });

  it('rejects an unknown note source', async () => {
    await seed();
    await assertFails(
      setDoc(doc(db(ALICE), 'users', ALICE, 'notes', 'n4'), note(ALICE, { source: 'scraped' })),
    );
  });
});

describe('conversation messages', () => {
  const conversation = (ownerId: string) => ({
    id: 'conv-1',
    ownerId,
    title: 'Physics help',
    messageCount: 0,
    createdAt: '2026-10-23T00:00:00.000Z',
    updatedAt: '2026-10-23T00:00:00.000Z',
  });
  const message = (ownerId: string, overrides: Record<string, unknown> = {}) => ({
    id: 'm1',
    conversationId: 'conv-1',
    ownerId,
    role: 'user',
    content: 'Why is the sky blue?',
    mode: 'explain-simply',
    createdAt: '2026-10-23T00:00:00.000Z',
    ...overrides,
  });

  it('lets the owner create a conversation and message', async () => {
    await seed();
    const d = db(ALICE);
    await assertSucceeds(setDoc(doc(d, 'users', ALICE, 'conversations', 'conv-1'), conversation(ALICE)));
    await assertSucceeds(
      setDoc(doc(d, 'users', ALICE, 'conversations', 'conv-1', 'messages', 'm1'), message(ALICE)),
    );
  });

  it('rejects a message role other than user or assistant', async () => {
    await seed();
    const d = db(ALICE);
    await assertSucceeds(setDoc(doc(d, 'users', ALICE, 'conversations', 'conv-1'), conversation(ALICE)));
    await assertFails(
      setDoc(
        doc(d, 'users', ALICE, 'conversations', 'conv-1', 'messages', 'm2'),
        message(ALICE, { role: 'system' }),
      ),
    );
  });

  it('rejects a message filed under a different conversation id', async () => {
    await seed();
    const d = db(ALICE);
    await assertSucceeds(setDoc(doc(d, 'users', ALICE, 'conversations', 'conv-1'), conversation(ALICE)));
    await assertFails(
      setDoc(
        doc(d, 'users', ALICE, 'conversations', 'conv-1', 'messages', 'm3'),
        message(ALICE, { conversationId: 'conv-OTHER' }),
      ),
    );
  });
});

// ── Privilege escalation ────────────────────────────────────────────────────

describe('roles cannot be escalated', () => {
  it('rejects a student granting themselves a role', async () => {
    await seed();
    await assertFails(setDoc(doc(db(ALICE), 'roles', ALICE), { role: 'owner' }));
  });

  it('rejects a student overwriting an existing role', async () => {
    await seed();
    await assertFails(setDoc(doc(db(ALICE), 'roles', EDITOR), { role: 'owner' }));
  });

  it('lets a student read only their own role document', async () => {
    await seed();
    await assertSucceeds(getDoc(doc(db(EDITOR), 'roles', EDITOR)));
    await assertFails(getDoc(doc(db(ALICE), 'roles', EDITOR)));
  });

  it('rejects listing the roles collection for anyone but the owner', async () => {
    await seed();
    await assertFails(getDocs(collection(db(ADMIN), 'roles')));
    await assertSucceeds(getDocs(collection(db(OWNER), 'roles')));
  });

  it('denies content writes to a signed-in user with no role document', async () => {
    await seed();
    // No roles/{BOB} document exists; the get() fails closed rather than defaulting open.
    await assertFails(setDoc(doc(db(BOB), 'courses', 'new-1'), course({ id: 'new-1', slug: 'brand-new' })));
  });
});

// ── Library content ────────────────────────────────────────────────────────

describe('published library content is public, drafts are not', () => {
  it('lets an anonymous visitor read a published course', async () => {
    await seed();
    await assertSucceeds(getDoc(doc(db(), 'courses', 'pub-1')));
  });

  it('blocks an anonymous visitor from reading a draft course', async () => {
    await seed();
    await assertFails(getDoc(doc(db(), 'courses', 'draft-1')));
  });

  it('blocks a student from reading a draft course', async () => {
    await seed();
    await assertFails(getDoc(doc(db(ALICE), 'courses', 'draft-1')));
  });

  it('lets an editor read a draft course', async () => {
    await seed();
    await assertSucceeds(getDoc(doc(db(EDITOR), 'courses', 'draft-1')));
  });

  it('lets a visitor list published courses without exposing drafts', async () => {
    await seed();
    const snap = await assertSucceeds(
      getDocs(query(collection(db(), 'courses'), where('status', '==', 'published'))),
    );
    expect(snap.size).toBe(1);
    expect(snap.docs[0].id).toBe('pub-1');
  });

  it('rejects an unfiltered collection read for anonymous visitors', async () => {
    await seed();
    // Rules are not filters: without where('status','==','published') this fails.
    await assertFails(getDocs(collection(db(), 'courses')));
  });
});

describe('only editors may author content', () => {
  it('rejects a student creating a course', async () => {
    await seed();
    await assertFails(setDoc(doc(db(ALICE), 'courses', 'c2'), course({ id: 'c2', slug: 'my-course' })));
  });

  it('lets an editor create a valid published course', async () => {
    await seed();
    await assertSucceeds(setDoc(doc(db(EDITOR), 'courses', 'c3'), course({ id: 'c3', slug: 'my-course' })));
  });

  it.each([
    ['uppercase', 'My-Course'],
    ['spaces', 'my course'],
    ['trailing hyphen', 'my-course-'],
    ['too short', 'ab'],
    ['leading hyphen', '-my-course'],
    ['underscores', 'my_course'],
  ])('rejects an invalid slug (%s)', async (_label, slug) => {
    await seed();
    await assertFails(setDoc(doc(db(EDITOR), 'courses', 'c4'), course({ id: 'c4', slug })));
  });

  it('rejects a course with an out-of-range grade span', async () => {
    await seed();
    await assertFails(
      setDoc(doc(db(EDITOR), 'courses', 'c5'), course({ id: 'c5', slug: 'grade-span', gradeMin: 0 })),
    );
    await assertFails(
      setDoc(doc(db(EDITOR), 'courses', 'c6'), course({ id: 'c6', slug: 'grade-span-2', gradeMax: 13 })),
    );
  });

  it('rejects a course with too many lessons', async () => {
    await seed();
    await assertFails(
      setDoc(
        doc(db(EDITOR), 'courses', 'c7'),
        course({ id: 'c7', slug: 'too-many', lessons: Array.from({ length: 41 }, () => ({})) }),
      ),
    );
  });
});

describe('resources require attribution', () => {
  it('lets an editor publish a resource with a source and licence', async () => {
    await seed();
    await assertSucceeds(setDoc(doc(db(EDITOR), 'resources', 'r2'), resource({ id: 'r2' })));
  });

  it('rejects a resource with no source', async () => {
    await seed();
    await assertFails(setDoc(doc(db(EDITOR), 'resources', 'r3'), resource({ id: 'r3', source: '' })));
  });

  it('rejects a resource with no licence', async () => {
    await seed();
    await assertFails(setDoc(doc(db(EDITOR), 'resources', 'r4'), resource({ id: 'r4', license: '' })));
  });
});

describe('deletion is admin-only', () => {
  it('rejects an editor deleting a course', async () => {
    await seed();
    await assertFails(deleteDoc(doc(db(EDITOR), 'courses', 'pub-1')));
  });

  it('lets an admin delete a course', async () => {
    await seed();
    await assertSucceeds(deleteDoc(doc(db(ADMIN), 'courses', 'pub-1')));
  });

  it('rejects a student deleting a course', async () => {
    await seed();
    await assertFails(deleteDoc(doc(db(ALICE), 'courses', 'pub-1')));
  });
});

// ── SEO overrides, settings, audit log ─────────────────────────────────────

describe('SEO overrides', () => {
  const seo = (overrides: Record<string, unknown> = {}) => ({
    title: 'Custom title',
    description: 'Custom description',
    ogImage: '',
    noindex: false,
    ...overrides,
  });

  it('is publicly readable so crawlers see the same metadata', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'seoPages', '/courses'), seo());
    });
    await assertSucceeds(getDoc(doc(db(), 'seoPages', '/courses')));
  });

  it('rejects writes from a student', async () => {
    await seed();
    await assertFails(setDoc(doc(db(ALICE), 'seoPages', '/courses'), seo()));
  });

  it('lets an admin write an override', async () => {
    await seed();
    await assertSucceeds(setDoc(doc(db(ADMIN), 'seoPages', '/courses'), seo()));
  });

  it('rejects an over-long title', async () => {
    await seed();
    await assertFails(
      setDoc(doc(db(ADMIN), 'seoPages', '/courses'), seo({ title: 'x'.repeat(161) })),
    );
  });

  it('rejects an over-long description', async () => {
    await seed();
    await assertFails(
      setDoc(doc(db(ADMIN), 'seoPages', '/courses'), seo({ description: 'x'.repeat(321) })),
    );
  });

  it('rejects a non-boolean noindex', async () => {
    await seed();
    await assertFails(setDoc(doc(db(ADMIN), 'seoPages', '/courses'), seo({ noindex: 'yes' })));
  });
});

describe('site settings', () => {
  it('is publicly readable and admin-writable', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'settings', 'site'), { siteName: 'Ujyalo Learn' });
    });
    await assertSucceeds(getDoc(doc(db(), 'settings', 'site')));
    await seed();
    await assertFails(setDoc(doc(db(ALICE), 'settings', 'site'), { siteName: 'Hacked' }));
    await assertSucceeds(setDoc(doc(db(ADMIN), 'settings', 'site'), { siteName: 'Ujyalo Learn' }));
  });
});

describe('audit log is append-only', () => {
  const entry = (actorId: string, overrides: Record<string, unknown> = {}) => ({
    id: 'a1',
    actorId,
    actorEmail: `${actorId}@example.com`,
    action: 'course.publish',
    summary: 'Published SEE Mathematics',
    at: '2026-10-23T00:00:00.000Z',
    ...overrides,
  });

  it('rejects reads by a student', async () => {
    await seed();
    await assertFails(getDocs(collection(db(ALICE), 'auditLogs')));
  });

  it('lets an editor append an entry attributed to themselves', async () => {
    await seed();
    await assertSucceeds(setDoc(doc(db(EDITOR), 'auditLogs', 'a1'), entry(EDITOR)));
  });

  it('rejects an entry attributed to somebody else', async () => {
    await seed();
    await assertFails(setDoc(doc(db(EDITOR), 'auditLogs', 'a2'), entry(ADMIN)));
  });

  it('rejects editing or deleting an entry, even as the owner', async () => {
    await seed();
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'auditLogs', 'a3'), entry(OWNER));
    });
    await assertFails(updateDoc(doc(db(OWNER), 'auditLogs', 'a3'), { summary: 'rewritten' }));
    await assertFails(deleteDoc(doc(db(OWNER), 'auditLogs', 'a3')));
  });

  it('lets an admin read the log', async () => {
    await seed();
    await assertSucceeds(getDocs(collection(db(ADMIN), 'auditLogs')));
  });
});

// ── Default deny ───────────────────────────────────────────────────────────

describe('anything not explicitly allowed is denied', () => {
  it('rejects reads and writes to an unknown collection', async () => {
    await seed();
    await assertFails(getDoc(doc(db(), 'payments', 'p1')));
    await assertFails(setDoc(doc(db(ALICE), 'payments', 'p1'), { amount: 1 }));
    await assertFails(setDoc(doc(db(OWNER), 'cheats', 'c1'), { answer: 'x' }));
  });

  it('rejects an unknown subcollection under a user', async () => {
    await seed();
    await assertFails(setDoc(doc(db(ALICE), 'users', ALICE, 'secrets', 's1'), { x: 1 }));
  });
});


// ── The shipped library must pass its own rules ────────────────────────────

describe('the starter content in shared/content-seed.json satisfies the rules', () => {
  const seedData = JSON.parse(
    readFileSync(path.resolve(process.cwd(), 'shared/content-seed.json'), 'utf8'),
  ) as {
    courses: Array<Record<string, unknown> & { id: string; status: string }>;
    resources: Array<Record<string, unknown> & { id: string; status: string }>;
  };

  it.each(seedData.courses.map((c) => [c.id, c] as const))(
    'editor can write course %s through the rules',
    async (_id, record) => {
      await seed();
      // If a seeded record violated validCourse(), an admin saving it from the
      // panel would fail — and nobody would find out until they tried.
      await assertSucceeds(setDoc(doc(db(EDITOR), 'courses', String(record.id)), record));
    },
  );

  it.each(seedData.resources.map((r) => [r.id, r] as const))(
    'editor can write resource %s through the rules',
    async (_id, record) => {
      await seed();
      await assertSucceeds(setDoc(doc(db(EDITOR), 'resources', String(record.id)), record));
    },
  );

  it('publishes exactly the courses and resources the site advertises', async () => {
    const publishedCourses = seedData.courses.filter((c) => c.status === 'published');
    const publishedResources = seedData.resources.filter((r) => r.status === 'published');
    // The build's sitemap and llms.txt are generated from these counts.
    expect(publishedCourses).toHaveLength(7);
    expect(publishedResources).toHaveLength(6);
  });

  it('lets an anonymous visitor read every published seeded record', async () => {
    await seed();
    for (const course of seedData.courses.filter((c) => c.status === 'published')) {
      await assertSucceeds(setDoc(doc(db(EDITOR), 'courses', String(course.id)), course));
      await assertSucceeds(getDoc(doc(db(), 'courses', String(course.id))));
    }
    for (const resource of seedData.resources.filter((r) => r.status === 'published')) {
      await assertSucceeds(setDoc(doc(db(EDITOR), 'resources', String(resource.id)), resource));
      await assertSucceeds(getDoc(doc(db(), 'resources', String(resource.id))));
    }
  });
});
