import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { safeRedirectPath } from '@/lib/safeRedirect';
import { AuthShell } from '@/features/auth/AuthShell';
import { useAuth } from '@/features/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { InlineAlert } from '@/components/ui/Feedback';

export default function LoginPage() {
  const { signIn, signInWithGoogle, signInAsGuest, mode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const [searchParams] = useSearchParams();
  // Parsed, not pattern-matched: a prefix check alone lets /\\evil.com and
  // /<tab>/evil.com through, because the browser normalises backslashes.
  const safeNext = safeRedirectPath(searchParams.get('next'));
  // `||`, not `??` — safeNext is an empty string when absent, and ?? would keep it.
  const from = safeRedirectPath((location.state as { from?: string } | null)?.from) || safeNext || '/app';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      navigate(from, { replace: true });
    } catch (signInError) {
      setError((signInError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGuest() {
    setError(null);
    setGuestLoading(true);
    try {
      await signInAsGuest();
      // A new guest has no profile, so onboarding is the honest destination.
      navigate('/onboarding', { replace: true });
    } catch (guestError) {
      setError((guestError as Error).message);
    } finally {
      setGuestLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (googleError) {
      setError((googleError as Error).message);
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <>
      <Seo title="Log in" description="Log in to your Ujyalo Learn account." path="/login" noindex />
      <AuthShell
        title="Welcome back"
        subtitle="Log in to continue where you left off."
        footer={
          <>
            New to Ujyalo Learn?{' '}
            <Link to="/signup" className="font-semibold" style={{ color: 'var(--primary)' }}>
              Create a free account
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && <InlineAlert tone="danger">{error}</InlineAlert>}
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
          <div>
            <div className="flex items-center justify-between">
              <label className="label !mb-0" htmlFor="password">
                Password
              </label>
              <Link to="/forgot-password" className="mb-1.5 text-xs font-medium" style={{ color: 'var(--primary)' }}>
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                className="input pr-11"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
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
          </div>

          <Button type="submit" fullWidth loading={loading} icon={<LogIn className="h-4 w-4" />}>
            Log in
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
            <p className="text-center text-[11px] text-muted">Google sign-in is available once Firebase is configured.</p>
          )}

          <Button type="button" variant="ghost" fullWidth onClick={handleGuest} loading={guestLoading}>
            Try it without an account
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
