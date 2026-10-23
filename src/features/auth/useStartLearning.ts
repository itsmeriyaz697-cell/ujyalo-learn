import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { track } from '@/lib/analytics';

/**
 * The front door.
 *
 * A visitor should be able to try the tutor before being asked for anything, so
 * the primary buttons ("Start learning free", "Practise now") call this instead
 * of linking to a sign-up form:
 *
 *   - already signed in  → straight into the app;
 *   - not signed in      → an anonymous account in one click, no form, no email;
 *   - guest mode off     → the sign-up screen, with the reason stated.
 *
 * Nothing is created until the visitor actually clicks, so crawlers and people
 * who only read the marketing pages never produce empty accounts.
 */
export function useStartLearning() {
  const { user, profile, signInAsGuest } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setError(null);

    if (user) {
      navigate(profile?.onboardingComplete ? '/app' : '/onboarding');
      return;
    }

    setBusy(true);
    try {
      await signInAsGuest();
      track('guest_start', { entry: 'cta' });
      // A brand-new guest has no profile yet, so the short setup comes first.
      navigate('/onboarding');
    } catch (caught) {
      const message = (caught as Error).message;
      setError(message);
      // `auth/operation-not-allowed` means the owner has not enabled anonymous
      // sign-in yet. Sending the visitor to the sign-up form is the honest
      // fallback, and the form explains itself.
      if (/not switched on|not enabled|operation-not-allowed/i.test(message)) {
        navigate('/signup', { state: { reason: 'guest-unavailable' } });
      }
    } finally {
      setBusy(false);
    }
  }, [user, profile, signInAsGuest, navigate]);

  return { start, busy, error };
}
