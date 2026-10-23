import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { ArrowRight, LogIn, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/Logo';
import { useAuth } from './AuthProvider';
import { track } from '@/lib/analytics';

/**
 * Shown when someone opens an app URL without a session (a shared quiz link,
 * a bookmark, a search result).
 *
 * It replaces the old redirect to /login. A visitor who does not know the site
 * has already decided to try something, so the screen offers a single button
 * that drops them straight in — no email, no password — and keeps the page they
 * asked for. Logging in stays available, quietly, for people who already have
 * an account.
 */
export function StartGate({ next }: { next?: string }) {
  const { signInAsGuest } = useAuth();
  const location = useLocation();
  const target = next ?? `${location.pathname}${location.search}`;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      await signInAsGuest();
      track('guest_start', { entry: 'gate' });
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Logo size={38} />
        <div className="card mt-6 p-6">
          <span className="badge badge-brand">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            No account needed
          </span>
          <h1 className="mt-3 text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            Start in one click
          </h1>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-soft)' }}>
            The tutor, quizzes and notes all work without an email address. You can save your progress later, and
            nothing you do now will be lost when you do.
          </p>

          <Button onClick={start} loading={busy} fullWidth className="mt-5" iconRight={<ArrowRight className="h-4 w-4" />}>
            Start learning
          </Button>

          {error && (
            <p className="mt-3 text-sm" style={{ color: 'var(--danger)' }} role="alert">
              {error}
            </p>
          )}

          <p className="mt-4 text-center text-xs" style={{ color: 'var(--muted)' }}>
            Already have an account?{' '}
            <Link to="/login" state={{ from: target }} className="inline-flex items-center gap-1 underline">
              <LogIn className="h-3 w-3" aria-hidden="true" /> Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
