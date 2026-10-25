import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, LogOut, Save } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Section } from '@/components/marketing/Section';
import { Button } from '@/components/ui/Button';
import { DiscordMark } from '@/components/connect/DiscordMark';
import { useAuth } from '@/features/auth/AuthProvider';
import { signOutConnect } from '@/features/connect/api';
import { getMyProfile, updateMyProfile } from '@/features/connect/firestore';
import type { ConnectProfile } from '@/features/connect/types';

/**
 * The Connect profile.
 *
 * What came from Discord is shown as read-only and labelled, because it is not
 * this site's to change — editing it here would silently diverge from the
 * account it describes. What a person may choose (how their name appears, a
 * short bio) is editable, and only those fields are written.
 */
export default function ConnectProfilePage() {
  const { user, isBrowserGuest } = useAuth();
  const connected = Boolean(user && !isBrowserGuest);
  const [profile, setProfile] = useState<ConnectProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!connected || !user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getMyProfile(user.uid)
      .then((row) => {
        if (cancelled) return;
        setProfile(row);
        setDisplayName(row?.displayName ?? '');
        setBio(row?.bio ?? '');
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [connected, user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updateMyProfile(user.uid, { displayName: displayName.trim(), bio: bio.trim() });
      setMessage('Saved.');
      setProfile((current) => (current ? { ...current, displayName: displayName.trim(), bio: bio.trim() } : current));
    } catch (caught) {
      setError((caught as Error).message || 'Your profile could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  if (!connected) {
    return (
      <main id="main" className="container-page py-16">
        <Seo title="Your Ujyalo Connect profile" description="Sign in with Discord to see your Connect profile." path="/connect/me" noindex />
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          A Connect profile needs a Discord account
        </h1>
        <p className="mt-2 max-w-xl text-sm" style={{ color: 'var(--text-soft)' }}>
          Your profile is created the first time you sign in with Discord, and it is what identifies you in community
          messages. Nothing else on Ujyalo Learn needs it.
        </p>
        <div className="mt-5 flex gap-2">
          <Button asChild>
            <Link to="/connect/auth">Continue with Discord</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/connect">Back to Connect</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <>
      <Seo title="Your Ujyalo Connect profile" description="Your Discord-linked Connect profile." path="/connect/me" noindex />
      <Section className="!py-10">
        <div className="flex flex-wrap items-center gap-4">
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" width={64} height={64} className="h-16 w-16 rounded-full" />
          ) : (
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold"
              style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
            >
              {(profile?.displayName ?? '?').slice(0, 1).toUpperCase()}
            </span>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              {profile?.displayName ?? 'Your profile'}
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
              <DiscordMark size={14} /> @{profile?.discordUsername ?? 'unknown'}
            </p>
          </div>
          <Button
            variant="secondary"
            className="ml-auto"
            onClick={async () => {
              await signOutConnect();
              window.location.assign('/connect');
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
          </Button>
        </div>
      </Section>

      <Section tone="surface" className="!py-10">
        {loading ? (
          <div className="card h-40 animate-pulse" style={{ background: 'var(--surface-2)' }} aria-busy="true" />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                What you can change
              </h2>
              <div className="mt-3 space-y-3">
                <label className="block">
                  <span className="label">Display name</span>
                  <input
                    className="input"
                    value={displayName}
                    maxLength={60}
                    onChange={(event) => setDisplayName(event.target.value)}
                  />
                  <span className="mt-1 block text-[12px] text-muted">This is the name shown on your messages.</span>
                </label>
                <label className="block">
                  <span className="label">About you</span>
                  <textarea
                    className="input min-h-[80px]"
                    value={bio}
                    maxLength={400}
                    placeholder="What you are studying, or what you can help with."
                    onChange={(event) => setBio(event.target.value)}
                  />
                </label>
                {message && (
                  <p className="text-sm" style={{ color: 'var(--success)' }} role="status">
                    {message}
                  </p>
                )}
                {error && (
                  <p className="text-sm" style={{ color: 'var(--danger)' }} role="alert">
                    {error}
                  </p>
                )}
                <Button onClick={save} loading={saving} disabled={!displayName.trim()}>
                  <Save className="h-4 w-4" aria-hidden="true" /> Save changes
                </Button>
              </div>
            </div>

            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                What came from Discord
              </h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4 border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                  <dt className="text-muted">Discord username</dt>
                  <dd style={{ color: 'var(--text)' }}>@{profile?.discordUsername ?? '—'}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                  <dt className="text-muted">Discord ID</dt>
                  <dd className="font-mono text-[13px]" style={{ color: 'var(--text)' }}>
                    {profile?.discordId ?? '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                  <dt className="text-muted">Email</dt>
                  <dd style={{ color: 'var(--text)' }}>{profile?.email ?? 'Not shared'}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                  <dt className="flex items-center gap-1.5 text-muted">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> Joined Connect
                  </dt>
                  <dd style={{ color: 'var(--text)' }}>
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Communities</dt>
                  <dd style={{ color: 'var(--text)' }}>{profile?.memberships.length ?? 0}</dd>
                </div>
              </dl>
              <p className="mt-3 text-[12px] leading-relaxed text-muted">
                These fields are read from Discord and cannot be edited here — changing them would make this page
                disagree with the account it describes.
              </p>
              {profile && profile.memberships.length > 0 && (
                <Button asChild variant="secondary" className="mt-4">
                  <Link to="/connect">Go to your communities</Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </Section>
    </>
  );
}
