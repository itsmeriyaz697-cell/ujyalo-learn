import { describe, expect, it } from 'vitest';
import { buildRecommendations, goalProgress, rescheduleOverdue, tasksForDate, upcomingTasks } from '../src/lib/planner';
import type { StudyGoal, StudyTask } from '../src/types/domain';

const goal = (id: string, title: string, targetDate: string | null, subjectId: string | null = 'science'): StudyGoal => ({
  id,
  ownerId: 'u1',
  title,
  subjectId,
  targetDate,
  completed: false,
  createdAt: '2026-10-01T00:00:00.000Z',
});

const task = (id: string, date: string, completed = false, goalId: string | null = null, minutes = 30): StudyTask => ({
  id,
  ownerId: 'u1',
  goalId,
  title: `Task ${id}`,
  subjectId: 'science',
  topic: 'Cells',
  date,
  minutes,
  completed,
  completedAt: completed ? `${date}T10:00:00.000Z` : null,
  createdAt: '2026-10-01T00:00:00.000Z',
});

describe('buildRecommendations', () => {
  it('schedules sessions across the requested days within the daily budget', () => {
    const items = buildRecommendations({
      goals: [goal('g1', 'Prepare for science exam', '2026-11-01')],
      subjects: ['science', 'mathematics'],
      availableMinutes: 60,
      days: 5,
      startDate: '2026-10-22',
    });
    expect(items.length).toBe(10); // 5 days × 2 sessions at 60 min/day
    expect(items[0].date).toBe('2026-10-22');
    expect(items.every((item) => item.minutes >= 10 && item.minutes <= 60)).toBe(true);
  });

  it('falls back to the student’s subjects when there are no goals', () => {
    const items = buildRecommendations({
      goals: [],
      subjects: ['mathematics'],
      availableMinutes: 30,
      days: 3,
      startDate: '2026-10-22',
      subjectNames: { mathematics: 'Mathematics' },
    });
    expect(items.length).toBe(3);
    expect(items[0].title).toContain('Mathematics');
    expect(items[0].goalId).toBeNull();
  });

  it('returns nothing when there are no goals or subjects', () => {
    expect(
      buildRecommendations({ goals: [], subjects: [], availableMinutes: 30, days: 3, startDate: '2026-10-22' }),
    ).toEqual([]);
  });

  it('ignores completed goals', () => {
    const done = { ...goal('g2', 'Finished goal', null), completed: true };
    const items = buildRecommendations({
      goals: [done],
      subjects: ['english'],
      availableMinutes: 30,
      days: 2,
      startDate: '2026-10-22',
    });
    expect(items.every((item) => item.goalId !== 'g2')).toBe(true);
  });
});

describe('task helpers', () => {
  const tasks = [task('t1', '2026-10-20'), task('t2', '2026-10-22', true), task('t3', '2026-10-25'), task('t4', '2026-10-23')];

  it('moves overdue, incomplete tasks to today', () => {
    const moved = rescheduleOverdue(tasks, '2026-10-22');
    expect(moved.find((item) => item.id === 't1')?.date).toBe('2026-10-22');
    expect(moved.find((item) => item.id === 't3')?.date).toBe('2026-10-25');
  });

  it('lists upcoming incomplete tasks in date order', () => {
    const upcoming = upcomingTasks(tasks, '2026-10-22', 3);
    expect(upcoming.map((item) => item.id)).toEqual(['t4', 't3']);
  });

  it('filters tasks for a single date', () => {
    expect(tasksForDate(tasks, '2026-10-22').map((item) => item.id)).toEqual(['t2']);
  });

  it('calculates goal progress from linked tasks only', () => {
    const linked = [task('a', '2026-10-22', true, 'g1'), task('b', '2026-10-23', false, 'g1')];
    expect(goalProgress(goal('g1', 'Goal', null), linked)).toBe(50);
    expect(goalProgress(goal('g9', 'No tasks', null), linked)).toBe(0);
  });
});
