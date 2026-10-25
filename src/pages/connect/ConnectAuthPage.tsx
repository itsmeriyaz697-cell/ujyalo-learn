import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Button } from '@/components/ui/Button';
import { DiscordMark } from '@/components/connect/DiscordMark';
import { completeSignIn, startSignIn, type SessionResult } from '@/features/connect/api';
import { safeRedirectPath } from '@/lib/safeRedirect';
import { track } from '@/lib/analytics';

/**
 * The Discord sign-in screen.
 *
 * One job: get someone from "I want to join" to a session, and say honestly
 * what Discord is and is not being used for. It is a page rather than a modal
 * so it can carry its own explanation, and so a cancelled authorisation has
 * somewhere to come back to.
 */

const REASONS: Record<string, string> = {
  cancelled: 'You cancelled the Discord authorisation. Nothing was shared and no account was created.',
  invalid_state: 'That sign-in link was not valid. It may have expired, or been opened in a different browser.',
  expired: 'That sign-in took too long. Links are only valid for ten minutes.',
  missing_code: 'Discord did not return an authorisation code. Please try again.',
  token_exchange_failed: 'Discord refused the sign-in. This is usually a misconfigured client secret.',
  profile_unavailable: 'Discord did not return your profile. Try again, and check the app has the identify scope.',
  identity_conflict: 'This Discord account is already linked to a different Ujyalo profile, so it was not signed in.',
  storage_unavailable: 'The community database is not reachable right now, so no profile could be created.',
  session_failed: 'A session could not be created on the server. Please try again.',
  not_configured: 'Discord sign-in is not switched on for this deployment yet.',
  rate_limited: 'Too many sign-in attempts from this connection. Wait a minute and try again.',
  discord_error: 'Discord reported an error during authorisation.',
};

export default function ConnectAuthPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status = params.get('status');
  const reason = params.get('reason') ?? '';
  const next = safeRedirectPath(params.get('next')) || '/connect';

  // Returning from Discord with ?status=error must open on the error state.
  // It used to open on `idle`, so the explanation was computed and never
  // rendered — a cancelled sign-in looked like nothing had happened at all.
  const [phase, setPhase] = useState<'idle' | 'working' | 'done' | 'error'>(
    status === 'finish' ? 'working' : status === 'error' ? 'error' : 'idle',
  );
  const [message, setMessage] = useState<string | null>(status === 'error' ? (REASONS[reason] ?? REASONS.discord_error) : null);
  /**
   * The claim promise is created once and shared by every render.
   *
   * Two constraints collide here and both matter:
   *
   *   - the custom token is single-use, so the request must happen exactly once
   *     per visit (a second call gets 401 and would show an error to somebody
   *     who had in fact signed in);
   *   - React 18 StrictMode mounts effects twice in development, so "run once"
   *     cannot be implemented by ignoring the second run — the first run's
   *     cleanup would detach its own result and the page would sit on
   *     "Finishing your sign-in…" for ever.
   *
   * Holding the promise in a ref satisfies both: the request is made once, and
   * whichever effect run is current applies the result.
   */
  const claim = useRef<Promise<SessionResult> | null>(null);

  useEffect(() => {
    if (status !== 'finish') return;
    if (!claim.current) claim.current = completeSignIn();

    let alive = true;
    void claim.current.then((result) => {
      if (!alive) return;
      if (result.ok) {
        setPhase('done');
        track('connect_sign_in', { method: 'discord' });
        // A short beat so the success state is visible rather than a flash.
        window.setTimeout(() => navigate(result.next || next, { replace: true }), 600);
      } else {
        setPhase('error');
        setMessage(result.message);
      }
    });

    return () => {
      alive = false;
    };
  }, [status, navigate, next]);

  return (
    <>
      <Seo
        title="Sign in to Ujyalo Connect with Discord | Ujyalo Learn"
        description="Ujyalo Connect uses Discord only to confirm who you are. Your Discord password is never requested or stored."
        path="/connect/auth"
        noindex
      />

      <main id="main" className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link to="/connect" className="inline-flex items-center gap-1.5 text-sm text-muted hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Ujyalo Connect
          </Link>

          <div className="card mt-4 overflow-hidden p-0">
            {/* Discord's own colour, so the button reads as a Discord action
                rather than a generic site button. */}
            <div style={{ background: '#5865F2' }} className="px-6 py-5 text-white">
              <div className="flex items-center gap-2.5">
                <DiscordMark size={26} />
                <span className="text-sm font-semibold tracking-wide">Ujyalo Connect</span>
              </div>
              <h1 className="mt-3 text-xl font-bold tracking-tight">Sign in with Discord</h1>
              <p className="mt-1 text-sm text-white/85">
                One account for the community. No new password to remember.
              </p>
            </div>

            <div className="p-6">
              {phase === 'working' && (
                <div className="flex items-center gap-3 text-sm" aria-live="polite">
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Finishing your sign-in…
                </div>
              )}

              {phase === 'done' && (
                <div className="flex items-start gap-3 text-sm" role="status">
                  <CheckCircle2 className="mt-0.5 h-5 w-5" style={{ color: 'var(--success)' }} aria-hidden="true" />
                  <div>
                    <p className="font-semibold">You are signed in.</p>
                    <p className="mt-0.5 text-muted">Taking you to your community…</p>
                  </div>
                </div>
              )}

              {phase === 'error' && (
                <div className="flex items-start gap-3 text-sm" role="alert">
                  <AlertCircle className="mt-0.5 h-5 w-5" style={{ color: 'var(--danger)' }} aria-hidden="true" />
                  <p>{message}</p>
                </div>
              )}

              {phase === 'idle' && (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                  Ujyalo Connect uses Discord to confirm who you are. You will be asked to approve access to your
                  Discord username, avatar and email address.
                </p>
              )}

              {phase !== 'done' && (
                <Button
                  className="mt-5 w-full"
                  size="lg"
                  onClick={() => {
                    setPhase('working');
                    track('connect_sign_in_started', { method: 'discord' });
                    startSignIn(next);
                  }}
                  loading={phase === 'working'}
                  style={{ background: '#5865F2', borderColor: '#5865F2' }}
                >
                  {phase === 'error' ? 'Try Discord again' : 'Continue with Discord'}
                </Button>
              )}

              <ul className="mt-5 space-y-2 text-[13px]" style={{ color: 'var(--text-soft)' }}>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  Your Discord password is never requested, seen or stored by Ujyalo.
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  Only your user id, username, avatar and (if you allow it) email address are read.
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  Signing in here does not give you access to any Discord server or channel. Ujyalo Connect has its own
                  communities and its own messages.
                </li>
              </ul>

              <p className="mt-5 text-xs text-muted">
                Prefer not to use Discord? Everything else on Ujyalo Learn — the tutor, notes, quizzes and the Arena —
                works without an account at all.{' '}
                <Link to="/app/tutor" className="underline">
                  Open the tutor
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
