import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Flame, Globe2, History, Trophy } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthProvider';
import { getDashboard, getProfile } from '@/features/arena/api';
import { Avatar, BadgeChip, Loading, RankMedal } from '@/features/arena/components';
import type { PointsEntry, ProfileView, RecentAttempt, SubjectScore } from '@/features/arena/types';
import { CATEGORY_META } from '../../../shared/arena/scoring';

/**
 * One page for both views.
 *
 * `/global-quiz/me` shows your own history, points ledger and subject breakdown.
 * `/global-quiz/player/:handle` shows what anyone may see about another student:
 * username, flag, scores, badges. No email, no account id, no school, no history
 * of individual questions — a public profile is not a window into someone's work.
 */
export default function ArenaProfilePage() {
  const { handle } = useParams<{ handle: string }>();
  const { user, getToken, loading: authLoading } = useAuth();
  const isSelf = !handle;

  const [view, setView] = useState<ProfileView | null>(null);
  const [recent, setRecent] = useState<RecentAttempt[]>([]);
  const [points, setPoints] = useState<PointsEntry[]>([]);
  const [subjects, setSubjects] = useState<SubjectScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isSelf) {
        if (!user) {
          setLoading(false);
          setError('Sign in to see your Arena profile.');
          return;
        }
        const token = await getToken();
        const dashboard = await getDashboard(token);
        if (!dashboard.configured || dashboard.needsProfile || !dashboard.player) {
          setNeedsProfile(true);
          setLoading(false);
          return;
        }
        setView({
          configured: true,
          player: dashboard.player,
          globalRank: dashboard.globalRank ?? null,
          nepalRank: dashboard.nepalRank ?? null,
        });
        setRecent(dashboard.recent ?? []);
        setPoints(dashboard.points ?? []);
        setSubjects(dashboard.subjects ?? []);
      } else if (handle) {
        const profile = await getProfile(handle);
        // Unconfigured deployment: the API answers honestly rather than 404ing,
        // so say what is actually true instead of rendering an empty profile.
        if ((profile as unknown as { configured?: boolean }).configured === false) {
          setError('The Arena database is not connected on this deployment, so player profiles are unavailable.');
          return;
        }
        if (!profile?.player) {
          setError('That player could not be found.');
          return;
        }
        setView(profile);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [getToken, handle, isSelf, user]);

  useEffect(() => {
    if (authLoading) return;
    void load();
  }, [authLoading, load]);

  if (loading) return <Loading label="Loading profile…" />;

  if (needsProfile) {
    return (
      <div className="container-page max-w-lg py-16 text-center">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          You do not have an Arena username yet
        </h1>
        <p className="mt-2 text-[13px] text-muted">Pick one on the Arena page and your profile will exist here.</p>
        <Link to="/global-quiz" className="mt-4 inline-block">
          <Button>Go to the Arena</Button>
        </Link>
      </div>
    );
  }

  if (error || !view || !view.player) {
    return (
      <div className="container-page max-w-lg py-16 text-center">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Profile unavailable
        </h1>
        <p className="mt-2 text-[13px] text-muted">{error ?? 'That player could not be found.'}</p>
        <Link to="/global-quiz/leaderboard" className="mt-4 inline-block">
          <Button variant="secondary">Back to the leaderboard</Button>
        </Link>
      </div>
    );
  }

  const { player } = view;
  const answered = recent.reduce((sum, attempt) => sum + attempt.total, 0);

  return (
    <div className="container-page max-w-4xl py-10">
      <Seo
        title={`${player.handle} — Global Quiz Arena | Ujyalo Learn`}
        description={`${player.handle} from ${player.country} has ${player.totalPoints} Arena points.`}
        path={isSelf ? '/global-quiz/me' : `/global-quiz/player/${player.handle}`}
        noindex
      />

      <Link to="/global-quiz" className="inline-flex items-center gap-1 text-[13px] font-medium" style={{ color: 'var(--primary)' }}>
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to the Arena
      </Link>

      <div className="card mt-4 flex flex-wrap items-center gap-4 p-5">
        <Avatar handle={player.handle} size="lg" />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold" style={{ color: 'var(--text)' }}>
            {player.handle}
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--muted)' }}>
            <span aria-hidden="true">{player.flag}</span> {player.country}
            {isSelf && ' · this is your profile'}
          </p>
        </div>
        <div className="ml-auto flex gap-5 text-right">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              Points
            </p>
            <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--text)' }}>
              {player.totalPoints.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              Streak
            </p>
            <p className="flex items-center justify-end gap-1 text-lg font-bold tabular-nums" style={{ color: 'var(--text)' }}>
              <Flame className="h-4 w-4" style={{ color: 'var(--accent-text)' }} aria-hidden="true" />
              {player.streak}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Global rank" value={view.globalRank ? <RankMedal rank={view.globalRank} /> : '—'} icon={<Globe2 className="h-4 w-4" />} />
        <Fact label="Nepal rank" value={view.nepalRank ? <RankMedal rank={view.nepalRank} /> : '—'} icon={<Trophy className="h-4 w-4" />} />
        <Fact label="Quizzes completed" value={player.quizzes} icon={<History className="h-4 w-4" />} />
        <Fact label="Accuracy" value={`${player.accuracy}%`} icon={<Trophy className="h-4 w-4" />} />
      </div>

      <section className="mt-8">
        <h2 className="text-[16px] font-semibold" style={{ color: 'var(--text)' }}>
          Achievements
        </h2>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>
          {player.badges.length
            ? `${player.badges.length} badge${player.badges.length > 1 ? 's' : ''} earned.`
            : 'No badges yet. The first quiz earns one immediately.'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(view.badgesAll ?? player.badges.map((b) => ({ ...b, earned: true }))).map((badge) => (
            <BadgeChip key={badge.id} badge={badge} earned={badge.earned} />
          ))}
        </div>
      </section>

      {isSelf && (
        <>
          <section className="mt-8">
            <h2 className="text-[16px] font-semibold" style={{ color: 'var(--text)' }}>
              Points history
            </h2>
            <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>
              Every entry is one scored attempt. The ledger is append-only — nothing here can be edited.
            </p>
            {points.length ? (
              <div className="card mt-3 overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                      <th scope="col" className="px-4 py-2 font-semibold">When</th>
                      <th scope="col" className="px-4 py-2 font-semibold">Quiz</th>
                      <th scope="col" className="px-4 py-2 text-right font-semibold">Score</th>
                      <th scope="col" className="px-4 py-2 text-right font-semibold">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {points.map((entry) => (
                      <tr key={entry.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                        <td className="px-4 py-2 text-[12.5px]" style={{ color: 'var(--muted)' }}>
                          {entry.at ? new Date(entry.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                        </td>
                        <td className="px-4 py-2" style={{ color: 'var(--text-soft)' }}>
                          {CATEGORY_META[entry.category]?.label ?? entry.category}
                          {entry.daily && <span className="badge badge-neutral ml-2">Daily</span>}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums" style={{ color: 'var(--text-soft)' }}>
                          {entry.correct}/{entry.length}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold tabular-nums" style={{ color: 'var(--success)' }}>
                          +{entry.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-3 text-[13px]" style={{ color: 'var(--muted)' }}>
                Nothing yet. Your first scored quiz will appear here.
              </p>
            )}
          </section>

          <section className="mt-8">
            <h2 className="text-[16px] font-semibold" style={{ color: 'var(--text)' }}>
              Recently played
            </h2>
            {recent.length ? (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {recent.map((attempt) => (
                  <li key={attempt.attemptId} className="card flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                        {CATEGORY_META[attempt.category]?.label ?? attempt.category}
                        {attempt.daily && <span className="badge badge-neutral ml-2">Daily</span>}
                      </p>
                      <p className="text-[11.5px]" style={{ color: 'var(--muted)' }}>
                        {attempt.correct}/{attempt.total} correct · {attempt.at ? new Date(attempt.at).toLocaleDateString('en-GB') : ''}
                      </p>
                    </div>
                    <span className="text-[13px] font-semibold tabular-nums" style={{ color: 'var(--success)' }}>
                      +{attempt.points}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[13px]" style={{ color: 'var(--muted)' }}>
                No finished quizzes yet.
              </p>
            )}
          </section>

          <section className="mt-8">
            <h2 className="text-[16px] font-semibold" style={{ color: 'var(--text)' }}>
              Subject-wise performance
            </h2>
            <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>
              Correct answers per subject, all time. The bar shows how each subject compares to your strongest one.
            </p>
            <ul className="card mt-3 divide-y p-4" style={{ borderColor: 'var(--border)' }}>
              {(() => {
                const max = Math.max(1, ...subjects.map((s) => s.correct));
                return subjects.map((subject) => (
                  <li key={subject.category} className="flex items-center gap-3 py-2">
                    <span className="w-6 text-center" aria-hidden="true">{subject.icon}</span>
                    <span className="w-40 shrink-0 truncate text-[12.5px]" style={{ color: 'var(--text-soft)' }}>
                      {subject.label}
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--surface-3)' }}>
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${(subject.correct / max) * 100}%`, background: 'var(--primary)' }}
                      />
                    </span>
                    <span className="w-8 text-right text-[12px] tabular-nums" style={{ color: 'var(--muted)' }}>
                      {subject.correct}
                    </span>
                  </li>
                ));
              })()}
            </ul>
            <p className="mt-2 text-[12px]" style={{ color: 'var(--muted)' }}>
              {answered > 0 ? `Across ${answered} recent questions.` : 'Play a few quizzes to fill this in.'}
            </p>
          </section>
        </>
      )}

      {!isSelf && (
        <p className="mt-8 rounded-xl border p-3 text-[12.5px] leading-relaxed" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
          This is everything another student can see about you: a username, a country and your scores. Ujyalo Learn never
          shows email addresses, account identifiers or individual answers on a public profile.
        </p>
      )}
    </div>
  );
}

function Fact({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
          {label}
        </p>
        <span style={{ color: 'var(--primary)' }} aria-hidden="true">{icon}</span>
      </div>
      <p className="mt-1.5 text-xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
        {value}
      </p>
    </div>
  );
}
