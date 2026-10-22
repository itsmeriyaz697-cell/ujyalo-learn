export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  emailVerified: boolean;
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
