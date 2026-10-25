import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserRoundPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from './AuthProvider';
import { track } from '@/lib/analytics';

/**
 * Shown to anonymous accounts inside the app.
 *
 * A guest account is a real account with its own uid, so the rules protect its
 * data normally — but nothing ties it to a person. If the browser's storage is
 * cleared, the session is gone and there is no email to recover it with. That
 * risk has to be visible before the student has done work worth losing, not
 * discovered afterwards.
 *
 * Saving keeps the same uid, so notes, quizzes and chats already created as a
 * guest stay exactly where they are.
 */
export function GuestBanner() {
  const { isGuest, isBrowserGuest, upgradeGuest, user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(user?.displayName === 'Guest' ? '' : (user?.displayName ?? ''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isGuest || dismissed) return null;

  /**
   * A browser session has no auth record to attach an email to, so the upgrade
   * is a normal sign-up. AuthProvider carries the work across at that moment;
   * the copy says so rather than pretending the account already exists.
   */
  if (isBrowserGuest) {
    const next = `${location.pathname}${location.search}`;
    return (
      <div className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--primary-soft)' }}>
        <div className="container-page flex flex-wrap items-center gap-3 py-2.5">
          <UserRoundPlus className="h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} aria-hidden="true" />
          <p className="min-w-0 flex-1 text-sm" style={{ color: 'var(--text)' }}>
            You are working without an account. Everything is saved <strong>in this browser only</strong> — an account
            keeps it across devices and survives clearing your data.
          </p>
          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link to={`/signup?next=${encodeURIComponent(next)}`} onClick={() => track('guest_upgrade', { method: 'browser-prompt' })}>
                Create a free account
              </Link>
            </Button>
            <button type="button" className="btn-icon" aria-label="Dismiss" onClick={() => setDismissed(true)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  async function save() {
    setError(null);
    if (!email.trim()) return setError('Enter an email address.');
    if (password.length < 6) return setError('Use a password of at least 6 characters.');
    setBusy(true);
    try {
      await upgradeGuest(email.trim(), password, name.trim() || 'Student');
      track('guest_upgrade', { method: 'email' });
      setOpen(false);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="border-b"
      style={{ borderColor: 'var(--border)', background: 'var(--primary-soft)' }}
    >
      <div className="container-page flex flex-wrap items-center gap-3 py-2.5">
        <UserRoundPlus className="h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm" style={{ color: 'var(--text)' }}>
          You are using a <strong>guest account</strong>. Your work is saved, but only in this browser — clearing
          browser data would lose it.
        </p>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setOpen(true)}>
            Keep my progress
          </Button>
          <button
            type="button"
            className="btn-icon"
            aria-label="Dismiss"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(4,10,24,0.55)' }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className="relative z-10 w-full max-w-md rounded-2xl border p-5 shadow-lift"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-save-title"
          >
            <h2 id="guest-save-title" className="text-base font-bold">
              Keep your progress
            </h2>
            <p className="mt-1 text-sm text-soft">
              Add an email and password. Everything you have already done stays exactly as it is — nothing is copied or
              reset, because the account keeps the same identity.
            </p>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="label">Your name</span>
                <input className="input" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
              </label>
              <label className="block">
                <span className="label">Email address</span>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                />
              </label>
              <label className="block">
                <span className="label">Password</span>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                />
              </label>
            </div>

            {error && (
              <p className="mt-3 text-sm" style={{ color: 'var(--danger)' }} role="alert">
                {error}
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Not now
              </Button>
              <Button onClick={save} loading={busy}>
                Save my account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
