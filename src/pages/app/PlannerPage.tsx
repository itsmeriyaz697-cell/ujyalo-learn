import { useMemo, useState } from 'react';
import {
  BellOff,
  CalendarCheck,
  CalendarDays,
  Check,
  Clock,
  Flag,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { EmptyState, InlineAlert, ProgressBar } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { PageHeading } from '@/components/app/PageHeading';
import { useAuth } from '@/features/auth/AuthProvider';
import { useData } from '@/features/data/DataProvider';
import { SUBJECTS, getSubject } from '@/config/curriculum';
import { buildRecommendations, goalProgress, rescheduleOverdue, tasksForDate, upcomingTasks } from '@/lib/planner';
import { formatDate, formatDayLabel, formatMinutes } from '@/lib/format';
import { addDaysISO, makeId, todayISO } from '@/lib/utils';
import type { StudyGoal, StudyTask } from '@/types/domain';

export default function PlannerPage() {
  const { user, profile } = useAuth();
  const { goals, tasks, saveGoal, removeGoal, saveTask, removeTask, logActivity } = useData();
  const { toast } = useToast();

  const today = todayISO();
  const [taskModal, setTaskModal] = useState(false);
  const [goalModal, setGoalModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<StudyTask | null>(null);
  const [deleteGoalTarget, setDeleteGoalTarget] = useState<StudyGoal | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [taskDraft, setTaskDraft] = useState({
    title: '',
    subjectId: profile?.preferences.subjects[0] ?? 'mathematics',
    date: today,
    minutes: 30,
    goalId: '',
  });
  const [goalDraft, setGoalDraft] = useState({ title: '', subjectId: '', targetDate: addDaysISO(today, 14) });

  const subjectName = (id: string | null | undefined) => (id ? getSubject(id)?.name ?? id : 'General');

  const overdue = useMemo(() => tasks.filter((task) => !task.completed && task.date < today), [tasks, today]);
  const todayTasks = useMemo(() => tasksForDate(tasks, today), [tasks, today]);
  const upcoming = useMemo(() => upcomingTasks(tasks, today, 14).filter((task) => task.date !== today), [tasks, today]);
  const completedCount = tasks.filter((task) => task.completed).length;

  const groupedUpcoming = useMemo(() => {
    const groups = new Map<string, StudyTask[]>();
    for (const task of upcoming) {
      const list = groups.get(task.date) ?? [];
      list.push(task);
      groups.set(task.date, list);
    }
    return Array.from(groups.entries());
  }, [upcoming]);

  const recommendations = useMemo(
    () =>
      buildRecommendations({
        goals,
        subjects: profile?.preferences.subjects ?? [],
        availableMinutes: profile?.preferences.dailyMinutes ?? 30,
        days: 5,
        subjectNames: Object.fromEntries(SUBJECTS.map((subject) => [subject.id, subject.name])),
      }),
    [goals, profile?.preferences.dailyMinutes, profile?.preferences.subjects],
  );

  async function addTask(taskLike: Omit<StudyTask, 'id' | 'ownerId' | 'createdAt' | 'completed'>) {
    if (!user) return;
    const task: StudyTask = {
      ...taskLike,
      id: makeId('task'),
      ownerId: user.uid,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    await saveTask(task);
  }

  async function createTask() {
    if (!taskDraft.title.trim()) {
      toast('Give the task a short title.', 'error');
      return;
    }
    setSaving(true);
    try {
      await addTask({
        title: taskDraft.title.trim(),
        subjectId: taskDraft.subjectId || null,
        topic: taskDraft.title.trim(),
        date: taskDraft.date,
        minutes: Math.max(5, taskDraft.minutes),
        goalId: taskDraft.goalId || null,
        completedAt: null,
      });
      toast('Task added to your plan', 'success');
      setTaskModal(false);
      setTaskDraft({ ...taskDraft, title: '' });
    } catch (error) {
      toast((error as Error).message || 'Could not add the task.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function createGoal() {
    if (!user) return;
    if (!goalDraft.title.trim()) {
      toast('Give the goal a short title.', 'error');
      return;
    }
    setSaving(true);
    try {
      const goal: StudyGoal = {
        id: makeId('goal'),
        ownerId: user.uid,
        title: goalDraft.title.trim(),
        subjectId: goalDraft.subjectId || null,
        targetDate: goalDraft.targetDate || null,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      await saveGoal(goal);
      toast('Goal created', 'success');
      setGoalModal(false);
      setGoalDraft({ title: '', subjectId: '', targetDate: addDaysISO(today, 14) });
    } catch (error) {
      toast((error as Error).message || 'Could not create the goal.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task: StudyTask) {
    const completed = !task.completed;
    try {
      await saveTask({
        ...task,
        completed,
        completedAt: completed ? new Date().toISOString() : null,
      });
      if (completed) {
        logActivity('task', `Completed: ${task.title}`, { subjectId: task.subjectId, minutes: task.minutes });
        toast('Task completed', 'success');
      }
    } catch {
      toast('Could not update the task.', 'error');
    }
  }

  async function handleReschedule() {
    const next = rescheduleOverdue(tasks, today);
    const moved = next.filter((task, index) => task.date !== tasks[index]?.date);
    if (!moved.length) return;
    setSaving(true);
    try {
      await Promise.all(moved.map((task) => saveTask(task)));
      toast(`Moved ${moved.length} overdue task${moved.length === 1 ? '' : 's'} to today`, 'success');
    } catch {
      toast('Some tasks could not be moved.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      if (deleteTaskTarget) {
        await removeTask(deleteTaskTarget.id);
        toast('Task deleted', 'success');
        setDeleteTaskTarget(null);
      }
      if (deleteGoalTarget) {
        await removeGoal(deleteGoalTarget.id);
        toast('Goal deleted', 'success');
        setDeleteGoalTarget(null);
      }
    } catch {
      toast('Could not delete the item.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  const TaskRow = ({ task }: { task: StudyTask }) => (
    <li className="flex items-start gap-2.5 py-2.5">
      <button
        type="button"
        onClick={() => toggleTask(task)}
        aria-label={task.completed ? `Mark ${task.title} as not done` : `Mark ${task.title} as done`}
        aria-pressed={task.completed}
        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors"
        style={{
          borderColor: task.completed ? 'var(--success)' : 'var(--border-strong)',
          background: task.completed ? 'var(--success)' : 'transparent',
        }}
      >
        {task.completed && <Check className="h-3.5 w-3.5 text-white" aria-hidden="true" />}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className="text-[13px] font-medium"
          style={{ color: task.completed ? 'var(--muted)' : 'var(--text)', textDecoration: task.completed ? 'line-through' : 'none' }}
        >
          {task.title}
        </p>
        <p className="text-[11px] text-muted">
          {subjectName(task.subjectId)} · {task.minutes} min
          {task.date !== today && ` · ${formatDayLabel(task.date)}`}
          {task.date < today && !task.completed && <span style={{ color: 'var(--danger)' }}> · overdue</span>}
        </p>
      </div>
      <button type="button" className="btn-icon !h-8 !w-8" onClick={() => setDeleteTaskTarget(task)} aria-label={`Delete ${task.title}`}>
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );

  return (
    <>
      <Seo title="Study planner" description="Plan study tasks and track goals." path="/app/planner" noindex />
      <PageHeading
        eyebrow="Plan"
        title="Study planner"
        description="Turn goals into small daily tasks. Reschedule anything you miss without losing progress."
        actions={
          <>
            <Button variant="secondary" onClick={() => setGoalModal(true)} icon={<Flag className="h-4 w-4" />}>
              New goal
            </Button>
            <Button onClick={() => setTaskModal(true)} icon={<Plus className="h-4 w-4" />}>
              Add task
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader
              title={`Today — ${formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'short' })}`}
              description={`${todayTasks.filter((task) => task.completed).length}/${todayTasks.length} done · ${formatMinutes(todayTasks.filter((task) => task.completed).reduce((sum, task) => sum + task.minutes, 0))} studied`}
              icon={<CalendarCheck className="h-4 w-4" />}
              action={
                overdue.length > 0 ? (
                  <Button size="sm" variant="secondary" onClick={handleReschedule} loading={saving} icon={<RotateCcw className="h-3.5 w-3.5" />}>
                    Move {overdue.length} overdue
                  </Button>
                ) : undefined
              }
            />
            <CardBody>
              {todayTasks.length === 0 ? (
                <EmptyState
                  icon={<CalendarDays className="h-6 w-6" />}
                  title="Nothing planned for today"
                  description="Add a small task — 20 focused minutes is enough to keep momentum."
                  action={
                    <Button size="sm" onClick={() => setTaskModal(true)}>
                      Add today's task
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {todayTasks.map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Coming up" description="The next two weeks." icon={<CalendarDays className="h-4 w-4" />} />
            <CardBody>
              {groupedUpcoming.length === 0 ? (
                <p className="text-sm text-muted">No upcoming tasks yet.</p>
              ) : (
                <div className="space-y-4">
                  {groupedUpcoming.map(([date, list]) => (
                    <div key={date}>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{formatDayLabel(date)}</p>
                      <ul className="mt-1 divide-y" style={{ borderColor: 'var(--border)' }}>
                        {list.map((task) => (
                          <TaskRow key={task.id} task={task} />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <div className="flex items-start gap-2 rounded-xl border p-3 text-xs leading-relaxed text-muted" style={{ borderColor: 'var(--border)' }}>
            <BellOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              Ujyalo Learn does not send push or email reminders — no notification service is configured. Come back to this
              page (or your dashboard) to see what is planned.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Goals"
              description={`${goals.filter((goal) => !goal.completed).length} active · ${completedCount} tasks completed`}
              icon={<Target className="h-4 w-4" />}
            />
            <CardBody>
              {goals.length === 0 ? (
                <EmptyState
                  icon={<Target className="h-6 w-6" />}
                  title="No goals yet"
                  description="Example: “Prepare for the science exam” with a target date."
                  action={
                    <Button size="sm" variant="secondary" onClick={() => setGoalModal(true)}>
                      Create a goal
                    </Button>
                  }
                />
              ) : (
                <ul className="space-y-3">
                  {goals.map((goal) => {
                    const percent = goalProgress(goal, tasks);
                    return (
                      <li key={goal.id} className="rounded-xl border p-3" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                              {goal.title}
                            </p>
                            <p className="text-[11px] text-muted">
                              {subjectName(goal.subjectId)}
                              {goal.targetDate ? ` · target ${formatDate(goal.targetDate, { day: 'numeric', month: 'short' })}` : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="btn-icon !h-8 !w-8"
                            onClick={() => setDeleteGoalTarget(goal)}
                            aria-label={`Delete goal ${goal.title}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <ProgressBar value={percent} className="mt-2" />
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[10px] text-muted">{percent}% of linked tasks done</span>
                          <button
                            type="button"
                            className="text-[11px] font-semibold"
                            style={{ color: 'var(--primary)' }}
                            onClick={() => {
                              setTaskDraft({
                                title: goal.title,
                                subjectId: goal.subjectId ?? taskDraft.subjectId,
                                date: today,
                                minutes: 30,
                                goalId: goal.id,
                              });
                              setTaskModal(true);
                            }}
                          >
                            Add task
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Suggested sessions"
              description={`Based on your goals and ${profile?.preferences.dailyMinutes ?? 30} min/day.`}
              icon={<Sparkles className="h-4 w-4" />}
              action={
                recommendations.length > 0 ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      setSaving(true);
                      try {
                        for (const item of recommendations.slice(0, 5)) {
                          await addTask({
                            title: item.title,
                            subjectId: item.subjectId,
                            topic: item.topic,
                            date: item.date,
                            minutes: item.minutes,
                            goalId: item.goalId,
                            completedAt: null,
                          });
                        }
                        toast('Added 5 suggested sessions to your plan', 'success');
                      } catch {
                        toast('Some sessions could not be added.', 'error');
                      } finally {
                        setSaving(false);
                      }
                    }}
                    loading={saving}
                  >
                    Add top 5
                  </Button>
                ) : undefined
              }
            />
            <CardBody>
              {recommendations.length === 0 ? (
                <p className="text-xs leading-relaxed text-muted">
                  Add a goal or choose subjects in Settings to get study suggestions.
                </p>
              ) : (
                <ul className="space-y-2">
                  {recommendations.slice(0, 5).map((item, index) => (
                    <li key={`${item.date}-${index}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-[color:var(--surface-2)]">
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-medium" style={{ color: 'var(--text)' }}>
                          {item.title}
                        </p>
                        <p className="text-[10px] text-muted">
                          {formatDayLabel(item.date)} · {item.minutes} min · {subjectName(item.subjectId)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn-icon !h-7 !w-7"
                        aria-label={`Add ${item.title} to plan`}
                        onClick={async () => {
                          await addTask({ ...item, completedAt: null });
                          toast('Session added', 'success');
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-[10px] leading-relaxed text-muted">
                Suggestions are simple scheduling rules, not AI. You stay in control of what gets added.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="mt-4">
        <InlineAlert tone="info" title="Plans are flexible">
          Missing a task is normal. Use “Move overdue” to bring unfinished work into today, or delete tasks that are no
          longer relevant. Your progress charts only count what you actually complete or practise.
        </InlineAlert>
      </div>

      <Modal
        open={taskModal}
        onClose={() => setTaskModal(false)}
        title="Add a study task"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTaskModal(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={createTask} loading={saving} icon={<Plus className="h-4 w-4" />}>
              Add task
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="What will you study?"
            value={taskDraft.title}
            onChange={(event) => setTaskDraft({ ...taskDraft, title: event.target.value })}
            placeholder="e.g. Revise trigonometric identities"
            maxLength={160}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Subject"
              value={taskDraft.subjectId}
              onChange={(event) => setTaskDraft({ ...taskDraft, subjectId: event.target.value })}
            >
              <option value="">No subject</option>
              {SUBJECTS.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </Select>
            <Select
              label="Linked goal"
              value={taskDraft.goalId}
              onChange={(event) => setTaskDraft({ ...taskDraft, goalId: event.target.value })}
            >
              <option value="">No goal</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Date"
              type="date"
              value={taskDraft.date}
              min={addDaysISO(today, -30)}
              onChange={(event) => setTaskDraft({ ...taskDraft, date: event.target.value })}
            />
            <Input
              label="Minutes"
              type="number"
              min={5}
              max={240}
              step={5}
              value={taskDraft.minutes}
              onChange={(event) => setTaskDraft({ ...taskDraft, minutes: Number(event.target.value) })}
              hint={`${Math.round(taskDraft.minutes)} minutes`}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={goalModal}
        onClose={() => setGoalModal(false)}
        title="Create a study goal"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setGoalModal(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={createGoal} loading={saving} icon={<Flag className="h-4 w-4" />}>
              Create goal
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Goal"
            value={goalDraft.title}
            onChange={(event) => setGoalDraft({ ...goalDraft, title: event.target.value })}
            placeholder="e.g. Score above 80% in the science unit test"
            maxLength={160}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Subject"
              optional
              value={goalDraft.subjectId}
              onChange={(event) => setGoalDraft({ ...goalDraft, subjectId: event.target.value })}
            >
              <option value="">No specific subject</option>
              {SUBJECTS.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </Select>
            <Input
              label="Target date"
              optional
              type="date"
              value={goalDraft.targetDate}
              min={today}
              onChange={(event) => setGoalDraft({ ...goalDraft, targetDate: event.target.value })}
            />
          </div>
          <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Target dates are for planning only. Ujyalo Learn does not send reminders.
          </p>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTaskTarget)}
        title="Delete this task?"
        description={`“${deleteTaskTarget?.title ?? ''}” will be removed from your plan.`}
        confirmLabel="Delete task"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTaskTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteGoalTarget)}
        title="Delete this goal?"
        description={`“${deleteGoalTarget?.title ?? ''}” will be deleted. Linked tasks stay in your plan but are no longer tied to the goal.`}
        confirmLabel="Delete goal"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteGoalTarget(null)}
      />

    </>
  );
}
