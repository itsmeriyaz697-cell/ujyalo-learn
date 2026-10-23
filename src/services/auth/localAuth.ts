/**
 * Local demo authentication.
 *
 * This exists ONLY so the application is explorable before Firebase is
 * configured. It is not secure and is clearly labelled in the UI:
 * accounts and data stay in this browser and are never uploaded.
 * It is never used when Firebase credentials are present.
 */
import type { AuthService, AuthUser } from './types';
import { makeId, safeJsonParse } from '@/lib/utils';

const USERS_KEY = 'ujyalo:local:users';
const SESSION_KEY = 'ujyalo:local:session';
const AUTH_EVENT = 'ujyalo:auth-changed';

interface LocalAccount {
  uid: string;
  email: string | null;
  displayName: string;
  passwordHash: string;
  createdAt: string;
}

const hash = async (value: string): Promise<string> => {
  const data = new TextEncoder().encode(value);
  if (crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Extremely defensive fallback for non-secure contexts. Still not secure.
  let h = 0;
  for (const byte of data) h = (h * 31 + byte) | 0;
  return String(h);
};

const readUsers = (): LocalAccount[] => safeJsonParse<LocalAccount[]>(localStorage.getItem(USERS_KEY), []);
const writeUsers = (users: LocalAccount[]) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

const toAuthUser = (account: LocalAccount | null): AuthUser | null =>
  account
    ? {
        uid: account.uid,
        email: account.email,
        displayName: account.displayName,
        photoURL: null,
        // Local accounts cannot verify email. Never pretend otherwise.
        emailVerified: false,
        // A local account with no email is a guest; say so explicitly so the
        // UI never has to infer it from a null email.
        isAnonymous: !account.email,
      }
    : null;

function emit() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

function readSession(): LocalAccount | null {
  const uid = localStorage.getItem(SESSION_KEY);
  if (!uid) return null;
  return readUsers().find((u) => u.uid === uid) ?? null;
}

export const localAuthService: AuthService = {
  mode: 'local',

  onChange(callback) {
    const handle = () => callback(toAuthUser(readSession()));
    // Defer initial callback so subscribers have mounted.
    queueMicrotask(handle);
    window.addEventListener(AUTH_EVENT, handle);
    window.addEventListener('storage', handle);
    return () => {
      window.removeEventListener(AUTH_EVENT, handle);
      window.removeEventListener('storage', handle);
    };
  },

  getCurrentUser() {
    return toAuthUser(readSession());
  },

  async reloadUser() {
    // Local demo accounts have no email provider; they are always "verified".
    return toAuthUser(readSession());
  },

  async signUp(email, password, displayName) {
    const users = readUsers();
    const normalized = email.trim().toLowerCase();
    if (users.some((u) => u.email === normalized)) {
      const error = new Error('An account with this email already exists.');
      (error as Error & { code?: string }).code = 'auth/email-already-in-use';
      throw error;
    }
    if (password.length < 6) {
      const error = new Error('Password too short.');
      (error as Error & { code?: string }).code = 'auth/weak-password';
      throw error;
    }
    const account: LocalAccount = {
      uid: makeId('local'),
      email: normalized,
      displayName: displayName.trim() || 'Student',
      passwordHash: await hash(password),
      createdAt: new Date().toISOString(),
    };
    writeUsers([...users, account]);
    localStorage.setItem(SESSION_KEY, account.uid);
    emit();
    return toAuthUser(account)!;
  },

  async signIn(email, password) {
    const normalized = email.trim().toLowerCase();
    const account = readUsers().find((u) => u.email === normalized);
    if (!account) {
      const error = new Error('Account not found.');
      (error as Error & { code?: string }).code = 'auth/user-not-found';
      throw error;
    }
    const passwordHash = await hash(password);
    if (passwordHash !== account.passwordHash) {
      const error = new Error('Incorrect password.');
      (error as Error & { code?: string }).code = 'auth/invalid-credential';
      throw error;
    }
    localStorage.setItem(SESSION_KEY, account.uid);
    emit();
    return toAuthUser(account)!;
  },

  async signInWithGoogle() {
    const error = new Error('Google sign-in requires Firebase configuration.');
    (error as Error & { code?: string }).code = 'auth/operation-not-allowed';
    throw error;
  },

  async signInAsGuest() {
    // Local demo mode: an account with no email, kept in this browser only.
    const account: LocalAccount = {
      uid: makeId('guest'),
      email: null,
      displayName: 'Guest',
      passwordHash: '',
      createdAt: new Date().toISOString(),
    };
    writeUsers([...readUsers(), account]);
    localStorage.setItem(SESSION_KEY, account.uid);
    emit();
    return { uid: account.uid, email: null, displayName: 'Guest', emailVerified: false, isAnonymous: true };
  },

  async upgradeGuest(email: string, password: string, displayName: string) {
    const uid = localStorage.getItem(SESSION_KEY);
    const users = readUsers();
    const account = users.find((item) => item.uid === uid);
    if (!account) {
      const error = new Error('No guest session to upgrade.');
      (error as Error & { code?: string }).code = 'auth/user-not-found';
      throw error;
    }
    if (users.some((item) => item.email?.toLowerCase() === email.toLowerCase())) {
      const error = new Error('An account with this email already exists.');
      (error as Error & { code?: string }).code = 'auth/email-already-in-use';
      throw error;
    }
    account.email = email;
    account.displayName = displayName;
    account.passwordHash = await hash(password);
    writeUsers(users);
    emit();
    return { uid: account.uid, email, displayName, emailVerified: false, isAnonymous: false };
  },

  async signOut() {
    localStorage.removeItem(SESSION_KEY);
    emit();
  },

  async resetPassword() {
    throw new Error(
      'Password reset needs Firebase email delivery. In local demo mode, create a new local account instead.',
    );
  },

  async sendVerificationEmail() {
    throw new Error('Email verification needs Firebase configuration.');
  },

  async deleteAccount() {
    const session = readSession();
    if (!session) return;
    writeUsers(readUsers().filter((u) => u.uid !== session.uid));
    localStorage.removeItem(SESSION_KEY);
    // Remove every piece of local data owned by the account.
    Object.keys(localStorage)
      .filter((key) => key.startsWith(`ujyalo:data:${session.uid}:`))
      .forEach((key) => localStorage.removeItem(key));
    emit();
  },

  async getIdToken() {
    return null;
  },

  async updateDisplayName(name) {
    const session = readSession();
    if (!session) return;
    writeUsers(readUsers().map((u) => (u.uid === session.uid ? { ...u, displayName: name } : u)));
    emit();
  },
};

/** Exposed for the setup screen so demo mode can be explained accurately. */
export const localDemoInfo = {
  isAvailable: true,
  warning:
    'Demo mode stores accounts and learning data only in this browser. It is not secure, is not synced, and disappears if you clear browser data.',
};
