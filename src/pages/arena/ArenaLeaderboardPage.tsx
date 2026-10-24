import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Info, Medal } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { SectionHeading } from '@/components/marketing/Section';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthProvider';
import { getLeaderboard } from '@/features/arena/api';
import { DemoNotice, LeaderboardRows, Loading, RankMedal } from '@/features/arena/components';
import type { LeaderboardPage as Page } from '@/features/arena/types';

type Scope = 'global' | 'nepal' | 'weekly';

const TABS: Array<{ id: Scope; label: string; hint: string }> = [
  { id: 'global', label: 'Global', hint: 'Lifetime points from every country' },
  { id: 'nepal', label: 'Nepal', hint: 'Lifetime points from players in Nepal' },
  { id: 'weekly', label: 'Weekly', hint: 'This week only — resets Monday, Nepal time' },
];

export default function ArenaLeaderboardPage() {
  const { user, getToken } = useAuth();
  const [scope, setScope] = useState<Scope>('global');
  const [data, setData] = useState<Page | null>(null);
  const [rows, setRows] = useState<Page['rows']>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (nextScope: Scope, offset = 0) => {
      if (offset === 0) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const token = user ? await getToken() : null;
        const page = await getLeaderboard(nextScope, offset, token);
        if ((page as unknown as { configured?: boolean }).configured === false) {
          setConfigured(false);
          setData(null);
          setRows([]);
          return;
        }
        setConfigured(true);
        setData(page);
        setRows((previous) => (offset === 0 ? page.rows : [...previous, ...page.rows]));
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [getToken, user],
  );

  useEffect(() => {
    void load(scope, 0);
  }, [load, scope]);

  return (
    <div className="container-page py-10">
      <Seo {...seoForLeaderboard()} />

      <Link to="/global-quiz" className="inline-flex items-center gap-1 text-[13px] font-medium" style={{ color: 'var(--primary)' }}>
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to the Arena
      </Link>

      <div className="mt-4">
        <SectionHeading as="h1" eyebrow="Global Quiz Arena" title="Leaderboard" description="Every rank here is calculated from scores the server verified. Nothing on this page is estimated." />
      </div>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Leaderboard scope">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={scope === tab.id}
            onClick={() => setScope(tab.id)}
            className="rounded-lg border px-3 py-2 text-[13px] font-medium transition"
            style={
              scope === tab.id
                ? { borderColor: 'var(--primary)', background: 'var(--primary-soft)', color: 'var(--primary)' }
                : { borderColor: 'var(--border)', color: 'var(--text-soft)' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!configured && (
        <div className="mt-6">
          <DemoNotice>
            The Arena database is not connected, so there is no leaderboard to show. Rather than inventing sample
            students, this page stays empty.
          </DemoNotice>
        </div>
      )}

      {configured && (
        <>
          <p className="mt-2 text-[12.5px]" style={{ color: 'var(--muted)' }}>
            {TABS.find((t) => t.id === scope)?.hint}
            {scope === 'weekly' && data?.weekKey ? ` · ${data.weekKey}` : ''}
          </p>

          {loading ? (
            <Loading label="Counting the scores…" />
          ) : error ? (
            <div className="mt-6 rounded-xl border p-3 text-[13px]" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
              {error}{' '}
              <button type="button" className="underline" onClick={() => void load(scope, 0)}>
                Try again
              </button>
            </div>
          ) : (
            <>
              {data?.you && (
                <div className="card mt-5 flex flex-wrap items-center gap-4 p-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                      Your rank
                    </p>
                    <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
                      {data.you.rank ? <RankMedal rank={data.you.rank} /> : 'Unranked'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                      Your points
                    </p>
                    <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
                      {data.you.points.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                      Accuracy
                    </p>
                    <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
                      {data.you.accuracy}%
                    </p>
                  </div>
                  {data.you.rank > 0 && !data.you.inTop && (
                    <p className="ml-auto max-w-xs text-[12px]" style={{ color: 'var(--muted)' }}>
                      You are outside the loaded page — this is where you stand right now.
                    </p>
                  )}
                  {!user && (
                    <p className="ml-auto max-w-xs text-[12px]" style={{ color: 'var(--muted)' }}>
                      <Link to="/signup?next=%2Fglobal-quiz" className="underline">
                        Create an account
                      </Link>{' '}
                      to appear here.
                    </p>
                  )}
                </div>
              )}

              <div className="card mt-5 p-4">
                {rows.length ? (
                  <LeaderboardRows rows={rows} />
                ) : (
                  <div className="py-8 text-center">
                    <Medal className="mx-auto h-6 w-6" style={{ color: 'var(--muted)' }} aria-hidden="true" />
                    <p className="mt-2 text-[14px] font-medium" style={{ color: 'var(--text)' }}>
                      No scores on this board yet
                    </p>
                    <p className="mx-auto mt-1 max-w-sm text-[12.5px]" style={{ color: 'var(--muted)' }}>
                      {scope === 'nepal'
                        ? 'Nobody playing from Nepal has finished a quiz yet. The first one takes this spot.'
                        : scope === 'weekly'
                          ? 'This week has just started. Weekly points reset every Monday at midnight Nepal time.'
                          : 'The board is new and empty. Finish a quiz and your name goes here.'}
                    </p>
                    <Link to="/global-quiz" className="mt-3 inline-block">
                      <Button size="sm">Play a quiz</Button>
                    </Link>
                  </div>
                )}
              </div>

              {data?.hasMore && (
                <div className="mt-4 text-center">
                  <Button variant="secondary" loading={loadingMore} onClick={() => void load(scope, Number(data.nextCursor ?? rows.length))}>
                    Load more players
                  </Button>
                </div>
              )}

              <p className="mt-5 flex items-start gap-2 text-[12px]" style={{ color: 'var(--muted)' }}>
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Weekly points reset to zero each Monday without touching lifetime totals. A player with no points is not
                ranked at all rather than being shown in first place on an empty board.
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}

function seoForLeaderboard() {
  return {
    title: 'Global Quiz Arena leaderboard | Ujyalo Learn',
    description: 'Global, Nepal and weekly student quiz leaderboards on Ujyalo Learn.',
    path: '/global-quiz/leaderboard',
    noindex: true,
  };
}
