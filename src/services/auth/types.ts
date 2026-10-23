export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  emailVerified: boolean;
  /** Anonymous account: usable immediately, but only recoverable in this browser. */
  isAnonymous?: boolean;
}

export type AuthMode = 'firebase' | 'local';

export interface AuthService {
  mode: AuthMode;
  /** Subscribes to auth state. Returns unsubscribe. */
  onChange(callback: (user: AuthUser | null) => void): () => void;
  getCurrentUser(): AuthUser | null;
  signUp(email: string, password: string, displayName: string): Promise<AuthUser>;
  signIn(email: string, password: string): Promise<AuthUser>;
  signInWithGoogle(): Promise<AuthUser>;
  /**
   * Starts a session without an email or password. The account is real (the
   * database rules treat it as an owner of its own data) but unrecoverable if
   * the browser's storage is cleared, so the UI must say so.
   */
  signInAsGuest(): Promise<AuthUser>;
  /** Adds an email and password to a guest account, keeping its uid and data. */
  upgradeGuest(email: string, password: string, displayName: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  sendVerificationEmail(): Promise<void>;
  /** Deletes the auth account. The caller must delete data first. */
  deleteAccount(): Promise<void>;
  getIdToken(): Promise<string | null>;
  /** Re-reads the cached account record (used to detect a verified email). */
  reloadUser(): Promise<AuthUser | null>;
  updateDisplayName(name: string): Promise<void>;
}
