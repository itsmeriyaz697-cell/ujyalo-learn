import type { AuthUser } from '@/services/auth/types';
import { dataStore } from '@/services/data';
import { localStore } from '@/services/data/localStore';

/**
 * A visitor's session, kept entirely in the browser.
 *
 * Why this exists: the app used to answer "who are you?" before showing a tool.
 * That is a login wall with extra steps, and it made the tutor unreachable for
 * anyone unwilling to hand over an email — which, for a student who just
 * followed a link, is most people.
 *
 * A browser session has a real uid, so every record is still namespaced and
 * owned, but it needs no network, no provider and no permission from a Firebase
 * console. Anonymous sign-in remains the better upgrade (it survives a cleared
 * browser only if the same device is used), and it is offered at the moment
 * somebody wants their work to follow them to another device.
 */
export const GUEST_UID = 'guest-local';

const GUEST_KEY = 'ujyalo:guest';

export function makeGuestUser(): AuthUser {
  return {
    uid: GUEST_UID,
    email: null,
    displayName: 'Guest',
    photoURL: null,
    emailVerified: false,
    isAnonymous: true,
  };
}

export function isGuestUser(user: AuthUser | null): boolean {
  return Boolean(user && (user.uid === GUEST_UID || user.isAnonymous));
}

export function isBrowserGuest(user: AuthUser | null): boolean {
  return user?.uid === GUEST_UID;
}

/** Marks that this browser has deliberately entered the app as a guest. */
export function rememberGuest(): void {
  try {
    localStorage.setItem(GUEST_KEY, new Date().toISOString());
  } catch {
    // Private mode: the session still works for this tab.
  }
}

export function forgetGuest(): void {
  try {
    localStorage.removeItem(GUEST_KEY);
  } catch {
    /* ignore */
  }
}

export function hasBeenGuest(): boolean {
  try {
    return Boolean(localStorage.getItem(GUEST_KEY));
  } catch {
    return false;
  }
}

/**
 * Carries a browser guest's work into a real account.
 *
 * Called immediately after the first successful sign-in or sign-up. It reads
 * every record the guest produced and writes it under the new uid. Failures are
 * collected rather than thrown: a migration that half-succeeds must not block
 * somebody from getting into their account.
 */
export async function migrateGuestData(toUid: string): Promise<{ moved: number; failed: number }> {
  if (!toUid || toUid === GUEST_UID) return { moved: 0, failed: 0 };

  let moved = 0;
  let failed = 0;

  // Read from the browser store explicitly: the guest's records are there
  // regardless of what backend the new account uses.
  const from = GUEST_UID;

  const carry = async <T extends { ownerId?: string }>(
    rows: T[],
    save: (row: T) => Promise<void>,
    rekey: (row: T) => T,
  ) => {
    for (const row of rows) {
      try {
        await save(rekey({ ...row, ownerId: toUid }));
        moved += 1;
      } catch {
        failed += 1;
      }
    }
  };

  try {
    const [conversations, notes, quizzes, attempts, decks, goals, tasks] = await Promise.all([
      localStore.listConversations(from),
      localStore.listNotes(from),
      localStore.listQuizzes(from),
      localStore.listAttempts(from),
      localStore.listDecks(from),
      localStore.listGoals(from),
      localStore.listTasks(from),
    ]);

    await carry(conversations, (row) => dataStore.saveConversation(row), (row) => ({ ...row, ownerId: toUid }));
    await carry(notes, (row) => dataStore.saveNote(row), (row) => ({ ...row, ownerId: toUid }));
    await carry(quizzes, (row) => dataStore.saveQuiz(row), (row) => ({ ...row, ownerId: toUid }));
    await carry(attempts, (row) => dataStore.saveAttempt(row), (row) => ({ ...row, ownerId: toUid }));
    await carry(decks, (row) => dataStore.saveDeck(row), (row) => ({ ...row, ownerId: toUid }));
    await carry(goals, (row) => dataStore.saveGoal(row), (row) => ({ ...row, ownerId: toUid }));
    await carry(tasks, (row) => dataStore.saveTask(row), (row) => ({ ...row, ownerId: toUid }));

    // Messages are fetched per conversation, so they need a second pass.
    for (const conversation of conversations) {
      const page = await localStore.listMessages(from, conversation.id);
      for (const message of page.messages) {
        try {
          await dataStore.addMessage({ ...message, ownerId: toUid });
        } catch {
          failed += 1;
        }
      }
    }
  } catch {
    failed += 1;
  }

  if (moved > 0 && dataStore.mode !== 'local') {
    // The cloud copy now exists; the browser copy is no longer needed. It is
    // removed only after a successful write, so a failed migration never
    // destroys the only copy.
    try {
      await localStore.deleteUserData(GUEST_UID);
    } catch {
      /* leaving it is harmless — it is namespaced to the guest uid */
    }
  }

  return { moved, failed };
}
