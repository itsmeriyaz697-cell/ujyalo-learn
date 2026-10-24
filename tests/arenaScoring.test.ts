import { describe, expect, it } from 'vitest';
import {
  ARENA_CATEGORIES,
  ANSWER_POINTS,
  checkAttemptTiming,
  evaluateBadges,
  nepalDayKey,
  nextStreak,
  normaliseHandle,
  percent,
  scoreAttempt,
  streakBonusFor,
  weekKeyFor,
  type QuestionKey,
} from '../shared/arena/scoring';

/**
 * The Arena's scoring rules, tested where they live.
 *
 * Every one of these runs on the server as well as here, so a change that
 * breaks a rule breaks this suite before it reaches a leaderboard.
 */

function keys(spec: Array<[string, 'easy' | 'medium' | 'hard', number]>): QuestionKey[] {
  return spec.map(([id, difficulty, answerIndex]) => ({
    id,
    category: 'mathematics',
    difficulty,
    answerIndex,
  }));
}

describe('scoreAttempt', () => {
  const questions = keys([
    ['q1', 'easy', 0],
    ['q2', 'medium', 2],
    ['q3', 'hard', 3],
  ]);

  it('awards 5, 10 and 15 points by question difficulty', () => {
    const result = scoreAttempt(questions, { q1: 0, q2: 2, q3: 3 });
    expect(result.results.map((r) => r.points)).toEqual([5, 10, 15]);
    expect(result.answerPoints).toBe(30);
  });

  it('adds the completion bonus even when every answer is wrong', () => {
    const result = scoreAttempt(questions, { q1: 1, q2: 1, q3: 1 });
    expect(result.correct).toBe(0);
    expect(result.attemptPoints).toBe(5);
  });

  it('adds the +20 perfect bonus only when everything is right', () => {
    const perfect = scoreAttempt(questions, { q1: 0, q2: 2, q3: 3 });
    expect(perfect.perfect).toBe(true);
    expect(perfect.perfectBonus).toBe(20);
    // 5 + 10 + 15 from the three answers, +5 completion, +20 perfect.
    expect(perfect.attemptPoints).toBe(55);

    const oneWrong = scoreAttempt(questions, { q1: 0, q2: 2, q3: 0 });
    expect(oneWrong.perfect).toBe(false);
    expect(oneWrong.perfectBonus).toBe(0);
  });

  it('cannot buy a perfect score by leaving hard questions blank', () => {
    const result = scoreAttempt(questions, { q1: 0, q2: 2 });
    expect(result.perfect).toBe(false);
    expect(result.results[2].chosenIndex).toBeNull();
    expect(result.correct).toBe(2);
  });

  it('never subtracts points for wrong answers', () => {
    const result = scoreAttempt(questions, { q1: 1, q2: 1, q3: 1 });
    expect(result.results.every((r) => r.points >= 0)).toBe(true);
    expect(result.attemptPoints).toBeGreaterThanOrEqual(0);
  });

  it('ignores answer values that are not a real option', () => {
    const result = scoreAttempt(questions, { q1: 99, q2: -1, q3: 3.5 });
    expect(result.results.every((r) => r.chosenIndex === null)).toBe(true);
    expect(result.answerPoints).toBe(0);
  });

  it('ignores answers for questions that are not in the attempt', () => {
    const result = scoreAttempt(questions, { q1: 0, 'some-other-question': 2 });
    expect(result.total).toBe(3);
    expect(result.correct).toBe(1);
  });

  it('scores an empty attempt as a completion with no answers', () => {
    const result = scoreAttempt(questions, {});
    expect(result.answered).toBe(0);
    expect(result.correct).toBe(0);
    expect(result.perfect).toBe(false);
    expect(result.attemptPoints).toBe(5);
  });

  it('has no perfect bonus for a zero-question attempt', () => {
    const result = scoreAttempt([], {});
    expect(result.perfect).toBe(false);
    expect(result.perfectBonus).toBe(0);
  });
});

describe('streaks', () => {
  it('does not advance twice in one day', () => {
    expect(nextStreak({ lastPlayedDay: '2026-10-24', streak: 6 }, '2026-10-24')).toEqual({
      streak: 6,
      playedToday: false,
    });
  });

  it('advances on a consecutive day', () => {
    expect(nextStreak({ lastPlayedDay: '2026-10-23', streak: 6 }, '2026-10-24')).toEqual({
      streak: 7,
      playedToday: true,
    });
  });

  it('resets to one after a missed day', () => {
    expect(nextStreak({ lastPlayedDay: '2026-10-21', streak: 12 }, '2026-10-24')).toEqual({
      streak: 1,
      playedToday: true,
    });
  });

  it('starts at one for a new player', () => {
    expect(nextStreak({ lastPlayedDay: null, streak: 0 }, '2026-10-24')).toEqual({
      streak: 1,
      playedToday: true,
    });
  });

  it('pays the streak bonus on every seventh day, not only day seven', () => {
    expect(streakBonusFor(0)).toBe(0);
    expect(streakBonusFor(6)).toBe(0);
    expect(streakBonusFor(7)).toBe(25);
    expect(streakBonusFor(8)).toBe(0);
    expect(streakBonusFor(14)).toBe(25);
    expect(streakBonusFor(30)).toBe(0);
  });
});

