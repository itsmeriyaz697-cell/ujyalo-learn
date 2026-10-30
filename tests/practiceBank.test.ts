import { describe, expect, it } from 'vitest';
import { PRACTICE_QUESTIONS, practiceFor } from '@/features/arena/practiceBank';
import { ARENA_CATEGORIES } from '@shared/arena/scoring';

/**
 * Guards for the signed-out practice bank.
 *
 * The audit found every category holding four questions while the Arena
 * offered a five-question round, so a round was silently cut short. These
 * checks keep that from coming back: a category may never be thinner than the
 * shortest round the UI offers.
 */
const SHORTEST_ROUND = 5;

describe('practice bank', () => {
  it('has unique ids', () => {
    const ids = PRACTICE_QUESTIONS.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only uses categories the Arena actually offers', () => {
    const known = new Set<string>(ARENA_CATEGORIES);
    const unknown = PRACTICE_QUESTIONS.filter((question) => !known.has(question.category));
    expect(unknown.map((question) => `${question.id}:${question.category}`)).toEqual([]);
  });

  it('holds at least a full short round in every category', () => {
    const thin = ARENA_CATEGORIES.map((category) => ({
      category,
      count: PRACTICE_QUESTIONS.filter((question) => question.category === category).length,
    })).filter((row) => row.count < SHORTEST_ROUND);
    expect(thin).toEqual([]);
  });

  it('has four distinct options and an answer inside them', () => {
    const bad = PRACTICE_QUESTIONS.filter(
      (question) =>
        question.options.length !== 4 ||
        new Set(question.options).size !== 4 ||
        question.answerIndex < 0 ||
        question.answerIndex > 3 ||
        !question.explanation.trim(),
    );
    expect(bad.map((question) => question.id)).toEqual([]);
  });

  it('returns as many questions as a category can supply, never more', () => {
    for (const category of ARENA_CATEGORIES) {
      const available = PRACTICE_QUESTIONS.filter((question) => question.category === category).length;
      expect(practiceFor(category, SHORTEST_ROUND)).toHaveLength(Math.min(SHORTEST_ROUND, available));
      expect(practiceFor(category, 1000)).toHaveLength(available);
    }
  });
});
