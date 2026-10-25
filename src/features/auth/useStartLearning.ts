import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { track } from '@/lib/analytics';

/**
 * The front door.
 *
 * It used to open a guest account and then send the visitor to a seven-step
 * onboarding form — the form was the first thing they saw after clicking
 * "start", and most of them left there. The tutor they asked for was two
 * screens away.
 *
 * Now: one click, straight into the tool. The session behind it is a browser
 * session (see RequireAuth), so there is no network round-trip that can fail
 * and nothing that needs a provider enabled in a console somewhere. Onboarding
 * is offered inside the app, and skipping it is free.
 */
export function useStartLearning() {
  const { user, startBrowserGuest } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const start = useCallback(
    // Called both as `onClick={start}` (which passes a MouseEvent) and as
    // `start('/app/quizzes')`, so the argument is only honoured when it is a
    // path. A click event must never be treated as a destination.
    (destination?: string | unknown) => {
      const to = typeof destination === 'string' && destination.startsWith('/') ? destination : '/app/tutor';
      setBusy(true);
      if (!user) startBrowserGuest();
      track('guest_start', { entry: 'cta', to });
      navigate(to);
      setBusy(false);
    },
    [navigate, startBrowserGuest, user],
  );

  return { start, busy, error: null as string | null };
}
