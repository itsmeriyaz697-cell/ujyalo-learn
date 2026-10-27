import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  Flame,
  Info,
  ListChecks,
  Lock,
  Medal,
  Play,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { seoFor } from '@/config/seoPages';
import { Section, SectionHeading } from '@/components/marketing/Section';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { getHome } from '@/features/arena/api';
import { loadLocalProfile, type LocalProfile } from '@/features/arena/localArena';
import {
  Avatar,
  BadgeChip,
  CategoryTile,
  DemoNotice,
  Loading,
  Podium,
  RankMedal,
  StatTile,
} from '@/features/arena/components';
import { HandleForm } from '@/features/arena/HandleForm';
import type { ArenaHome, ArenaMeta, Difficulty } from '@/features/arena/types';
import { CATEGORY_META, type ArenaCategory } from '../../../shared/arena/scoring';
import { PageContent } from '@/components/marketing/PageContent';

const LENGTH_LABELS: Record<number, string> = { 5: '5 questions', 10: '10 questions', 20: '20 questions' };
const DIFFICULTY_LABELS: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

export default function ArenaHomePage() {
  const { user, getToken, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [home, setHome] = useState<ArenaHome | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [local, setLocal] = useState<LocalProfile | null>(null);

  const [category, setCategory] = useState<ArenaCategory>('mathematics');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [length, setLength] = useState(5);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = user ? await getToken() : null;
      const data = await getHome(token);
      setHome(data);
      if (!data.configured) setLocal(loadLocalProfile());
    } catch (err) {
      // "storage is not configured" is not a failure a visitor caused, and a red
      // alert saying "the Arena could not complete that request" reads as a bug
      // on a first visit. The demo notice already explains the state.
      const message = (err as Error).message;
      setError(/not configured/i.test(message) ? null : message);
    } finally {
      setLoading(false);
    }
  }, [getToken, user]);

  useEffect(() => {
    if (authLoading) return;
    void load();
  }, [load, authLoading]);

  const meta: ArenaMeta | null = home?.meta ?? null;
  const configured = home?.configured ?? false;
  const signedIn = Boolean(user);
  const needsProfile = Boolean(home?.needsProfile);

  const practiceHref = useMemo(
    () => `/global-quiz/play?practice=1&category=${category}&length=${length}`,
    [category, length],
  );

  const startHref = useMemo(
    () => `/global-quiz/play?category=${category}&difficulty=${difficulty}&length=${length}`,
    [category, difficulty, length],
  );

  /**
   * Starting a quiz never sends anyone to a sign-up form.
   *
   * A visitor who presses Play has already decided what they want; interrupting
   * them to ask for an account is the wall round 20 removed. They play the quiz
   * they asked for, as a guest round, and are told at the end — once the score
   * exists and there is something real to save — that an account keeps it.
   */
  const handleStart = () => {
    if (signedIn && needsProfile) {
      document.getElementById('arena-setup')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast('Pick a username first — it is how you appear on the leaderboard.', 'info');
      return;
    }
    navigate(startHref);
  };

  const categories = meta?.categories ?? [];
  const challenge = home?.challenge;
  const top = home?.top ?? [];
  const me = home?.me ?? null;
  const localStats = local;

  return (
    <>
      <Seo {...seoFor('/global-quiz')} />

      {/* Hero */}
      <section
        className="border-b"
        style={{
          borderColor: 'var(--border)',
          background:
            'radial-gradient(1100px 380px at 12% -10%, color-mix(in srgb, var(--primary) 16%, transparent), transparent 65%), var(--bg)',
        }}
      >
        <div className="container-page py-10 sm:py-14">
          <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="eyebrow flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Global Quiz Arena
              </p>
              <h1 className="section-title mt-2">Welcome to Global Quiz Arena</h1>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
                Challenge yourself. Earn points. Become a champion. Fifteen subjects, three difficulty levels, and a
                leaderboard that runs from Kathmandu to the rest of the world.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button size="lg" icon={<Play className="h-4 w-4" aria-hidden="true" />} onClick={handleStart}>
                  Start a quiz
                </Button>
                {signedIn ? (
                  <Link to="/global-quiz/leaderboard">
                    <Button variant="secondary" size="lg" icon={<Trophy className="h-4 w-4" aria-hidden="true" />}>
                      Leaderboard
                    </Button>
                  </Link>
                ) : (
                  <Link to={practiceHref}>
                    <Button variant="secondary" size="lg">
                      Try one free, no account
                    </Button>
                  </Link>
                )}
              </div>

              <p className="mt-3 text-[12.5px]" style={{ color: 'var(--muted)' }}>
                {signedIn
                  ? 'Every quiz is scored on the server, so your points mean something.'
                  : 'Practice quizzes show real explanations but do not earn points or a rank. Create a free account when you want your score kept.'}
              </p>
            </div>

            {/* Today's featured challenge */}
            <div className="card p-5">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" style={{ color: 'var(--primary)' }} aria-hidden="true" />
                <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
                  Today&rsquo;s featured challenge
                </h2>
              </div>
              {challenge ? (
                <>
                  <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                    The same five questions for everyone today: {CATEGORY_META[challenge.category].label}, five questions.
                    Everyone who plays it today sees the identical set, so the score is a fair comparison.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="badge badge-brand">{CATEGORY_META[challenge.category].label}</span>
                    <span className="badge badge-neutral capitalize">{challenge.difficulty}</span>
                  </div>
                  <Link to={signedIn ? '/global-quiz/play?daily=1' : '/login?next=%2Fglobal-quiz%2Fplay%3Fdaily%3D1'} className="mt-4 block">
                    <Button fullWidth icon={<Target className="h-4 w-4" aria-hidden="true" />}>
                      {signedIn ? 'Play the daily challenge' : 'Sign in to play the daily'}
                    </Button>
                  </Link>
                </>
              ) : (
                <p className="mt-2 text-[13px] text-muted">The challenge appears once the Arena is connected.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {loading && <Loading label="Opening the Arena…" />}

      {!loading && !configured && (
        <div className="container-page pt-6">
          <DemoNotice>
            The Arena database is not connected on this deployment, so this page is running in{' '}
            <strong>local demo mode</strong>: your score is kept in this browser only, and there is no global board to
            join. Nothing on this page is presented as a real global ranking.
          </DemoNotice>
        </div>
      )}

      {!loading && error && (
        <div className="container-page pt-6">
          <div className="rounded-xl border p-3 text-[13px]" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
            {error}{' '}
            <button type="button" className="underline" onClick={() => void load()}>
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      {!loading && (
        <div className="container-page pt-8">
          {signedIn && me ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile label="Questions answered" value={me.quizzes ? '—' : 0} hint="Across your finished quizzes" icon={<ListChecks className="h-4 w-4" />} />
              <StatTile label="My total points" value={me.totalPoints.toLocaleString()} icon={<Trophy className="h-4 w-4" />} />
              <StatTile
                label="Current rank"
                value={me.globalRank ? `#${me.globalRank}` : 'Unranked'}
                hint={me.globalRank ? 'Global leaderboard' : 'Finish a quiz to be ranked'}
                icon={<Medal className="h-4 w-4" />}
              />
              <StatTile label="Daily streak" value={`${me.streak} ${me.streak === 1 ? 'day' : 'days'}`} icon={<Flame className="h-4 w-4" />} />
            </div>
          ) : signedIn && needsProfile ? (
            <div id="arena-setup" className="card p-5">
              <h2 className="text-[16px] font-semibold" style={{ color: 'var(--text)' }}>
                Choose your Arena username
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                This is the only name other students will see. Your email address is never stored here and never shown
                on a profile or leaderboard. You can pick your country too — it decides whether you appear on the Nepal
                board.
              </p>
              <HandleForm
                countries={meta?.countries ?? []}
                onDone={() => void load()}
              />
            </div>
          ) : (
            <div className="card flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-[16px] font-semibold" style={{ color: 'var(--text)' }}>
                  Your points need somewhere to live
                </h2>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  A free account keeps your score, streak and badges, and puts you on the Nepal and global boards. Until
                  then you can still play practice quizzes — they just are not saved.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link to={`/signup?next=${encodeURIComponent(startHref)}`}>
                  <Button>Create free account</Button>
                </Link>
                <Link to={`/login?next=${encodeURIComponent(startHref)}`}>
                  <Button variant="secondary">Log in</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Demo mode local stats */}
          {!configured && localStats && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile label="Local points (demo)" value={localStats.totalPoints} hint="This browser only" icon={<Trophy className="h-4 w-4" />} />
              <StatTile label="Local quizzes (demo)" value={localStats.quizzes} hint="This browser only" icon={<ListChecks className="h-4 w-4" />} />
              <StatTile label="Local streak (demo)" value={localStats.streak} hint="Days in a row" icon={<Flame className="h-4 w-4" />} />
              <StatTile
                label="Local accuracy (demo)"
                value={localStats.answered ? `${Math.round((localStats.correct / localStats.answered) * 100)}%` : '—'}
                hint="Correct answers"
                icon={<Target className="h-4 w-4" />}
              />
            </div>
          )}
        </div>
      )}

      {/* Quiz setup */}
      <Section className="!pt-10">
        <SectionHeading
          eyebrow="Play"
          title="Pick a subject, then a difficulty"
          description="Questions are drawn from a fixed bank of hand-checked questions — not generated on the fly — so a leaderboard score reflects what you know."
        />

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {(categories.length ? categories : Object.entries(CATEGORY_META).map(([id, m]) => ({ id: id as ArenaCategory, ...m, questions: { total: 0, easy: 0, medium: 0, hard: 0 } }))).map((item) => (
            <CategoryTile
              key={item.id}
              id={item.id}
              selected={category === item.id}
              onSelect={() => setCategory(item.id)}
            />
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="card p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              Difficulty
            </p>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Difficulty">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDifficulty(value)}
                  aria-pressed={difficulty === value}
                  className="rounded-lg border px-3 py-2 text-[13px] font-medium transition"
                  style={
                    difficulty === value
                      ? { borderColor: 'var(--primary)', background: 'var(--primary-soft)', color: 'var(--primary)' }
                      : { borderColor: 'var(--border)', color: 'var(--text-soft)' }
                  }
                >
                  {DIFFICULTY_LABELS[value]}
                  <span className="ml-1.5 text-[11px]" style={{ color: 'var(--muted)' }}>
                    +{meta?.points[value] ?? (value === 'easy' ? 5 : value === 'medium' ? 10 : 15)}/answer
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              Length
            </p>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Quiz length">
              {[5, 10, 20].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLength(value)}
                  aria-pressed={length === value}
                  className="rounded-lg border px-3 py-2 text-[13px] font-medium transition"
                  style={
                    length === value
                      ? { borderColor: 'var(--primary)', background: 'var(--primary-soft)', color: 'var(--primary)' }
                      : { borderColor: 'var(--border)', color: 'var(--text-soft)' }
                  }
                >
                  {LENGTH_LABELS[value]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button size="lg" icon={<Play className="h-4 w-4" aria-hidden="true" />} onClick={handleStart}>
            Play {CATEGORY_META[category].label} · {DIFFICULTY_LABELS[difficulty]} · {length} questions
          </Button>
          <Link to={practiceHref}>
            <Button variant="ghost">Practise without saving</Button>
          </Link>
        </div>
        {!signedIn && (
          <p className="mt-2 flex items-center gap-1.5 text-[12.5px]" style={{ color: 'var(--muted)' }}>
            <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Points and rank need an account. Practice does not.
          </p>
        )}
      </Section>

      {/* Top players */}
      <Section tone="surface" className="!py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <SectionHeading eyebrow="Leaderboard" title="Top three right now" />
            <div className="mt-5">
              <Podium rows={top} />
            </div>
            <Link to="/global-quiz/leaderboard" className="mt-5 inline-flex items-center gap-1 text-[13px] font-medium" style={{ color: 'var(--primary)' }}>
              See the full leaderboard <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div>
            <SectionHeading eyebrow="Last week" title="Weekly champions" />
            {home?.champions?.length ? (
              <ul className="mt-5 space-y-2">
                {home.champions.map((row) => (
                  <li key={row.handle} className="card flex items-center gap-3 p-3">
                    <RankMedal rank={row.rank} />
                    <Avatar handle={row.handle} size="sm" />
                    <Link to={`/global-quiz/player/${row.handle}`} className="truncate text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                      {row.handle}
                    </Link>
                    <span className="ml-auto text-[12px] tabular-nums" style={{ color: 'var(--muted)' }}>
                      {row.points.toLocaleString()} pts
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                Weekly champions appear here once a full week has been played. Weekly points reset every Monday at
                midnight Nepal time; lifetime points are never reset.
              </p>
            )}
          </div>
        </div>
      </Section>

      {/* How to earn points */}
      <Section className="!py-12">
        <SectionHeading eyebrow="Scoring" title="How to earn points" />
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <caption className="sr-only">Points awarded for each achievement</caption>
              <tbody>
                {[
                  ['Correct easy answer', '+5'],
                  ['Correct medium answer', '+10'],
                  ['Correct hard answer', '+15'],
                  ['Finish a quiz', '+5'],
                  ['Perfect score', '+20'],
                  ['7-day streak', '+25'],
                ].map(([label, value]) => (
                  <tr key={label} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                    <th scope="row" className="px-4 py-2.5 text-left font-normal" style={{ color: 'var(--text-soft)' }}>
                      {label}
                    </th>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums" style={{ color: 'var(--success)' }}>
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 text-[13px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
            <p className="flex gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} aria-hidden="true" />
              <span>
                Points come from correct answers only. A wrong answer scores zero — nothing is ever subtracted, so a hard
                quiz can only help you.
              </span>
            </p>
            <p className="flex gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} aria-hidden="true" />
              <span>
                The streak bonus arrives every seventh consecutive day, not only on day seven. A missed day starts the
                streak again at one.
              </span>
            </p>
            <p className="flex gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} aria-hidden="true" />
              <span>
                Days and weeks follow Nepal time (UTC+5:45), so revising at 1am counts for the day you are actually
                studying.
              </span>
            </p>
          </div>
        </div>
      </Section>

      {/* Badges */}
      <Section tone="surface" className="!py-12">
        <SectionHeading
          eyebrow="Achievements"
          title="Badges you can earn"
          description="Badges are awarded by the server when you meet the condition — never granted from the browser."
        />
        <div className="mt-5 flex flex-wrap gap-2">
          {(meta?.badges ?? []).map((badge) => (
            <BadgeChip key={badge.id} badge={badge} />
          ))}
        </div>
      </Section>

      {/* Rules */}
      <Section className="!py-12">
        <SectionHeading eyebrow="Fair play" title="Rules of the Arena" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Answers are scored on the server', 'Your browser sends what you picked; the server decides what it is worth. Editing anything in dev tools changes nothing.'],
            ['One reward per attempt', 'Submitting the same quiz twice returns the first result. No quiz can be paid out twice.'],
            ['Refreshing earns nothing', 'Points are only written when a quiz is scored, never on page load.'],
            ['No impossible submissions', 'A quiz submitted faster than a person could read it is rejected rather than scored.'],
            ['One username, chosen once', 'Usernames cannot be swapped later, so a name at the top of the board is really yours.'],
            ['Your email is never public', 'Profiles show a username, a flag and your scores. Nothing else.'],
          ].map(([title, body]) => (
            <div key={title} className="card p-4">
              <h3 className="text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>
                {title}
              </h3>
              <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <PageContent path="/global-quiz" />
    </>
  );
}
