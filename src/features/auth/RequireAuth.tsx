import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { PageLoader } from '@/components/ui/Feedback';

/**
 * Entry to the learning app.
 *
 * This used to be a wall: no session meant a "Start in one click" screen, and
 * even after that click the profile was incomplete, so the visitor was sent
 * through a seven-step onboarding form before they could ask a single question.
 * Two screens stood between a link and the thing the link promised.
 *
 * It is now a session in the time it takes to render one loader. The browser
 * session has a uid, so notes, chats and quizzes are owned and stored, but it
 * needs no account. Onboarding is not a gate; it is offered from inside the
 * app, where skipping it costs nothing.
 *
 * Being signed in is still genuinely required for the admin area (separate
 * guard) and for anything that writes to another person's record — Firestore
 * rules enforce that regardless of what the client does.
 */
export function RequireAuth({
  children,
  requireOnboarding = true,
}: {
  children: ReactNode;
  requireOnboarding?: boolean;
}) {
  const { user, loading, profile, profileLoading, startBrowserGuest } = useAuth();
  const location = useLocation();

  // Start the browser session as the route opens, not on a button.
  useEffect(() => {
    if (!loading && !user) startBrowserGuest();
  }, [loading, user, startBrowserGuest]);

  if (loading || !user) return <PageLoader label="Opening your workspace…" />;

  if (profileLoading) return <PageLoader label="Loading your learning profile…" />;

  // /onboarding is only meaningful for someone who has not finished it.
  if (!requireOnboarding && profile?.onboardingComplete) {
    return <Navigate to="/app" replace state={{ from: location.pathname + location.search }} />;
  }

  return <>{children}</>;
}