describe('Nepal time', () => {
  it('counts 1am in Kathmandu as the new day, not the previous UTC day', () => {
    // 2026-10-24T19:30Z is 2026-10-25 01:15 in Kathmandu.
    expect(nepalDayKey(new Date('2026-10-24T19:30:00Z'))).toBe('2026-10-25');
    expect(nepalDayKey(new Date('2026-10-24T18:00:00Z'))).toBe('2026-10-24');
  });

  it('starts a new week on Monday in Kathmandu', () => {
    // Sunday 2026-10-25 in Kathmandu, then Monday 2026-10-26.
    const sunday = weekKeyFor(new Date('2026-10-25T10:00:00Z'));
    const monday = weekKeyFor(new Date('2026-10-26T10:00:00Z'));
    expect(sunday).not.toBe(monday);
    expect(sunday).toBe('2026-W43');
    expect(monday).toBe('2026-W44');
  });

  it('keeps the same week across a Sunday-to-Monday UTC boundary in Kathmandu terms', () => {
    // 2026-10-25T19:00Z is Monday 00:45 in Kathmandu → new week.
    expect(weekKeyFor(new Date('2026-10-25T19:00:00Z'))).toBe('2026-W44');
  });
});

describe('fair play', () => {
  it('rejects a submission faster than a human could read the quiz', () => {
    const verdict = checkAttemptTiming({ startedAt: 1_000_000, length: 20, now: 1_000_000 + 5_000 });
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reason).toBe('too_fast');
  });

  it('accepts an ordinary attempt', () => {
    const verdict = checkAttemptTiming({ startedAt: 1_000_000, length: 5, now: 1_000_000 + 120_000 });
    expect(verdict.ok).toBe(true);
  });

  it('expires an attempt left open far too long', () => {
    const verdict = checkAttemptTiming({ startedAt: 1_000_000, length: 5, now: 1_000_000 + 900_000 });
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reason).toBe('expired');
  });

  it('accepts a username and rejects one that could hide an email', () => {
    expect(normaliseHandle('Bright Falcon')).toBe('bright-falcon');
    expect(normaliseHandle('riya_07')).toBe('riya_07');
    expect(normaliseHandle('riyaz@example.com')).toBeNull();
    expect(normaliseHandle('ab')).toBeNull();
    expect(normaliseHandle('-leading')).toBeNull();
    expect(normaliseHandle('has space.in.it')).toBeNull();
  });
});

describe('badges', () => {
  it('gives the first-quiz badge straight away', () => {
    expect(
      evaluateBadges({ quizzes: 1, perfectEver: false, streak: 1, categoryCorrect: {}, globalRank: 30 }),
    ).toEqual(['first_quiz']);
  });

  it('needs 40 maths answers for Math Genius', () => {
    const base = { quizzes: 3, perfectEver: false, streak: 2, globalRank: 40 };
    expect(evaluateBadges({ ...base, categoryCorrect: { mathematics: 39 } })).not.toContain('math_genius');
    expect(evaluateBadges({ ...base, categoryCorrect: { mathematics: 40 } })).toContain('math_genius');
  });

  it('counts science across physics, chemistry and biology only', () => {
    const base = { quizzes: 3, perfectEver: false, streak: 2, globalRank: 40 };
    expect(
      evaluateBadges({ ...base, categoryCorrect: { physics: 10, chemistry: 10, biology: 10 } }),
    ).toContain('science_explorer');
    expect(
      evaluateBadges({ ...base, categoryCorrect: { physics: 10, chemistry: 10, astronomy: 20 } }),
    ).not.toContain('science_explorer');
  });

  it('marks global champion only for first place', () => {
    const base = { quizzes: 5, perfectEver: true, streak: 9, categoryCorrect: {} };
    expect(evaluateBadges({ ...base, globalRank: 1 })).toEqual(
      expect.arrayContaining(['global_champion', 'top_10']),
    );
    expect(evaluateBadges({ ...base, globalRank: 11 })).not.toContain('top_10');
    expect(evaluateBadges({ ...base, globalRank: null })).not.toContain('top_10');
  });
});

describe('accuracy', () => {
  it('never divides by zero', () => {
    expect(percent(0, 0)).toBe(0);
    expect(percent(3, 4)).toBe(75);
  });
});

describe('the points table', () => {
  it('matches the published rules', () => {
    expect(ANSWER_POINTS).toEqual({ easy: 5, medium: 10, hard: 15 });
  });

  it('covers all fifteen categories', () => {
    expect(ARENA_CATEGORIES).toHaveLength(15);
    expect(new Set(ARENA_CATEGORIES).size).toBe(15);
  });
});
