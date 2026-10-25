import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Hash, Lock, LogOut, Send, Users } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Button } from '@/components/ui/Button';
import { DiscordMark } from '@/components/connect/DiscordMark';
import { useAuth } from '@/features/auth/AuthProvider';
import { startSignIn } from '@/features/connect/api';
import {
  getCommunityBySlug,
  getMyProfile,
  isMember,
  joinCommunity,
  leaveCommunity,
  listChannels,
  sendMessage,
  subscribeMessages,
} from '@/features/connect/firestore';
import type { Channel, Community, ConnectMessage, ConnectProfile } from '@/features/connect/types';
import { isFirebaseConfigured } from '@/services/firebase/client';

/**
 * One community: its channels, and — for members only — the messages.
 *
 * The page deliberately renders in layers, because that is the real state
 * machine behind "sign in only when necessary":
 *
 *   1. nobody signed in        → the community describes itself and invites you in
 *   2. signed in, not a member → one button: join
 *   3. a member                → the live message feed and the composer
 *
 * Each layer explains itself. Nothing is hidden behind an unexplained wall, and
 * nothing auto-joins somebody who only wanted to look.
 */
export default function CommunityPage() {
  const { slug = '' } = useParams();
  const { user, isBrowserGuest } = useAuth();
  const connected = Boolean(user && !isBrowserGuest);

  const [community, setCommunity] = useState<Community | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('');
  const [member, setMember] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<ConnectProfile | null>(null);
  const [messages, setMessages] = useState<ConnectMessage[]>([]);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // ── Community + channels (public) ────────────────────────────────────────
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const found = await getCommunityBySlug(slug);
        if (cancelled) return;
        if (!found) {
          setNotFound(true);
          return;
        }
        setCommunity(found);
        const rows = await listChannels(found.id);
        if (cancelled) return;
        setChannels(rows);
        setActiveChannel(rows[0]?.id ?? '');
      } catch {
        if (!cancelled) setError('This community could not be loaded.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // ── Membership, which decides whether messages are readable at all ───────
  useEffect(() => {
    if (!community || !user || !connected) {
      setMember(null);
      return;
    }
    let cancelled = false;
    isMember(community.id, user.uid)
      .then((value) => {
        if (!cancelled) setMember(value);
      })
      .catch(() => {
        // A permission error here means "not a member", which is the honest
        // reading: the rules refuse to confirm membership to non-members.
        if (!cancelled) setMember(false);
      });
    getMyProfile(user.uid)
      .then((row) => {
        if (!cancelled) setProfile(row);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [community, user, connected, member]);

  // ── Live messages ────────────────────────────────────────────────────────
  useEffect(() => {
    setMessages([]);
    setFeedError(null);
    if (!community || !activeChannel || !member) return;

    let unsubscribe: (() => void) | null = null;
    let cancelled = false;
    subscribeMessages(
      community.id,
      activeChannel,
      (rows) => setMessages(rows),
      (message) => setFeedError(message),
    )
      .then((stop) => {
        if (cancelled) stop();
        else unsubscribe = stop;
      })
      .catch(() => setFeedError('The message feed could not be opened.'));

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [community, activeChannel, member]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const join = useCallback(async () => {
    if (!community || !user) return;
    setError(null);
    setSending(true);
    try {
      await joinCommunity(community.id, user.uid);
      setMember(true);
    } catch (caught) {
      setError((caught as Error).message || 'You could not be added to this community.');
    } finally {
      setSending(false);
    }
  }, [community, user]);

  const leave = useCallback(async () => {
    if (!community || !user) return;
    setSending(true);
    try {
      await leaveCommunity(community.id, user.uid);
      setMember(false);
      setMessages([]);
    } catch (caught) {
      setError((caught as Error).message || 'You could not leave this community.');
    } finally {
      setSending(false);
    }
  }, [community, user]);

  const send = useCallback(async () => {
    const body = draft.trim();
    if (!body || !community || !activeChannel || !user) return;
    setError(null);
    setSending(true);
    try {
      await sendMessage({
        communityId: community.id,
        channelId: activeChannel,
        uid: user.uid,
        authorName: profile?.displayName ?? '@you',
        authorAvatar: profile?.avatarUrl ?? null,
        body,
      });
      setDraft('');
    } catch (caught) {
      setError((caught as Error).message || 'That message could not be sent.');
    } finally {
      setSending(false);
    }
  }, [draft, community, activeChannel, user, profile]);

  if (loading) {
    return (
      <main id="main" className="container-page py-16">
        <div className="card h-40 animate-pulse" style={{ background: 'var(--surface-2)' }} aria-busy="true" />
      </main>
    );
  }

  if (notFound) {
    return (
      <main id="main" className="container-page py-16">
        <Seo title="Community not found | Ujyalo Connect" description="This community does not exist." path="/connect" noindex />
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          That community does not exist
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-soft)' }}>
          It may have been removed, or the link may be wrong.
        </p>
        <Button asChild className="mt-5">
          <Link to="/connect">Back to Ujyalo Connect</Link>
        </Button>
      </main>
    );
  }

  const channel = channels.find((row) => row.id === activeChannel) ?? channels[0];

  return (
    <>
      <Seo
        title={`${community?.name ?? 'Community'} — Ujyalo Connect`}
        description={community?.description ?? 'A study community on Ujyalo Learn.'}
        path={`/connect/c/${slug}`}
      />

      <main id="main" className="container-page py-8">
        <Link to="/connect" className="inline-flex items-center gap-1.5 text-sm text-muted hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All communities
        </Link>

        <header className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: 'var(--text)' }}>
              {community?.name}
            </h1>
            <p className="mt-1 max-w-2xl text-sm" style={{ color: 'var(--text-soft)' }}>
              {community?.description}
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4" aria-hidden="true" /> {community?.memberCount ?? 0} members
            </span>
            {member && (
              <Button variant="ghost" size="sm" onClick={leave} loading={sending}>
                <LogOut className="h-4 w-4" aria-hidden="true" /> Leave
              </Button>
            )}
          </div>
        </header>

        {error && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm" style={{ borderColor: 'var(--border)', color: 'var(--danger)' }} role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {error}
          </p>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* Channel rail — public, so a visitor can see the shape of a community */}
          <nav aria-label="Channels" className="card h-fit p-2">
            <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Channels</p>
            <ul className="space-y-0.5">
              {channels.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setActiveChannel(row.id)}
                    aria-current={row.id === channel?.id ? 'page' : undefined}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13.5px]"
                    style={
                      row.id === channel?.id
                        ? { background: 'var(--primary-soft)', color: 'var(--primary)', fontWeight: 600 }
                        : { color: 'var(--text-soft)' }
                    }
                  >
                    <Hash className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{row.name}</span>
                    {!member && <Lock className="ml-auto h-3 w-3 shrink-0" aria-hidden="true" />}
                  </button>
                </li>
              ))}
              {channels.length === 0 && (
                <li className="px-2 py-2 text-[13px] text-muted">No channels have been created yet.</li>
              )}
            </ul>
          </nav>

          <section className="card flex min-h-[420px] flex-col p-0" aria-label={channel ? `#${channel.name}` : 'Messages'}>
            <header className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
              <h2 className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--text)' }}>
                <Hash className="h-4 w-4" aria-hidden="true" />
                {channel?.name ?? 'general'}
              </h2>
              {channel?.topic && (
                <p className="mt-0.5 text-xs text-muted">{channel.topic}</p>
              )}
            </header>

            {/* Layer 1: no session at all */}
            {!connected && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
                <DiscordMark size={30} style={{ color: '#5865F2' }} />
                <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                  Messages are for members
                </h3>
                <p className="max-w-sm text-sm" style={{ color: 'var(--text-soft)' }}>
                  Each community&rsquo;s conversation is private to the people in it, so this channel needs an account.
                  Everything public on Ujyalo Learn still works without one.
                </p>
                <Button
                  onClick={() => startSignIn(`/connect/c/${slug}`)}
                  style={{ background: '#5865F2', borderColor: '#5865F2' }}
                >
                  <DiscordMark size={16} /> Continue with Discord
                </Button>
                <Link to="/connect" className="text-xs text-muted underline">
                  Browse other communities first
                </Link>
              </div>
            )}

            {/* Layer 2: signed in, not a member */}
            {connected && member === false && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
                <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                  Join to read and reply
                </h3>
                <p className="max-w-sm text-sm" style={{ color: 'var(--text-soft)' }}>
                  Joining is one click and reversible — you can leave whenever you like.
                </p>
                <Button onClick={join} loading={sending}>
                  Join {community?.name}
                </Button>
              </div>
            )}

            {/* Layer 3: member */}
            {member && (
              <>
                <div className="scroll-thin flex-1 space-y-3 overflow-y-auto px-4 py-4" style={{ maxHeight: '52vh' }}>
                  {feedError && (
                    <p className="rounded-lg border p-3 text-sm" style={{ borderColor: 'var(--border)', color: 'var(--danger)' }} role="alert">
                      {feedError}
                    </p>
                  )}
                  {messages.length === 0 && !feedError && (
                    <p className="py-10 text-center text-sm text-muted">
                      No messages yet. Say hello — you would be the first.
                    </p>
                  )}
                  {messages.map((message) => (
                    <article key={message.id} className="flex items-start gap-2.5">
                      {message.authorAvatar ? (
                        <img src={message.authorAvatar} alt="" width={30} height={30} className="mt-0.5 h-[30px] w-[30px] rounded-full" />
                      ) : (
                        <span
                          className="mt-0.5 inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                          style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                        >
                          {(message.authorName || '?').slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-baseline gap-2">
                          <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                            {message.authorName}
                          </span>
                          <time className="text-[11px] text-muted" dateTime={message.createdAt}>
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </time>
                        </p>
                        <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                          {message.body}
                        </p>
                      </div>
                    </article>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <form
                  className="flex items-end gap-2 border-t p-3"
                  style={{ borderColor: 'var(--border)' }}
                  onSubmit={(event) => {
                    event.preventDefault();
                    void send();
                  }}
                >
                  <label className="sr-only" htmlFor="connect-message">
                    Message #{channel?.name ?? 'general'}
                  </label>
                  <textarea
                    id="connect-message"
                    className="input min-h-[44px] flex-1 resize-none py-2.5"
                    rows={1}
                    maxLength={2000}
                    placeholder={`Message #${channel?.name ?? 'general'}`}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void send();
                      }
                    }}
                  />
                  <Button type="submit" disabled={!draft.trim()} loading={sending} aria-label="Send message">
                    <Send className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </form>
              </>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
