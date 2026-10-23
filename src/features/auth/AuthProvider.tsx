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
import { dataStore } from '@/services/data';
import { registerTokenProvider } from '@/services/ai/client';
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
    registerTokenProvider({ getIdToken: () => authService.getIdToken() });
    return () => registerTokenProvider(null);
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

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    try {
      return await authService.signUp(email, password, name);
    } catch (error) {
      throw new Error(friendlyAuthError(error), { cause: error });
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      return await authService.signIn(email, password);
    } catch (error) {
      throw new Error(friendlyAuthError(error), { cause: error });
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      return await authService.signInWithGoogle();
    } catch (error) {
      throw new Error(friendlyAuthError(error), { cause: error });
    }
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setProfile(null);
  }, []);

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
