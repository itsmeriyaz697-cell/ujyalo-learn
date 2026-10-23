import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Flame,
  Layers,
  MailCheck,
  NotebookPen,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Card, CardBody, CardHeader, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, InlineAlert } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthProvider';
import { useData } from '@/features/data/DataProvider';
import { activityByDay, learningInsights, subjectStats } from '@/lib/progress';
import { computeStreak } from '@/lib/streak';
import { goalProgress, upcomingTasks } from '@/lib/planner';
import { formatDate, formatDayLabel, formatRelative } from '@/lib/format';
import { todayISO } from '@/lib/utils';
import { subjectLabel, gradeLabel } from '@shared/labels';
import { getSubject } from '@/config/curriculum';

export default function DashboardPage() {
  const { user, profile, mode, sendVerificationEmail } = useAuth();
  const { conversations, notes, attempts, tasks, goals, activity, loading } = useData();
  const { toast } = useToast();
  const [resending, setResending] = useState(false);

  const name = (profile?.displayName || user?.displayName || 'Student').split(' ')[0];
  const today = todayISO();

  const streak = useMemo(() => computeStreak(activity.map((event) => event.createdAt)), [activity]);
  const week = useMemo(() => activityByDay(activity, 7), [activity]);
  const stats = useMemo(() => subjectStats(attempts), [attempts]);
  const insights = useMemo(() => learningInsights(attempts), [attempts]);
  const dueToday = useMemo(() => tasks.filter((task) => task.date === today && !task.completed), [tasks, today]);
  const nextTasks = useMemo(() => upcomingTasks(tasks, today, 7).slice(0, 3), [tasks, today]);
  const recentNotes = useMemo(() => [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3), [notes]);
  const recentConversations = useMemo(() => conversations.slice(0, 3), [conversations]);
  const recentAttempts = useMemo(() => attempts.slice(0, 3), [attempts]);
  const averageScore = attempts.length
    ? Math.round(attempts.reduce((sum, attempt) => sum + (attempt.total ? (attempt.score / attempt.total) * 100 : 0), 0) / attempts.length)
    : null;

  const subjectName = (id: string | null | undefined) => (id ? getSubject(id)?.name ?? subjectLabel(id) : 'General');

  const recommended = dueToday[0] ?? nextTasks[0] ?? null;

  async function resendVerification() {
    setResending(true);
    try {
      await sendVerificationEmail();
      toast('Verification email sent. Check your inbox.', 'success');
    } catch (error) {
      toast((error as Error).message, 'error');
    } finally {
      setResending(false);
    }
  }

  return (
    <>
      <Seo title="Dashboard" description="Your learning dashboard." path="/app" noindex />

      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
            Namaste, {name}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {profile?.preferences.grade
              ? `${gradeLabel(profile.preferences.grade)} · ${profile.preferences.subjects.length} subject${profile.preferences.subjects.length === 1 ? '' : 's'}`
              : 'Set your grade and subjects in settings to personalise explanations.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild icon={<Sparkles className="h-4 w-4" />}>
            <Link to="/app/tutor">Ask your tutor</Link>
          </Button>
          <Button asChild variant="secondary" icon={<ClipboardList className="h-4 w-4" />}>
            <Link to="/app/quizzes">Practise</Link>
          </Button>
        </div>
      </div>

      {mode === 'local' && (
        <div className="mb-4">
          <InlineAlert tone="warning" title="Local demo mode">
            Accounts and learning data are stored only in this browser — they are not synced or secure. The site owner can
            connect Firebase for real accounts (see README).
          </InlineAlert>
        </div>
      )}

      {mode === 'firebase' && user && !user.emailVerified && (
        <div className="mb-4">
          <InlineAlert
            tone="info"
            title="Verify your email"
            action={
              <Button size="sm" variant="secondary" onClick={resendVerification} loading={resending} icon={<MailCheck className="h-3.5 w-3.5" />}>
                Resend
              </Button>
            }
          >
            Verifying your email helps you recover your account. Everything still works while unverified.
          </InlineAlert>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Learning streak"
          value={`${streak.current} day${streak.current === 1 ? '' : 's'}`}
          hint={streak.current ? `Longest: ${streak.longest} days` : 'Ask a question or finish a quiz to start'}
          icon={<Flame className="h-4 w-4" />}
          tone="gold"
        />
        <StatCard
          label="Average quiz score"
          value={averageScore === null ? '—' : `${averageScore}%`}
          hint={attempts.length ? `${attempts.length} attempt${attempts.length === 1 ? '' : 's'} recorded` : 'No quizzes taken yet'}
          icon={<TrendingUp className="h-4 w-4" />}
          tone="success"
        />
        <StatCard
          label="Saved notes"
          value={notes.length}
          hint={notes.length ? `Latest ${formatRelative(notes[0].updatedAt)}` : 'Save answers from the tutor'}
          icon={<NotebookPen className="h-4 w-4" />}
        />
        <StatCard
          label="Open study tasks"
          value={tasks.filter((task) => !task.completed).length}
          hint={dueToday.length ? `${dueToday.length} due today` : 'Nothing due today'}
          icon={<CalendarCheck className="h-4 w-4" />}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          {/* Today */}
          <Card>
            <CardHeader
              title="Today's learning"
              description={recommended ? 'A small step that keeps your progress moving.' : 'Nothing scheduled — here are quick options.'}
              icon={<Target className="h-4 w-4" />}
              action={
                <Button asChild size="sm" variant="ghost">
                  <Link to="/app/planner">
                    Planner <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              }
            />
            <CardBody>
              {recommended ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                      {recommended.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatDayLabel(recommended.date)} · {recommended.minutes} min · {subjectName(recommended.subjectId)}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="secondary">
                    <Link to="/app/planner">Open task</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    { to: '/app/tutor', icon: BrainCircuit, label: 'Ask one question', body: 'Start a tutoring conversation.' },
                    { to: '/app/quizzes', icon: ClipboardList, label: 'Take a quick quiz', body: '5 questions on a topic.' },
                    { to: '/app/notes', icon: BookOpen, label: 'Review a note', body: 'Re-read and test yourself.' },
                  ].map((item) => (
                    <Link key={item.to} to={item.to} className="card card-hover p-3">
                      <item.icon className="h-4 w-4" style={{ color: 'var(--primary)' }} aria-hidden="true" />
                      <p className="mt-2 text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted">{item.body}</p>
                    </Link>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Continue learning */}
          <Card>
            <CardHeader
              title="Continue learning"
              description="Pick up your recent conversations."
              icon={<BrainCircuit className="h-4 w-4" />}
              action={
                <Button asChild size="sm" variant="ghost">
                  <Link to="/app/tutor">
                    All chats <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              }
            />
            <CardBody>
              {recentConversations.length === 0 ? (
                <EmptyState
                  icon={<BrainCircuit className="h-6 w-6" />}
                  title="No conversations yet"
                  description="Ask your first question — it can be anything you are studying right now."
                  action={
                    <Button asChild size="sm">
                      <Link to="/app/tutor">Ask the AI tutor</Link>
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {recentConversations.map((conversation) => (
                    <li key={conversation.id}>
                      <Link to={`/app/tutor/${conversation.id}`} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                            {conversation.title}
                          </p>
                          <p className="truncate text-[11px] text-muted">
                            {conversation.preview || 'No preview'} · {formatRelative(conversation.updatedAt)}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0" style={{ color: 'var(--muted)' }} aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* Subject progress */}
          <Card>
            <CardHeader
              title="Subject progress"
              description="Based on recorded quiz attempts. Estimates only — not mastery."
              icon={<TrendingUp className="h-4 w-4" />}
              action={
                <Button asChild size="sm" variant="ghost">
                  <Link to="/app/progress">
                    Details <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              }
            />
            <CardBody>
              {stats.length === 0 ? (
                <EmptyState
                  icon={<ClipboardList className="h-6 w-6" />}
                  title="No quiz data yet"
                  description="Take a quiz and your subject averages will appear here."
                  action={
                    <Button asChild size="sm" variant="secondary">
                      <Link to="/app/quizzes">Generate a quiz</Link>
                    </Button>
                  }
                />
              ) : (
                <ul className="space-y-3">
                  {stats.slice(0, 4).map((stat) => (
                    <li key={stat.subjectId}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium" style={{ color: 'var(--text)' }}>
                          {subjectName(stat.subjectId)}
                        </span>
                        <span className="text-muted">
                          {stat.averagePercent}% · {stat.attempts} attempt{stat.attempts === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--surface-3)' }}>
                        <div
                          className="h-full rounded-full transition-[width] duration-500"
                          style={{
                            width: `${stat.averagePercent}%`,
                            background: stat.averagePercent >= 70 ? 'var(--success)' : stat.averagePercent >= 40 ? 'var(--accent)' : 'var(--danger)',
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* Recent quizzes */}
          <Card>
            <CardHeader
              title="Quiz history"
              description="Your most recent practice attempts."
              icon={<ClipboardList className="h-4 w-4" />}
              action={
                <Button asChild size="sm" variant="ghost">
                  <Link to="/app/quizzes">
                    Quizzes <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              }
            />
            <CardBody>
              {recentAttempts.length === 0 ? (
                <p className="py-2 text-sm text-muted">No quiz attempts yet.</p>
              ) : (
                <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {recentAttempts.map((attempt) => (
                    <li key={attempt.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                          {attempt.quizTitle}
                        </p>
                        <p className="text-[11px] text-muted">
                          {subjectName(attempt.subjectId)} · {formatDate(attempt.createdAt, { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <span
                        className="badge shrink-0"
                        style={{
                          background: attempt.percent >= 70 ? 'var(--success-soft)' : attempt.percent >= 40 ? 'var(--accent-soft)' : 'var(--danger-soft)',
                          color: attempt.percent >= 70 ? 'var(--success)' : attempt.percent >= 40 ? 'var(--accent-text)' : 'var(--danger)',
                        }}
                      >
                        {attempt.score}/{attempt.total}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          {/* Streak */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                    <Flame className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                      {streak.current} day streak
                    </p>
                    <p className="text-[11px] text-muted">Longest: {streak.longest} days</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-1.5" aria-label="Activity in the last 7 days">
                {week.map((day) => (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
                    <div
                      className="w-full rounded-md"
                      style={{
                        height: `${Math.max(6, Math.min(32, day.count * 8))}px`,
                        background: day.count ? 'var(--accent)' : 'var(--surface-3)',
                      }}
                      title={`${formatDate(`${day.date}T00:00:00`, { weekday: 'short' })}: ${day.count} activities`}
                    />
                    <span className="text-[9px] uppercase text-muted">
                      {new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' })}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-muted">
                Streaks count days with real activity: a tutor message, quiz attempt, saved note or completed task.
              </p>
            </CardBody>
          </Card>

          {/* Goals */}
          <Card>
            <CardHeader
              title="Study goals"
              description={goals.length ? 'Progress from your study tasks.' : 'Set a goal to focus your practice.'}
              icon={<Target className="h-4 w-4" />}
              action={
                <Button asChild size="sm" variant="ghost">
                  <Link to="/app/planner">Manage</Link>
                </Button>
              }
            />
            <CardBody>
              {goals.length === 0 ? (
                <p className="text-sm text-muted">No goals yet. Add one in the study planner.</p>
              ) : (
                <ul className="space-y-3">
                  {goals.slice(0, 3).map((goal) => {
                    const percent = goalProgress(goal, tasks);
                    return (
                      <li key={goal.id}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="truncate font-medium" style={{ color: 'var(--text)' }}>
                            {goal.title}
                          </span>
                          <span className="ml-2 shrink-0 text-muted">{percent}%</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--surface-3)' }}>
                          <div className="h-full rounded-full" style={{ width: `${percent}%`, background: 'var(--primary)' }} />
                        </div>
                        {goal.targetDate && (
                          <p className="mt-1 text-[10px] text-muted">Target: {formatDate(goal.targetDate)}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader title="What to focus on" description="Based on your recorded quizzes." icon={<CheckCircle2 className="h-4 w-4" />} />
            <CardBody>
              {!insights.confident ? (
                <p className="text-xs leading-relaxed text-muted">
                  {attempts.length === 0
                    ? 'Complete at least two quizzes in a subject before we suggest a focus area. We never judge mastery from one quiz.'
                    : 'Keep practising — we need at least two attempts in a subject to suggest a trend.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {insights.focusAreas.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Needs another look</p>
                      <ul className="mt-1.5 space-y-1 text-[13px]" style={{ color: 'var(--text-soft)' }}>
                        {insights.focusAreas.slice(0, 2).map((stat) => (
                          <li key={stat.subjectId}>
                            {subjectName(stat.subjectId)} · {stat.averagePercent}% average
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {insights.strengths.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Going well</p>
                      <ul className="mt-1.5 space-y-1 text-[13px]" style={{ color: 'var(--text-soft)' }}>
                        {insights.strengths.slice(0, 2).map((stat) => (
                          <li key={stat.subjectId}>
                            {subjectName(stat.subjectId)} · {stat.averagePercent}% average
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader
              title="Recent notes"
              description="Saved explanations and your own notes."
              icon={<BookOpen className="h-4 w-4" />}
              action={
                <Button asChild size="sm" variant="ghost">
                  <Link to="/app/notes">All notes</Link>
                </Button>
              }
            />
            <CardBody>
              {recentNotes.length === 0 ? (
                <p className="text-xs text-muted">No notes yet. Save a tutor answer to start your library.</p>
              ) : (
                <ul className="space-y-2.5">
                  {recentNotes.map((note) => (
                    <li key={note.id}>
                      <Link to="/app/notes" className="block rounded-lg px-1 py-0.5 hover:bg-[color:var(--surface-2)]">
                        <p className="truncate text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                          {note.title}
                        </p>
                        <p className="text-[11px] text-muted">
                          {note.source === 'ai' ? 'AI explanation' : 'Your note'} · {formatRelative(note.updatedAt)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Link to="/app/flashcards" className="card card-hover flex items-center gap-3 p-4">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
              <Layers className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                Revise with flashcards
              </span>
              <span className="block text-[11px] text-muted">Flip cards from your notes or a topic</span>
            </span>
            <ArrowRight className="ml-auto h-4 w-4" style={{ color: 'var(--muted)' }} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {loading && <p className="mt-4 text-center text-xs text-muted">Loading your learning data…</p>}
    </>
  );
}
