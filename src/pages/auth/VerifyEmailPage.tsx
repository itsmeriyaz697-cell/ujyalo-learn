import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, MailCheck, RefreshCw, Send } from 'lucide-react';
import { AuthShell } from '@/features/auth/AuthShell';
import { useAuth } from '@/features/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { InlineAlert } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { Seo } from '@/components/seo/Seo';

/**
 * Email verification.
 *
 * Firebase accounts start unverified. We never block students from studying
 * because of it — verification only proves ownership of the email address, and
 * the app reminds them from Settings. This page lets them resend the email and
 * refresh their status after clicking the link.
 */
export default function VerifyEmailPage() {
  const { user, mode, sendVerificationEmail, reloadUser, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verified = Boolean(user?.emailVerified);

  const resend = useCallback(async () => {
    setError(null);
    setSending(true);
    try {
      await sendVerificationEmail();
      setSentAt(Date.now());
      toast(`Verification email sent. Check the inbox for ${user?.email ?? 'your email address'}.`, 'success');
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setSending(false);
    }
  }, [sendVerificationEmail, toast, user?.email]);

  const checkAgain = useCallback(async () => {
    setError(null);
    setChecking(true);
    try {
      const freshUser = await reloadUser();
      if (freshUser?.emailVerified) {
        toast('Email verified — thank you! Your account is confirmed.', 'success');
        navigate('/app', { replace: true });
      } else {
        toast('Not verified yet. Open the link in your inbox first, then check again.', 'info');
      }
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setChecking(false);
    }
  }, [navigate, reloadUser, toast]);

  // Re-check automatically when the student comes back to this tab.
  useEffect(() => {
    if (mode !== 'firebase' || verified) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') void reloadUser().catch(() => undefined);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [mode, reloadUser, verified]);

  return (
    <>
      <Seo title="Verify your email" description="Confirm your email address for your Ujyalo Learn account." path="/verify-email" noindex />
      <AuthShell
        title={verified ? 'Your email is verified' : 'Verify your email'}
        subtitle={
          verified
            ? 'Nothing else to do — you can keep learning.'
            : 'One quick step so we can reach you about your account.'
        }
        footer={
        <p className="text-center text-xs text-muted">
          Wrong account?{' '}
          <button
            type="button"
            className="font-semibold underline underline-offset-2"
            style={{ color: 'var(--primary)' }}
            onClick={() => void signOut()}
          >
            Sign out
          </button>
        </p>
      }
    >
      {mode === 'local' ? (
        <div className="space-y-5">
          <InlineAlert tone="info" title="Demo mode has no email">
            You are using the local demo mode, where accounts live only in this browser. Email verification needs Firebase,
            which the site owner configures with environment variables. Nothing is broken — there is simply no inbox to
            verify.
          </InlineAlert>
          <Button asChild className="w-full">
            <Link to="/app">Continue to your dashboard</Link>
          </Button>
        </div>
      ) : verified ? (
        <div className="space-y-5">
          <div
            className="flex items-start gap-3 rounded-2xl border p-4"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--success)' }} aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">Email confirmed</p>
              <p className="mt-1 text-sm text-muted">
                {user?.email} can now receive password resets and account notices.
              </p>
            </div>
          </div>
          <Button asChild className="w-full">
            <Link to="/app">Go to your dashboard</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div
            className="flex items-start gap-3 rounded-2xl border p-4"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--primary)' }} aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">We sent a link to {user?.email ?? 'your email address'}</p>
              <p className="mt-1 text-sm text-muted">
                Open it in the same browser you used to sign up, then come back and press “I’ve verified”. If it is not in
                your inbox after a few minutes, check the spam folder.
              </p>
            </div>
          </div>

          {error ? <InlineAlert tone="danger" title="That didn’t work">{error}</InlineAlert> : null}

          {sentAt ? (
            <p className="text-xs text-muted" role="status">
              A new email was requested just now. Firestore rules allow only your own account to be read, so nobody else
              can see your address.
            </p>
          ) : null}

          <div className="space-y-3">
            <Button className="w-full" loading={checking} onClick={() => void checkAgain()}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              I’ve verified — check again
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              loading={sending}
              disabled={sending || (sentAt !== null && Date.now() - sentAt < 60_000)}
              onClick={() => void resend()}
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              Resend verification email
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link to="/app">Skip for now — keep learning</Link>
            </Button>
          </div>

          <p className="text-xs leading-relaxed text-muted">
            Unverified accounts can still study. Verification is required before you can change sensitive account settings
            or contact support about billing — support email is configured by the site owner.
          </p>
        </div>
      )}
      </AuthShell>
    </>
  );
}
