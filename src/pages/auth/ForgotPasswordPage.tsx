import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, MailCheck } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { AuthShell } from '@/features/auth/AuthShell';
import { useAuth } from '@/features/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { InlineAlert } from '@/components/ui/Feedback';

export default function ForgotPasswordPage() {
  const { resetPassword, mode } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (resetError) {
      setError((resetError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Seo title="Reset your password" description="Reset your Ujyalo Learn password." path="/forgot-password" noindex />
      <AuthShell
        title="Reset your password"
        subtitle="Enter the email you signed up with and we will send a reset link."
        footer={
          <>
            Remembered it?{' '}
            <Link to="/login" className="font-semibold" style={{ color: 'var(--primary)' }}>
              Back to log in
            </Link>
          </>
        }
      >
        {sent ? (
          <div className="space-y-4">
            <InlineAlert tone="success" title="Check your inbox">
              If an account exists for <strong>{email}</strong>, a password reset email is on its way. The link expires after a
              short time.
            </InlineAlert>
            <p className="text-sm text-muted">
              Did not receive it? Check your spam folder, make sure the address is correct, or try again in a few minutes.
            </p>
            <Button asChild variant="secondary" fullWidth>
              <Link to="/login">Back to log in</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <InlineAlert tone="danger">{error}</InlineAlert>}
            {mode === 'local' && (
              <InlineAlert tone="warning">
                Password reset needs Firebase email delivery. In demo mode you can create a new local account instead.
              </InlineAlert>
            )}
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
            <Button type="submit" fullWidth loading={loading} icon={sent ? <MailCheck className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}>
              Send reset link
            </Button>
          </form>
        )}
      </AuthShell>
    </>
  );
}
