import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Info, Lock, MessageSquare, Plus, Users } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Section } from '@/components/marketing/Section';
import { Button } from '@/components/ui/Button';
import { DiscordMark } from '@/components/connect/DiscordMark';
import { useAuth } from '@/features/auth/AuthProvider';
import { fetchConnectStatus, startSignIn } from '@/features/connect/api';
import { listCommunities, getMyProfile } from '@/features/connect/firestore';
import type { Community, ConnectProfile, ConnectStatus } from '@/features/connect/types';
import { isFirebaseConfigured } from '@/services/firebase/client';

/**
 * Ujyalo Connect — the hub.
 *
 * Browsable by anyone. The community list is public metadata, so a visitor can
 * see what exists before deciding whether to sign in — the same principle as
 * the rest of the site. Signing in is only asked for when they want to read
 * messages or join.
 */
export default function ConnectHubPage() {
  const { user, isBrowserGuest } = useAuth();
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [communities, setCommunities] = useState<Community[] | null>(null);
  const [profile, setProfile] = useState<ConnectProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const connected = Boolean(user && !isBrowserGuest);

  useEffect(() => {
    void fetchConnectStatus().then(setStatus);
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setCommunities([]);
      return;
    }
    let cancelled = false;
    listCommunities()
      .then((rows) => {
        if (!cancelled) setCommunities(rows);
      })
      .catch(() => {
        if (!cancelled) {
          setCommunities([]);
          setLoadError('The community list could not be loaded. The database may not be configured on this deployment.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!connected || !user) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    getMyProfile(user.uid)
      .then((row) => {
        if (!cancelled) setProfile(row);
      })
      .catch(() => {
        /* a profile is written by the server on next sign-in */
      });
    return () => {
      cancelled = true;
    };
  }, [connected, user]);

  return (
    <>
      <Seo
        title="Ujyalo Connect — study communities for Nepali students"
        description="Join study communities, ask questions and help other students. Sign in with Discord to post; browsing is open to everyone."
        path="/connect"
      />

      <Section className="!pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge badge-brand">
            <DiscordMark size={13} /> Ujyalo Connect
          </span>
          {status && !status.configured && (
            <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--text-soft)' }}>
              Not configured on this deployment
            </span>
          )}
        </div>
        <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: 'var(--text)' }}>
          Study together, not alone
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
          Communities for the exams you are actually sitting. Ask a question at 10pm, answer somebody else&rsquo;s,
          and keep the answers where the whole group can find them.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {connected && user ? (
            <>
              <Button asChild>
                <Link to="/connect/me">Your Connect profile</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/connect/new">
                  <Plus className="h-4 w-4" aria-hidden="true" /> Create a community
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => startSignIn('/connect')}
                disabled={status ? !status.configured : false}
                style={{ background: '#5865F2', borderColor: '#5865F2' }}
              >
                <DiscordMark size={17} /> Continue with Discord
              </Button>
              <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
                Reading the list is open to everyone. Signing in is only needed to post.
              </span>
            </>
          )}
        </div>

        {status && !status.configured && (
          <p
            className="mt-4 flex max-w-2xl items-start gap-2 rounded-xl border p-3 text-[13px]"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-soft)' }}
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Discord sign-in has not been switched on for this site yet, so no account can be created here. The owner
            setup steps are in <code>docs/UJYALO-CONNECT.md</code>. Nothing is simulated in the meantime.
          </p>
        )}

        {profile && (
          <div
            className="mt-5 flex items-center gap-3 rounded-2xl border p-3"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" width={40} height={40} className="h-10 w-10 rounded-full" />
            ) : (
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
              >
                {profile.displayName.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" style={{ color: 'var(--text)' }}>
                {profile.displayName}
              </p>
              <p className="truncate text-xs text-muted">@{profile.discordUsername} · Discord connected</p>
            </div>
          </div>
        )}
      </Section>

      <Section tone="surface" className="!py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              Communities
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-soft)' }}>
              Anyone can read this list. Messages inside a community are for its members.
            </p>
          </div>
        </div>

        {loadError && (
          <p className="mt-4 rounded-xl border p-3 text-sm" style={{ borderColor: 'var(--border)', color: 'var(--danger)' }} role="alert">
            {loadError}
          </p>
        )}

        {communities === null ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {[0, 1, 2].map((key) => (
              <div key={key} className="card h-32 animate-pulse" style={{ background: 'var(--surface-2)' }} />
            ))}
          </div>
        ) : communities.length === 0 ? (
          <div className="card mt-6 p-6">
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              No communities yet.
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-soft)' }}>
              {connected
                ? 'You can create the first one — a grade group, a subject group, or a study circle for the exam you are sitting.'
                : 'Communities appear here once somebody creates one. Signing in with Discord is what lets you create the first.'}
            </p>
            {connected && (
              <Button asChild className="mt-4">
                <Link to="/connect/new">Create a community</Link>
              </Button>
            )}
          </div>
        ) : (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {communities.map((community) => (
              <li key={community.id}>
                <Link
                  to={`/connect/c/${community.slug}`}
                  className="card flex h-full flex-col justify-between p-5 transition-shadow hover:shadow-lift"
                >
                  <div>
                    <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                      {community.name}
                    </h3>
                    <p className="mt-1 line-clamp-3 text-[13.5px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                      {community.description || 'No description yet.'}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-3 text-[12px] text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" aria-hidden="true" /> {community.memberCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" /> channels
                    </span>
                    <ArrowRight className="ml-auto h-4 w-4" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section className="!py-12">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: 'var(--text)' }}>
              <Lock className="h-4 w-4" aria-hidden="true" /> What Discord is used for
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-soft)' }}>
              Discord confirms that you are one person with one account. Ujyalo never asks for your Discord password,
              and never sees it. You approve access on Discord&rsquo;s own site and are sent straight back here.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
              What it is not
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-soft)' }}>
              Signing in does not join you to any Discord server, and these communities are not Discord channels.
              Conversations here live in Ujyalo Connect and stay here. The rest of Ujyalo Learn — the tutor, notes,
              quizzes, the Arena — still needs no account at all.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
