import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { PageLoader } from '@/components/ui/Feedback';
import { StartGate } from './StartGate';

/**
 * Guards student routes. Access is enforced by this check *and* by the
 * Firestore security rules — hiding UI is never the only protection.
 */
export function RequireAuth({ children, requireOnboarding = true }: { children: ReactNode; requireOnboarding?: boolean }) {
  const { user, loading, profile, profileLoading, mode } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader label="Checking your session…" />;

  if (!user) {
    // Not a redirect to a login form: a visitor who followed a link into the
    // app gets a one-click way in, and keeps the page they asked for.
    return <StartGate next={location.pathname + location.search} />;
  }

  // In demo mode the profile is stored locally and loads immediately; still
  // wait so students never see a flash of the onboarding screen.
  if (profileLoading) return <PageLoader label="Loading your learning profile…" />;

  const needsOnboarding = mode === 'firebase' ? !profile?.onboardingComplete : !profile?.onboardingComplete;

  if (requireOnboarding && needsOnboarding) {
    // Carry the destination through setup so a shared link is not swallowed.
    return <Navigate to="/onboarding" replace state={{ next: location.pathname + location.search }} />;
  }

  if (!requireOnboarding && profile?.onboardingComplete) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
