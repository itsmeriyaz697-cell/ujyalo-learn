import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AuthUser, AuthService } from '@/services/auth/types';
import { firebaseAuthService } from '@/services/auth/firebaseAuth';
import { localAuthService } from '@/services/auth/localAuth';
import { isFirebaseConfigured, missingFirebaseKeys } from '@/services/firebase/client';
import { dataStore, activateCloudStore, activateLocalStore } from '@/services/data';
import {
  forgetGuest,
  hasBeenGuest,
  isBrowserGuest,
  makeGuestUser,
  migrateGuestData,
  rememberGuest,
} from './guestSession';
import { registerTokenProvider } from '@/services/ai/client';
import { registerEverestTokenProvider } from '@/services/ai/everestClient';
import { friendlyAuthError } from '@/lib/errors';
import type { StudentPreferences, StudentProfile } from '@/types/domain';

export const defaultPreferences: StudentPreferences = {
  grade: '10',
  curriculum: 'nepal-national',
  language: 'en',
  subjects: [],
  goals: [],
  explanationStyle: 'simple',
  dailyMinutes: 30,
  country: 'NP',
};

export const authService: AuthService = isFirebaseConfigured ? firebaseAuthService : localAuthService;

interface AuthContextValue {
  user: AuthUser | null;
  profile: StudentProfile | null;
  loading: boolean;
  profileLoading: boolean;
  mode: 'firebase' | 'local';
  firebaseConfigured: boolean;
  missingFirebaseKeys: string[];
  signUp: (email: string, password: string, name: string) => Promise<AuthUser>;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signInWithGoogle: () => Promise<AuthUser>;
  signInAsGuest: () => Promise<AuthUser>;
  upgradeGuest: (email: string, password: string, name: string) => Promise<AuthUser>;
  /** True when the signed-in account is anonymous. */
  isGuest: boolean;
  /** True when the session exists only in this browser and was never a real account. */
  isBrowserGuest: boolean;
  /**
   * Starts the browser-only session. No network, no form, no provider — this is
   * what makes every tool reachable on first click.
   */
  startBrowserGuest: () => void;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  savePreferences: (preferences: StudentPreferences, displayName?: string) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  reloadUser: () => Promise<AuthUser | null>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // Which user's profile has finished loading. Deriving "loading" from this
  // avoids a render where the user exists but their profile has not been
  // fetched yet — that gap used to bounce deep links to /onboarding.
  const [profileLoadedFor, setProfileLoadedFor] = useState<string | null>(null);
  const profileRequest = useRef(0);
  const profileLoading = user !== null && profileLoadedFor !== user.uid;

