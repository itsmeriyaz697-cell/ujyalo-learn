import { describe, expect, it } from 'vitest';
import { activityByDay, learningInsights, subjectStats, trendPoints } from '../src/lib/progress';
import type { ActivityEvent, QuizAttempt } from '../src/types/domain';

const attempt = (id: string, subjectId: string, score: number, total: number, createdAt: string): QuizAttempt => ({
  id,
  ownerId: 'u1',
  quizId: `quiz_${id}`,
  quizTitle: 'Quiz',
  subjectId,
  score,
  total,
  percent: Math.round((score / total) * 100),
  answers: [],
  createdAt,
});

describe('subjectStats', () => {
  it('aggregates averages, best scores and attempt counts', () => {
    const stats = subjectStats([
      attempt('1', 'science', 3, 5, '2026-10-01T00:00:00.000Z'),
      attempt('2', 'science', 5, 5, '2026-10-02T00:00:00.000Z'),
      attempt('3', 'mathematics', 2, 5, '2026-10-03T00:00:00.000Z'),
    ]);
    const science = stats.find((item) => item.subjectId === 'science');
    expect(science).toMatchObject({ attempts: 2, averagePercent: 80, bestPercent: 100 });
    const maths = stats.find((item) => item.subjectId === 'mathematics');
    expect(maths?.averagePercent).toBe(40);
  });

  it('returns an empty list without attempts', () => {
    expect(subjectStats([])).toEqual([]);
  });
});

describe('learningInsights', () => {
  it('does not judge a subject from a single attempt', () => {
    const insights = learningInsights([attempt('1', 'science', 5, 5, '2026-10-01T00:00:00.000Z')]);
    expect(insights.strengths).toHaveLength(0);
    expect(insights.focusAreas).toHaveLength(0);
    expect(insights.insufficient).toHaveLength(1);
    expect(insights.confident).toBe(false);
  });

  it('splits subjects once there are enough attempts', () => {
    const insights = learningInsights([
      attempt('1', 'science', 4, 5, '2026-10-01T00:00:00.000Z'),
      attempt('2', 'science', 4, 5, '2026-10-02T00:00:00.000Z'),
      attempt('3', 'mathematics', 1, 5, '2026-10-03T00:00:00.000Z'),
      attempt('4', 'mathematics', 2, 5, '2026-10-04T00:00:00.000Z'),
    ]);
    expect(insights.strengths.map((item) => item.subjectId)).toContain('science');
    expect(insights.focusAreas.map((item) => item.subjectId)).toContain('mathematics');
    expect(insights.confident).toBe(true);
  });
});

describe('activityByDay', () => {
  it('builds a zero-filled window ending today', () => {
    const events: ActivityEvent[] = [
      { id: 'a', ownerId: 'u1', type: 'quiz', label: 'Quiz', createdAt: '2026-10-22T08:00:00.000Z', minutes: 12 },
      { id: 'b', ownerId: 'u1', type: 'note', label: 'Note', createdAt: '2026-10-20T08:00:00.000Z' },
      { id: 'c', ownerId: 'u1', type: 'note', label: 'Old', createdAt: '2026-01-01T08:00:00.000Z' },
    ];
    const days = activityByDay(events, 5, new Date('2026-10-22T12:00:00.000Z'));
    expect(days).toHaveLength(5);
    expect(days[days.length - 1]).toMatchObject({ date: '2026-10-22', count: 1, minutes: 12 });
    expect(days.find((day) => day.date === '2026-10-20')?.count).toBe(1);
    expect(days.reduce((sum, day) => sum + day.count, 0)).toBe(2);
  });
});

describe('trendPoints', () => {
  it('produces a path for the sparkline', () => {
    expect(trendPoints([], 100, 50)).toBe('');
    const path = trendPoints([attempt('1', 'science', 1, 2, '2026-10-01T00:00:00.000Z')], 100, 50);
    expect(path.startsWith('M')).toBe(true);
  });
});
