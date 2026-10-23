import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Guest accounts are the one account type where losing the session loses the
 * work, so the storage-level guarantees matter more than the UI:
 *   - a guest exists without an email,
 *   - upgrading reuses the same uid (nothing is orphaned),
 *   - the upgraded account can be logged into with the new password,
 *   - an email clash is refused instead of silently overwriting.
 */

const stored = new Map<string, string>();

vi.stubGlobal('localStorage', {
  getItem: (key: string) => stored.get(key) ?? null,
  setItem: (key: string, value: string) => void stored.set(key, value),
  removeItem: (key: string) => void stored.delete(key),
  clear: () => stored.clear(),
  key: (index: number) => [...stored.keys()][index] ?? null,
  get length() {
    return stored.size;
  },
});

// The service announces changes on window; jsdom is not in play here.
vi.stubGlobal('window', {
  dispatchEvent: () => true,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
});

type LocalAuth = typeof import('@/services/auth/localAuth');

async function freshLocalAuth(): Promise<LocalAuth['localAuthService']> {
  stored.clear();
  vi.resetModules();
  const module = await import('@/services/auth/localAuth');
  return module.localAuthService;
}

describe('guest accounts (local mode mirrors the Firebase behaviour)', () => {
  beforeEach(() => {
    stored.clear();
  });

  it('creates a usable account with no email', async () => {
    const auth = await freshLocalAuth();
    const guest = await auth.signInAsGuest();

    expect(guest.email).toBeNull();
    expect(guest.isAnonymous).toBe(true);
    expect(guest.uid).toMatch(/^guest_/);
    // The session is real, not an in-memory placeholder.
    expect(auth.getCurrentUser()).toMatchObject({ uid: guest.uid });
  });

  it('keeps the uid and the display name when the guest is upgraded', async () => {
    const auth = await freshLocalAuth();
    const guest = await auth.signInAsGuest();
    const upgraded = await auth.upgradeGuest('learner@example.test', 'StudyHard123', 'Sita R.');

    expect(upgraded.uid).toBe(guest.uid);
    expect(upgraded.email).toBe('learner@example.test');
    expect(upgraded.displayName).toBe('Sita R.');
    expect(upgraded.isAnonymous).toBe(false);
  });

  it('lets the upgraded account log in again with the new password', async () => {
    const auth = await freshLocalAuth();
    await auth.signInAsGuest();
    await auth.upgradeGuest('returning@example.test', 'StudyHard123', 'Returning Learner');
    await auth.signOut();

    const signedIn = await auth.signIn('returning@example.test', 'StudyHard123');
    expect(signedIn.email).toBe('returning@example.test');
    expect(signedIn.isAnonymous).toBe(false);

    await expect(auth.signIn('returning@example.test', 'WrongPassword1')).rejects.toMatchObject({
      code: 'auth/invalid-credential',
    });
  });

  it('refuses an email that already belongs to someone else', async () => {
    const auth = await freshLocalAuth();
    await auth.signUp('taken@example.test', 'StudyHard123', 'First Owner');
    await auth.signOut();

    await auth.signInAsGuest();
    await expect(auth.upgradeGuest('taken@example.test', 'StudyHard123', 'Guest')).rejects.toMatchObject({
      code: 'auth/email-already-in-use',
    });
  });

  it('refuses to upgrade when there is no guest session', async () => {
    const auth = await freshLocalAuth();
    await expect(auth.upgradeGuest('nobody@example.test', 'StudyHard123', 'Nobody')).rejects.toMatchObject({
      code: 'auth/user-not-found',
    });
  });
});
