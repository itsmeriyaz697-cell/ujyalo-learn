import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BarChart3,
  BookOpen,
  ClipboardList,
  Flame,
  Info,
  Layers,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Card, CardBody, CardHeader, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, InlineAlert, ProgressBar } from '@/components/ui/Feedback';
import { PageHeading } from '@/components/app/PageHeading';
import { useData } from '@/features/data/DataProvider';
import { activityByDay, learningInsights, MIN_ATTEMPTS_FOR_INSIGHT, subjectStats, trendPoints } from '@/lib/progress';
import { computeStreak } from '@/lib/streak';
import { formatDate, formatMinutes } from '@/lib/format';
import { getSubject } from '@/config/curriculum';

export default function ProgressPage() {
  const { attempts, notes, decks, tasks, goals, activity } = useData();

  const subjectName = (id: string | null | undefined) => (id ? getSubject(id)?.name ?? id : 'General');

  const stats = useMemo(() => subjectStats(attempts), [attempts]);
  const insights = useMemo(() => learningInsights(attempts), [attempts]);
  const streak = useMemo(() => computeStreak(activity.map((event) => event.createdAt)), [activity]);
  const days = useMemo(() => activityByDay(activity, 14), [activity]);
  const path = useMemo(
    () => trendPoints([...attempts].slice(0, 20).reverse(), 560, 140),
    [attempts],
  );

  const average = attempts.length
    ? Math.round(attempts.reduce((sum, attempt) => sum + (attempt.total ? (attempt.score / attempt.total) * 100 : 0), 0) / attempts.length)
    : null;
  const best = attempts.length
    ? Math.max(...attempts.map((attempt) => (attempt.total ? Math.round((attempt.score / attempt.total) * 100) : 0)))
    : null;
  const completedTasks = tasks.filter((task) => task.completed);
  const studyMinutes = completedTasks.reduce((sum, task) => sum + task.minutes, 0);

  const achievements = useMemo(() => {
    const list = [
      { id: 'first-quiz', label: 'First quiz', earned: attempts.length >= 1, detail: 'Complete one quiz' },
      { id: 'five-quizzes', label: 'Five quizzes', earned: attempts.length >= 5, detail: 'Complete five quizzes' },
      { id: 'first-note', label: 'First note', earned: notes.length >= 1, detail: 'Save or write one note' },
      { id: 'ten-notes', label: 'Ten notes', earned: notes.length >= 10, detail: 'Build a library of ten notes' },
      { id: 'three-day-streak', label: '3-day streak', earned: streak.longest >= 3, detail: 'Study on three consecutive days' },
      { id: 'first-deck', label: 'First deck', earned: decks.length >= 1, detail: 'Create a flashcard deck' },
      { id: 'goal-setter', label: 'Goal setter', earned: goals.length >= 1, detail: 'Create a study goal' },
      { id: 'planner', label: 'Task finisher', earned: completedTasks.length >= 1, detail: 'Complete a study task' },
    ];
    return list;
  }, [attempts.length, completedTasks.length, decks.length, goals.length, notes.length, streak.longest]);

  return (
    <>
      <Seo title="Progress" description="Your learning progress." path="/app/progress" noindex />
      <PageHeading
        eyebrow="Analytics"
        title="Your progress"
        description="Built from your recorded activity. These indicators are estimates — a single quiz never proves mastery."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Quizzes completed"
          value={attempts.length}
          hint={attempts.length ? `Last: ${formatDate(attempts[0].createdAt, { day: 'numeric', month: 'short' })}` : 'No attempts yet'}
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <StatCard label="Average score" value={average === null ? '—' : `${average}%`} hint={best === null ? 'Take a quiz to see this' : `Best: ${best}%`} icon={<BarChart3 className="h-4 w-4" />} tone="success" />
        <StatCard label="Current streak" value={`${streak.current} day${streak.current === 1 ? '' : 's'}`} hint={`Longest: ${streak.longest} days`} icon={<Flame className="h-4 w-4" />} tone="gold" />
        <StatCard label="Study time (tasks)" value={formatMinutes(studyMinutes)} hint={`${completedTasks.length} completed tasks`} icon={<Target className="h-4 w-4" />} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Quiz scores over time" description="Your last 20 attempts, oldest to newest." icon={<TrendingUp className="h-4 w-4" />} />
            <CardBody>
              {attempts.length === 0 ? (
                <EmptyState
                  icon={<ClipboardList className="h-6 w-6" />}
                  title="No scores yet"
                  description="Take a quiz and your score trend will appear here."
                  action={
                    <Button asChild size="sm">
                      <Link to="/app/quizzes">Take a quiz</Link>
                    </Button>
                  }
                />
              ) : (
                <>
                  <div className="overflow-x-auto scroll-thin">
                    <svg viewBox="0 0 560 140" className="h-40 w-full min-w-[420px]" role="img" aria-label="Line chart of quiz score percentages over time">
                      {[0, 25, 50, 75, 100].map((value) => (
                        <g key={value}>
                          <line x1="0" y1={140 - (value / 100) * 132 - 4} x2="560" y2={140 - (value / 100) * 132 - 4} stroke="var(--border)" strokeWidth="1" strokeDasharray={value === 0 ? '0' : '3 4'} />
                          <text x="2" y={140 - (value / 100) * 132 - 8} fontSize="9" fill="var(--muted)">
                            {value}%
                          </text>
                        </g>
                      ))}
                      <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      {[...attempts].slice(0, 20).reverse().map((attempt, index, list) => {
                        const percent = attempt.total ? (attempt.score / attempt.total) * 100 : 0;
                        const x = list.length === 1 ? 280 : index * (560 / (list.length - 1));
                        const y = 140 - (percent / 100) * 132 - 4;
                        return <circle key={attempt.id} cx={x} cy={y} r="3.5" fill="var(--primary)" />;
                      })}
                    </svg>
                  </div>
                  <p className="mt-2 text-[11px] text-muted">
                    Scores are percentages from your saved attempts. A rising line shows improvement in your practice, not an
                    official predicted grade.
                  </p>
                </>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Subject performance" description="Averages from recorded attempts." icon={<BarChart3 className="h-4 w-4" />} />
            <CardBody>
              {stats.length === 0 ? (
                <p className="text-sm text-muted">No subject data yet.</p>
              ) : (
                <div className="space-y-4">
                  {stats.map((stat) => (
                    <div key={stat.subjectId}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium" style={{ color: 'var(--text)' }}>
                          {subjectName(stat.subjectId)}
                        </span>
                        <span className="text-muted">
                          {stat.averagePercent}% avg · best {stat.bestPercent}% · {stat.attempts} attempt{stat.attempts === 1 ? '' : 's'}
                        </span>
                      </div>
                      <ProgressBar
                        value={stat.averagePercent}
                        className="mt-1.5"
                        tone={stat.averagePercent >= 70 ? 'success' : stat.averagePercent >= 40 ? 'gold' : 'brand'}
                      />
                      {stat.attempts < MIN_ATTEMPTS_FOR_INSIGHT && (
                        <p className="mt-1 text-[10px] text-muted">Too few attempts to read a trend.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Activity (last 14 days)" description="Tutor messages, quizzes, notes, flashcards and completed tasks." icon={<BarChart3 className="h-4 w-4" />} />
            <CardBody>
              <div className="flex h-32 items-end gap-1" aria-label="Bar chart of activity over the last 14 days">
                {days.map((day) => {
                  const max = Math.max(1, ...days.map((item) => item.count));
                  return (
                    <div key={day.date} className="group flex flex-1 flex-col items-center gap-1" title={`${formatDate(`${day.date}T00:00:00`, { day: 'numeric', month: 'short' })}: ${day.count} activities`}>
                      <div
                        className="w-full rounded-t-sm transition-colors"
                        style={{
                          height: `${Math.max(4, (day.count / max) * 100)}%`,
                          background: day.count ? 'var(--primary)' : 'var(--surface-3)',
                          opacity: day.count ? 0.85 : 1,
                        }}
                      />
                      <span className="text-[8px] text-muted">{new Date(`${day.date}T00:00:00`).getDate()}</span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-muted">Study time is only counted from tasks you complete — we do not estimate time from page views.</p>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Strengths & focus" description="Needs at least two attempts per subject." icon={<Target className="h-4 w-4" />} />
            <CardBody>
              {!insights.confident ? (
                <p className="text-xs leading-relaxed text-muted">
                  Keep practising. We need at least two attempts in a subject before commenting on it, and at least three
                  attempts overall before describing strengths. This avoids judging you from one quiz.
                </p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Going well</p>
                    {insights.strengths.length ? (
                      <ul className="mt-1.5 space-y-1 text-[13px]" style={{ color: 'var(--text-soft)' }}>
                        {insights.strengths.map((stat) => (
                          <li key={stat.subjectId}>
                            • {subjectName(stat.subjectId)} — {stat.averagePercent}% average
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-xs text-muted">No subject is consistently above 70% yet.</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Needs another look</p>
                    {insights.focusAreas.length ? (
                      <ul className="mt-1.5 space-y-1 text-[13px]" style={{ color: 'var(--text-soft)' }}>
                        {insights.focusAreas.map((stat) => (
                          <li key={stat.subjectId}>
                            • {subjectName(stat.subjectId)} — {stat.averagePercent}% average
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-xs text-muted">No subject is below 70% across multiple attempts.</p>
                    )}
                  </div>
                  {insights.insufficient.length > 0 && (
                    <p className="text-[10px] leading-relaxed text-muted">
                      Not enough data yet for: {insights.insufficient.map((stat) => subjectName(stat.subjectId)).join(', ')}.
                    </p>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Achievements" description="Earned from real activity only." icon={<Award className="h-4 w-4" />} />
            <CardBody>
              <ul className="grid grid-cols-2 gap-2">
                {achievements.map((achievement) => (
                  <li
                    key={achievement.id}
                    className="rounded-xl border p-2.5"
                    style={{
                      borderColor: achievement.earned ? 'color-mix(in srgb, var(--accent) 55%, transparent)' : 'var(--border)',
                      background: achievement.earned ? 'var(--accent-soft)' : 'transparent',
                      opacity: achievement.earned ? 1 : 0.65,
                    }}
                    title={achievement.detail}
                  >
                    <Award className="h-4 w-4" style={{ color: achievement.earned ? 'var(--accent)' : 'var(--muted)' }} aria-hidden="true" />
                    <p className="mt-1 text-[11px] font-semibold leading-tight" style={{ color: 'var(--text)' }}>
                      {achievement.label}
                    </p>
                    <p className="text-[10px] text-muted">{achievement.earned ? 'Earned' : achievement.detail}</p>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                Keep everything in perspective
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                A quiz is one snapshot of one topic on one day. Sleep, stress and question style all affect scores. Use this
                page to notice patterns, then ask your tutor to explain what you missed.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="secondary">
                  <Link to="/app/quizzes">
                    <ClipboardList className="h-3.5 w-3.5" /> Practise
                  </Link>
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/app/notes">
                    <BookOpen className="h-3.5 w-3.5" /> Review notes
                  </Link>
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/app/flashcards">
                    <Layers className="h-3.5 w-3.5" /> Flashcards
                  </Link>
                </Button>
              </div>
            </CardBody>
          </Card>

          <InlineAlert tone="info">
            <span className="inline-flex items-start gap-1.5">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              We do not rank students against each other. Your progress is private to you.
            </span>
          </InlineAlert>
        </div>
      </div>
    </>
  );
}
