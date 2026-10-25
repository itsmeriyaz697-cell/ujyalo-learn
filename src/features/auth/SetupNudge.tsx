import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { useAuth } from './AuthProvider';

/**
 * A non-blocking invitation to finish personal setup.
 *
 * Onboarding used to be compulsory: an incomplete profile meant every app route
 * bounced to a seven-step form. That is a wall, and it was the second one a new
 * visitor hit. The same information is genuinely useful — the tutor answers at
 * the right level and the planner knows how long to plan for — so it is asked
 * for here instead, where ignoring it costs nothing.
 */
export function SetupNudge() {
  const { profile, isBrowserGuest } = useAuth();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);

  // Guests already carry the guest banner; two stacked asks is noise.
  if (isBrowserGuest || dismissed) return null;
  if (!profile || profile.onboardingComplete) return null;

  const next = `${location.pathname}${location.search}`;

  return (
    <div className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
      <div className="container-page flex flex-wrap items-center gap-3 py-2">
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-[13px]" style={{ color: 'var(--text-soft)' }}>
          Answers are pitched at a default grade until you set yours. Takes about a minute, and you can change it later.
        </p>
        <Link
          to={`/onboarding?next=${encodeURIComponent(next)}`}
          className="rounded-lg px-2.5 py-1 text-[13px] font-semibold underline"
          style={{ color: 'var(--primary)' }}
        >
          Set my grade
        </Link>
        <button type="button" className="btn-icon" aria-label="Dismiss" onClick={() => setDismissed(true)}>
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
