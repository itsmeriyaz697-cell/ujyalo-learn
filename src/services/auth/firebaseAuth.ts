import type { AuthUser, AuthService } from './types';
import { getFirebaseAuth } from '@/services/firebase/client';
import { assertDatabaseReady } from '@/services/firebase/preflight';

function toUser(user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null; emailVerified: boolean }): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
  };
}

export const firebaseAuthService: AuthService = {
  mode: 'firebase',

  onChange(callback) {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    getFirebaseAuth()
      .then(async (auth) => {
        const { onAuthStateChanged } = await import('firebase/auth');
        if (cancelled) return;
        unsubscribe = onAuthStateChanged(auth, (user) => callback(user ? toUser(user) : null));
      })
      .catch(() => callback(null));
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  },

  getCurrentUser() {
    // Firebase restores sessions asynchronously; consumers use onChange.
    return null;
  },

  async signUp(email, password, displayName) {
    // Before consuming the email address: if Firestore is still locked, every
    // later step fails and the student is left with an account they cannot use.
    await assertDatabaseReady();
    const auth = await getFirebaseAuth();
    const { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } = await import('firebase/auth');
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });
    try {
      await sendEmailVerification(credential.user);
    } catch {
      // Verification email is best-effort; the account is still usable.
    }
    return toUser(credential.user);
  },

  async signIn(email, password) {
    const auth = await getFirebaseAuth();
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return toUser(credential.user);
  },

  async signInWithGoogle() {
    // A first-time Google sign-in also creates an account, so the same guard applies.
    await assertDatabaseReady();
    const auth = await getFirebaseAuth();
    const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const credential = await signInWithPopup(auth, provider);
    return toUser(credential.user);
  },

  async signOut() {
    const auth = await getFirebaseAuth();
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
  },

  async resetPassword(email) {
    const auth = await getFirebaseAuth();
    const { sendPasswordResetEmail } = await import('firebase/auth');
    await sendPasswordResetEmail(auth, email);
  },

  async sendVerificationEmail() {
    const auth = await getFirebaseAuth();
    const { sendEmailVerification } = await import('firebase/auth');
    if (!auth.currentUser) throw new Error('Not signed in.');
    await sendEmailVerification(auth.currentUser);
  },

  async deleteAccount() {
    const auth = await getFirebaseAuth();
    if (!auth.currentUser) throw new Error('Not signed in.');
    await auth.currentUser.delete();
  },

  async getIdToken() {
    const auth = await getFirebaseAuth();
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  },

  async reloadUser() {
    const auth = await getFirebaseAuth();
    if (!auth.currentUser) return null;
    await auth.currentUser.reload();
    return toUser(auth.currentUser);
  },

  async updateDisplayName(name) {
    const auth = await getFirebaseAuth();
    const { updateProfile } = await import('firebase/auth');
    if (!auth.currentUser) throw new Error('Not signed in.');
    await updateProfile(auth.currentUser, { displayName: name });
  },
};