  useEffect(() => {
    const provider = { getIdToken: () => authService.getIdToken() };
    registerTokenProvider(provider);
    registerEverestTokenProvider(provider);
    return () => {
      registerTokenProvider(null);
      registerEverestTokenProvider(null);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = authService.onChange((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loadProfile = useCallback(async (uid: string) => {
    const requestId = profileRequest.current + 1;
    profileRequest.current = requestId;
    try {
      const loaded = await dataStore.getProfile(uid);
      if (profileRequest.current === requestId) setProfile(loaded);
    } catch (error) {
      // A missing profile is normal for new accounts; other errors surface in the console
      // and in the UI as "profile not loaded" rather than blocking the whole app.
      console.error('[ujyalo] Could not load profile:', (error as Error).message);
      if (profileRequest.current === requestId) setProfile(null);
    } finally {
      if (profileRequest.current === requestId) setProfileLoadedFor(uid);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileLoadedFor(null);
      return;
    }
    void loadProfile(user.uid);
  }, [user, loadProfile]);

  /**
   * Browser-only session, created on demand and never at page load.
   *
   * Public marketing pages must not silently mint a session — a reader who
   * never touches the app should stay a reader. The app routes call this the
   * first time somebody opens a tool.
   */
  const startBrowserGuest = useCallback(() => {
    activateLocalStore();
    rememberGuest();
    setUser(makeGuestUser());
    setLoading(false);
  }, []);

  /** After a real sign-in, move whatever the browser guest produced. */
  /**
   * Whether work may be sitting in the browser store.
   *
   * Reading React state alone is not enough: a full page load (a refresh, or
   * arriving on /signup from a link) resets the provider, so `user` is null
   * while the guest's notes are still on disk. The stored marker survives,
   * which is why it is the marker — not the in-memory user — that decides.
   */
  const wasGuestSomewhere = useCallback(() => isBrowserGuest(user) || hasBeenGuest(), [user]);

  const carryGuestWork = useCallback(async (uid: string, wasGuest: boolean) => {
    if (wasGuest) {
      // Switch to the destination backend BEFORE migrating: while the guest
      // session was active the app was pointed at the browser store, so
      // migrating first would copy the work back into the same browser.
      activateCloudStore();
      const result = await migrateGuestData(uid);
      if (result.moved > 0) {
        // Surface the outcome once, so nobody wonders where their notes went.
        try {
          sessionStorage.setItem('ujyalo:migrated', String(result.moved));
        } catch {
          /* ignore */
        }
      }
    }
    forgetGuest();
    activateCloudStore();
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      const wasGuest = wasGuestSomewhere();
      try {
        const created = await authService.signUp(email, password, name);
        await carryGuestWork(created.uid, wasGuest);
        return created;
      } catch (error) {
        throw new Error(friendlyAuthError(error), { cause: error });
      }
    },
    [carryGuestWork, wasGuestSomewhere],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const wasGuest = wasGuestSomewhere();
      try {
        const signedIn = await authService.signIn(email, password);
        await carryGuestWork(signedIn.uid, wasGuest);
        return signedIn;
      } catch (error) {
        throw new Error(friendlyAuthError(error), { cause: error });
      }
    },
    [carryGuestWork, wasGuestSomewhere],
  );

  const signInWithGoogle = useCallback(async () => {
    const wasGuest = wasGuestSomewhere();
    try {
      const signedIn = await authService.signInWithGoogle();
      await carryGuestWork(signedIn.uid, wasGuest);
      return signedIn;
    } catch (error) {
      throw new Error(friendlyAuthError(error), { cause: error });
    }
  }, [carryGuestWork, wasGuestSomewhere]);

  const signInAsGuest = useCallback(async () => {
    const wasGuest = wasGuestSomewhere();
    try {
      const created = await authService.signInAsGuest();
      await carryGuestWork(created.uid, wasGuest);
      return created;
    } catch (error) {
      throw new Error(friendlyAuthError(error), { cause: error });
    }
  }, [carryGuestWork, wasGuestSomewhere]);

  const upgradeGuest = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        // Linking keeps the uid, so every note and quiz already taken as a guest
        // stays attached to the account instead of being orphaned.
        const upgraded = await authService.upgradeGuest(email, password, name);
        // Linking does not always emit onAuthStateChanged, so the in-memory user
        // would keep isAnonymous = true and the banner would stay on screen.
        // The linked user is returned directly, so trust it instead of waiting.
        setUser(upgraded);
        await loadProfile(upgraded.uid);
        return upgraded;
      } catch (error) {
        throw new Error(friendlyAuthError(error), { cause: error });
      }
    },
    [loadProfile],
  );

  const signOut = useCallback(async () => {
    // A browser guest has no account to sign out of. Dropping the session
    // returns the site to its public state, and the work stays on the device
    // under the guest uid so reopening a tool brings it back.
    if (isBrowserGuest(user)) {
      activateCloudStore();
      setUser(null);
      setProfile(null);
      return;
    }
    await authService.signOut();
    setProfile(null);
  }, [user]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await authService.resetPassword(email);
    } catch (error) {
      throw new Error(friendlyAuthError(error), { cause: error });
    }
  }, []);

  const sendVerificationEmail = useCallback(async () => {
    try {
      await authService.sendVerificationEmail();
    } catch (error) {
      throw new Error(friendlyAuthError(error), { cause: error });
    }
  }, []);

  const savePreferences = useCallback(
    async (preferences: StudentPreferences, displayName?: string) => {
      if (!user) throw new Error('You need to be signed in to save preferences.');
      const now = new Date().toISOString();
      const existing = profile;
      const next: StudentProfile = {
        uid: user.uid,
        displayName: displayName ?? existing?.displayName ?? user.displayName ?? 'Student',
        email: user.email ?? existing?.email ?? '',
        photoURL: user.photoURL ?? existing?.photoURL ?? null,
        preferences,
        onboardingComplete: true,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      await dataStore.saveProfile(next);
      setProfile(next);
    },
    [profile, user],
  );

  const updateDisplayName = useCallback(
    async (name: string) => {
      if (!user) throw new Error('You need to be signed in.');
      await authService.updateDisplayName(name);
      if (profile) {
        const next = { ...profile, displayName: name, updatedAt: new Date().toISOString() };
        await dataStore.saveProfile(next);
        setProfile(next);
      }
    },
    [profile, user],
  );

  const deleteAccount = useCallback(async () => {
    if (!user) throw new Error('You need to be signed in.');
    await dataStore.deleteUserData(user.uid);
    await authService.deleteAccount();
    setProfile(null);
  }, [user]);

  const getToken = useCallback(() => authService.getIdToken(), []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.uid);
  }, [loadProfile, user]);

  const reloadUser = useCallback(async () => {
    const fresh = await authService.reloadUser();
    if (fresh) setUser(fresh);
    return fresh;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      profileLoading,
      mode: authService.mode,
      firebaseConfigured: isFirebaseConfigured,
      missingFirebaseKeys: missingFirebaseKeys(),
      signUp,
      signIn,
      signInWithGoogle,
      signInAsGuest,
      upgradeGuest,
      isGuest: Boolean(user?.isAnonymous),
      isBrowserGuest: isBrowserGuest(user),
      startBrowserGuest,
      signOut,
      resetPassword,
      sendVerificationEmail,
      deleteAccount,
      savePreferences,
      updateDisplayName,
      refreshProfile,
      reloadUser,
      getToken,
    }),
    [
      user,
      profile,
      loading,
      profileLoading,
      signUp,
      signIn,
      signInWithGoogle,
      signInAsGuest,
      upgradeGuest,
      startBrowserGuest,
      signOut,
      resetPassword,
      sendVerificationEmail,
      deleteAccount,
      savePreferences,
      updateDisplayName,
      refreshProfile,
      reloadUser,
      getToken,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
