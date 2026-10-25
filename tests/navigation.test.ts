import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Navigation must not depend on an account.
 *
 * These tests cover the parts of that promise that are testable without a
 * browser: the browser session exists without any network, it has a stable
 * identity so records stay owned, and work done before sign-up moves into the
 * new account instead of being stranded.
 */

const stored = new Map<string, string>();

vi.stubGlobal('localStorage', {
  getItem: (key: string) => stored.get(key) ?? null,
  setItem: (key: string, value: string) => void stored.set(key, value),
  removeItem: (key: string) => void stored.delete(key),
  clear: () => stored.clear(),
  key: (index: number) => Array.from(stored.keys())[index] ?? null,
  get length() {
    return stored.size;
  },
});

const { GUEST_UID, makeGuestUser, isBrowserGuest, isGuestUser, migrateGuestData, rememberGuest, forgetGuest } =
  await import('@/features/auth/guestSession');
const { localStore } = await import('@/services/data/localStore');
const { dataStore, activateLocalStore, storageModeText } = await import('@/services/data');

beforeEach(() => {
  stored.clear();
  activateLocalStore();
});

describe('browser guest session', () => {
  it('is a session with no email, no network and a stable uid', () => {
    const user = makeGuestUser();
    expect(user.uid).toBe(GUEST_UID);
    expect(user.email).toBeNull();
    expect(user.isAnonymous).toBe(true);
    expect(makeGuestUser().uid).toBe(user.uid);
  });

  it('is recognised as a guest, and never as a signed-in account', () => {
    expect(isBrowserGuest(makeGuestUser())).toBe(true);
    expect(isGuestUser(makeGuestUser())).toBe(true);
    expect(isBrowserGuest(null)).toBe(false);
    // A real account must not be mistaken for the browser session, or signing
    // in would be treated as a temporary state and its data treated as local.
    expect(isBrowserGuest({ uid: 'abc123', email: 'a@b.c', displayName: 'A', emailVerified: true })).toBe(false);
  });

  it('remembers and forgets the browser marker', () => {
    expect(localStorage.getItem('ujyalo:guest')).toBeNull();
    rememberGuest();
    expect(localStorage.getItem('ujyalo:guest')).not.toBeNull();
    forgetGuest();
    expect(localStorage.getItem('ujyalo:guest')).toBeNull();
  });

  it('still works when storage is unavailable (private mode)', () => {
    const throwing = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {
        throw new Error('denied');
      },
    };
    vi.stubGlobal('localStorage', throwing);
    expect(() => rememberGuest()).not.toThrow();
    expect(() => forgetGuest()).not.toThrow();
    // Restore for the following tests.
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => void stored.set(key, value),
      removeItem: (key: string) => void stored.delete(key),
      clear: () => stored.clear(),
      key: (index: number) => Array.from(stored.keys())[index] ?? null,
      get length() {
        return stored.size;
      },
    });
  });
});

describe('storage backend', () => {
  it('reports browser storage honestly', () => {
    activateLocalStore();
    expect(dataStore.mode).toBe('local');
    expect(storageModeText()).toMatch(/browser/i);
    expect(storageModeText()).not.toMatch(/synced/i);
  });
});

describe('carrying guest work into an account', () => {
  it('moves conversations and notes to the new uid', async () => {
    const now = new Date().toISOString();
    await localStore.saveConversation({
      id: 'conv-1',
      ownerId: GUEST_UID,
      title: 'Photosynthesis',
      subjectId: 'science',
      mode: 'explain',
      preview: 'Why do plants need light?',
      messageCount: 2,
      createdAt: now,
      updatedAt: now,
    });
    await localStore.saveNote({
      id: 'note-1',
      ownerId: GUEST_UID,
      subjectId: 'science',
      title: 'Light reactions',
      content: 'Happens in the thylakoid membrane.',
      topic: 'photosynthesis',
      source: 'student',
      favorite: false,
      tags: [],
      createdAt: now,
      updatedAt: now,
    });

    const result = await migrateGuestData('real-uid');
    expect(result.failed).toBe(0);
    expect(result.moved).toBe(2);

    const conversations = await dataStore.listConversations('real-uid');
    const notes = await dataStore.listNotes('real-uid');
    expect(conversations.map((row) => row.id)).toContain('conv-1');
    expect(notes.map((row) => row.id)).toContain('note-1');
    // Ownership is rewritten, not copied blindly.
    expect(conversations[0].ownerId).toBe('real-uid');
    expect(notes[0].ownerId).toBe('real-uid');
  });

  it('does nothing when there is nothing to move', async () => {
    const result = await migrateGuestData('empty-uid');
    expect(result).toEqual({ moved: 0, failed: 0 });
  });

  it('refuses to migrate onto the guest uid itself', async () => {
    const result = await migrateGuestData(GUEST_UID);
    expect(result).toEqual({ moved: 0, failed: 0 });
  });

  it('keeps the guest copy when the destination is browser storage', async () => {
    const now = new Date().toISOString();
    await localStore.saveNote({
      id: 'note-keep',
      ownerId: GUEST_UID,
      subjectId: 'science',
      title: 'Kept',
      content: 'Still here.',
      topic: 'revision',
      source: 'student',
      favorite: false,
      tags: [],
      createdAt: now,
      updatedAt: now,
    });
    await migrateGuestData('local-account');

    // Local destination: both copies exist, and the guest can carry on.
    expect((await localStore.listNotes('local-account')).map((n) => n.id)).toContain('note-keep');
    expect((await localStore.listNotes(GUEST_UID)).map((n) => n.id)).toContain('note-keep');
  });
});
