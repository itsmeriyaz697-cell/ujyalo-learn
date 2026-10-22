import type { ActivityEvent, QuizAttempt, StudyTask } from '@/types/domain';
import { todayISO } from './utils';

export interface SubjectStat {
  subjectId: string;
  attempts: number;
  averagePercent: number;
  bestPercent: number;
  lastAttemptAt: string;
}

/**
 * Aggregates real quiz attempts per subject.
 * Progress indicators are estimates based on recorded activity — never mastery.
 */
export function subjectStats(attempts: QuizAttempt[]): SubjectStat[] {
  const bySubject = new Map<string, QuizAttempt[]>();
  for (const attempt of attempts) {
    if (!attempt.subjectId) continue;
    const list = bySubject.get(attempt.subjectId) ?? [];
    list.push(attempt);
    bySubject.set(attempt.subjectId, list);
  }
  return Array.from(bySubject.entries())
    .map(([subjectId, list]) => {
      const sorted = [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const sum = list.reduce((acc, a) => acc + (a.total ? (a.score / a.total) * 100 : 0), 0);
      return {
        subjectId,
        attempts: list.length,
        averagePercent: Math.round(sum / list.length),
        bestPercent: Math.max(...list.map((a) => (a.total ? Math.round((a.score / a.total) * 100) : 0))),
        lastAttemptAt: sorted[sorted.length - 1].createdAt,
      };
    })
    .sort((a, b) => b.attempts - a.attempts);
}

/** Minimum attempts before we say anything about a trend. */
export const MIN_ATTEMPTS_FOR_INSIGHT = 2;

export interface Insights {
  strengths: SubjectStat[];
  focusAreas: SubjectStat[];
  insufficient: SubjectStat[];
  confident: boolean;
}

/**
 * Splits subjects into strengths and focus areas. Subjects with a single
 * attempt are reported as "insufficient" rather than judged from one quiz.
 */
export function learningInsights(attempts: QuizAttempt[]): Insights {
  const stats = subjectStats(attempts);
  const insufficient = stats.filter((s) => s.attempts < MIN_ATTEMPTS_FOR_INSIGHT);
  const eligible = stats.filter((s) => s.attempts >= MIN_ATTEMPTS_FOR_INSIGHT);
  const strengths = eligible.filter((s) => s.averagePercent >= 70).sort((a, b) => b.averagePercent - a.averagePercent);
  const focusAreas = eligible.filter((s) => s.averagePercent < 70).sort((a, b) => a.averagePercent - b.averagePercent);
  return {
    strengths,
    focusAreas,
    insufficient,
    confident: eligible.length >= 2 && attempts.length >= 3,
  };
}

export interface DailyActivity {
  date: string;
  count: number;
  minutes: number;
}

/** Counts real activity events per day for the last `days` days (inclusive of today). */
export function activityByDay(events: ActivityEvent[], days = 14, now = new Date()): DailyActivity[] {
  const result: DailyActivity[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    result.push({ date: todayISO(d), count: 0, minutes: 0 });
  }
  const index = new Map(result.map((r) => [r.date, r]));
  for (const event of events) {
    const key = event.createdAt.slice(0, 10);
    const day = index.get(key);
    if (!day) continue;
    day.count += 1;
    day.minutes += event.minutes ?? 0;
  }
  return result;
}

export function studyMinutesFromTasks(tasks: StudyTask[]): number {
  return tasks.filter((t) => t.completed).reduce((acc, t) => acc + (t.minutes || 0), 0);
}

/** Builds a simple sparkline path for quiz percentages over time. */
export function trendPoints(attempts: QuizAttempt[], width = 320, height = 96): string {
  if (!attempts.length) return '';
  const sorted = [...attempts].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-20);
  const step = sorted.length > 1 ? width / (sorted.length - 1) : 0;
  return sorted
    .map((attempt, i) => {
      const percent = attempt.total ? (attempt.score / attempt.total) * 100 : 0;
      const x = sorted.length === 1 ? width / 2 : i * step;
      const y = height - (percent / 100) * (height - 8) - 4;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}
