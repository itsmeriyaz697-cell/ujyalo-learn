import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { PageLoader } from '@/components/ui/Feedback';

/**
 * Guards student routes. Access is enforced by this check *and* by the
 * Firestore security rules — hiding UI is never the only protection.
 */
export function RequireAuth({ children, requireOnboarding = true }: { children: ReactNode; requireOnboarding?: boolean }) {
  const { user, loading, profile, profileLoading, mode } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader label="Checking your session…" />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  // In demo mode the profile is stored locally and loads immediately; still
  // wait so students never see a flash of the onboarding screen.
  if (profileLoading) return <PageLoader label="Loading your learning profile…" />;

  const needsOnboarding = mode === 'firebase' ? !profile?.onboardingComplete : !profile?.onboardingComplete;

  if (requireOnboarding && needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!requireOnboarding && profile?.onboardingComplete) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
