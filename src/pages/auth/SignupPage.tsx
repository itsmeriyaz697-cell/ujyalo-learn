import { useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { AuthShell } from '@/features/auth/AuthShell';
import { useAuth } from '@/features/auth/AuthProvider';
import { track } from '@/lib/analytics';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { InlineAlert } from '@/components/ui/Feedback';
import { safeRedirectPath } from '@/lib/safeRedirect';

function passwordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  const labels = ['Very weak', 'Weak', 'Okay', 'Good', 'Strong', 'Very strong'];
  return { score, label: labels[Math.min(score, 5)] };
}

export default function SignupPage() {
  const { signUp, signInWithGoogle, signInAsGuest, mode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Set when guest mode could not be started (the provider is switched off in
  // Firebase). Saying why turns a dead end into an explanation.
  const guestUnavailable = (location.state as { reason?: string } | null)?.reason === 'guest-unavailable';
  const [searchParams] = useSearchParams();
  // Where they were going before they were asked to create an account. Parsed
  // through safeRedirectPath so a crafted ?next= cannot bounce them off-site.
  const next =
    safeRedirectPath(searchParams.get('next')) ||
    safeRedirectPath((location.state as { from?: string } | null)?.from) ||
    '/app';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Please use a password with at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    if (!accepted) {
      setError('Please confirm that you accept the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim());
      track('sign_up', { method: 'email' });
      // Straight where they were going. Personal setup is offered from inside
      // the app (SetupNudge) instead of standing between them and the tool.
      navigate(next, { replace: true });
    } catch (signUpError) {
      setError((signUpError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGuest() {
    setError(null);
    setGuestLoading(true);
    try {
      await signInAsGuest();
      track('guest_start', { entry: 'signup' });
      navigate(next, { replace: true });
    } catch (guestError) {
      setError((guestError as Error).message);
    } finally {
      setGuestLoading(false);
    }
  }

  async function handleGoogle() {
    if (!accepted) {
      setError('Please confirm that you accept the Terms of Service and Privacy Policy.');
      return;
    }
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      track('sign_up', { method: 'google' });
      navigate(next, { replace: true });
    } catch (googleError) {
      setError((googleError as Error).message);
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <>
      <Seo title="Create your free account" description="Create a free Ujyalo Learn account and start learning with a personal AI tutor." path="/signup" noindex />
      <AuthShell
        title="Create your free account"
        subtitle="Set up takes about a minute. No credit card needed."
        footer={
          <>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold" style={{ color: 'var(--primary)' }}>
              Log in
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {guestUnavailable && !error && (
            <InlineAlert tone="info">
              One-click start is not switched on for this site yet. Creating an account takes about thirty seconds and
              works exactly the same.
            </InlineAlert>
          )}

          {error && <InlineAlert tone="danger">{error}</InlineAlert>}

          <Input
            label="Your name"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="How should the tutor address you?"
          />

          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            hint="We only use this for sign-in and account recovery."
          />

          <div>
            <label className="label" htmlFor="new-password">
              Password
            </label>
            <div className="relative">
              <input
                id="new-password"
                className="input pr-11"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{ color: 'var(--muted)' }}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password && (
              <div className="mt-2">
                <div className="flex gap-1" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <span
                      key={step}
                      className="h-1 flex-1 rounded-full"
                      style={{
                        background:
                          strength.score >= step
                            ? strength.score >= 4
                              ? 'var(--success)'
                              : 'var(--accent)'
                            : 'var(--surface-3)',
                      }}
                    />
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-muted">
                  Password strength: <span style={{ color: 'var(--text-soft)' }}>{strength.label}</span>. Use at least 8
                  characters.
                </p>
              </div>
            )}
          </div>

          <Input
            label="Confirm password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            error={confirm && password !== confirm ? 'Passwords do not match.' : undefined}
          />

          <label className="flex items-start gap-2.5 text-[13px] leading-relaxed text-muted">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 rounded border-[color:var(--border-strong)]"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
              style={{ accentColor: 'var(--primary)' }}
            />
            <span>
              I agree to the{' '}
              <Link to="/terms" className="underline" style={{ color: 'var(--primary)' }}>
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="underline" style={{ color: 'var(--primary)' }}>
                Privacy Policy
              </Link>
              . If I am under 13, a parent or guardian has agreed on my behalf.
            </span>
          </label>

          <Button type="submit" fullWidth loading={loading} icon={<UserPlus className="h-4 w-4" />}>
            Create account
          </Button>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
            <span className="text-[11px] uppercase tracking-wide text-muted">or</span>
            <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
          </div>

          <Button type="button" variant="secondary" fullWidth onClick={handleGoogle} loading={googleLoading}>
            Continue with Google
          </Button>
          {mode === 'local' && (
            <p className="text-center text-[11px] text-muted">Google sign-up is available once Firebase is configured.</p>
          )}

          <Button type="button" variant="ghost" fullWidth onClick={handleGuest} loading={guestLoading}>
            Skip — try it without an account
          </Button>
          <p className="text-center text-[11px] leading-relaxed text-muted">
            A guest account works straight away and keeps your work, but it lives only in this browser. Add an email
            later to keep it — nothing is lost.
          </p>
        </form>
      </AuthShell>
    </>
  );
}
