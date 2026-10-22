import type { StudyGoal, StudyTask } from '@/types/domain';
import { addDaysISO, todayISO } from './utils';

export interface PlanRecommendation {
  title: string;
  subjectId: string | null;
  goalId: string | null;
  date: string;
  minutes: number;
  topic: string;
  reason: string;
}

export interface PlanInput {
  goals: StudyGoal[];
  subjects: string[];
  availableMinutes: number;
  days?: number;
  startDate?: string;
  examDate?: string | null;
  subjectNames?: Record<string, string>;
}

/**
 * Deterministic, explainable study recommendations.
 *
 * Rules:
 *  - Only goals with a future (or no) target date are considered.
 *  - Study days are spread across `days` starting today.
 *  - Each day gets at most `availableMinutes`, split into focus blocks.
 *  - Exam-date goals get scheduled earlier.
 *
 * This never invents reminders: it only creates draft tasks the student
 * can edit, complete, or reschedule.
 */
export function buildRecommendations(input: PlanInput): PlanRecommendation[] {
  const days = Math.max(1, Math.min(28, input.days ?? 7));
  const start = input.startDate ?? todayISO();
  const minutes = Math.max(10, Math.min(240, input.availableMinutes || 30));
  const activeGoals = input.goals.filter((g) => !g.completed);
  const concerns = activeGoals.length
    ? activeGoals
    : input.subjects.map((s, i) => ({
        id: `subject-${i}`,
        ownerId: '',
        title: `Practise ${input.subjectNames?.[s] ?? s}`,
        subjectId: s,
        targetDate: null,
        completed: false,
        createdAt: new Date().toISOString(),
      }));

  if (!concerns.length) return [];

  const sorted = [...concerns].sort((a, b) => {
    if (!a.targetDate && !b.targetDate) return 0;
    if (!a.targetDate) return 1;
    if (!b.targetDate) return -1;
    return a.targetDate.localeCompare(b.targetDate);
  });

  const recommendations: PlanRecommendation[] = [];
  const perDaySessions = minutes >= 60 ? 2 : 1;
  const sessionMinutes = Math.floor(minutes / perDaySessions);

  for (let dayIndex = 0; dayIndex < days; dayIndex += 1) {
    const date = addDaysISO(start, dayIndex);
    for (let session = 0; session < perDaySessions; session += 1) {
      const goal = sorted[(dayIndex * perDaySessions + session) % sorted.length];
      const subjectId = goal.subjectId ?? input.subjects[(dayIndex + session) % Math.max(1, input.subjects.length)] ?? null;
      const daysUntilExam = goal.targetDate
        ? Math.round((new Date(`${goal.targetDate}T00:00:00Z`).getTime() - new Date(`${date}T00:00:00Z`).getTime()) / 86400000)
        : null;
      recommendations.push({
        title: goal.title,
        subjectId,
        goalId: goal.id.startsWith('subject-') ? null : goal.id,
        date,
        minutes: Math.max(10, sessionMinutes),
        topic: goal.title,
        reason: daysUntilExam !== null && daysUntilExam >= 0
          ? `Scheduled ${daysUntilExam} day${daysUntilExam === 1 ? '' : 's'} before your target date.`
          : 'Spread across your week for steady practice.',
      });
    }
  }
  return recommendations;
}

/** Moves unfinished tasks from before `today` to the next open day. */
export function rescheduleOverdue(tasks: StudyTask[], today = todayISO()): StudyTask[] {
  const overdue = tasks.filter((t) => !t.completed && t.date < today);
  if (!overdue.length) return tasks;
  return tasks.map((task) => {
    if (task.completed || task.date >= today) return task;
    return { ...task, date: today };
  });
}

export function upcomingTasks(tasks: StudyTask[], today = todayISO(), days = 7): StudyTask[] {
  const limit = addDaysISO(today, days);
  return tasks
    .filter((t) => !t.completed && t.date >= today && t.date <= limit)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function tasksForDate(tasks: StudyTask[], date: string): StudyTask[] {
  return tasks.filter((t) => t.date === date).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function goalProgress(goal: StudyGoal, tasks: StudyTask[]): number {
  const linked = tasks.filter((t) => t.goalId === goal.id);
  if (!linked.length) return goal.completed ? 100 : 0;
  return Math.round((linked.filter((t) => t.completed).length / linked.length) * 100);
}
