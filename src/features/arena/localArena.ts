/**
 * Local Arena — practice (signed out) and demo mode (no database).
 *
 * Two situations, one engine:
 *
 *   Practice: a visitor who has not signed up can play a real quiz and see
 *   real explanations. Nothing is saved, nothing is ranked, no points are
 *   claimed. This keeps the site's rule that the first action never needs an
 *   account.
 *
 *   Demo: the deployment has no Arena database configured. Everything is kept
 *   in this browser's localStorage and labelled as such everywhere it appears.
 *   It is never merged with, compared to, or displayed as the global board.
 *
 * Scoring reuses shared/arena/scoring.ts, the same module the server uses, so
 * practice points match what a real attempt would have earned. Nothing here is
 * ever sent to the server as if it were authoritative.
 */
import {
  ARENA_CATEGORIES,
  CATEGORY_META,
  nepalDayKey,
  nextStreak,
  scoreAttempt,
  streakBonusFor,
  type ArenaCategory,
  type Difficulty,
} from '../../../shared/arena/scoring';
import { practiceFor, type PracticeQuestion } from './practiceBank';
import type { AnsweredQuestion, QuizQuestion, SubmitResult } from './types';

const STORAGE_KEY = 'ujyalo.arena.demo.v1';

export interface LocalProfile {
  handle: string;
  country: string;
  totalPoints: number;
  quizzes: number;
  correct: number;
  answered: number;
  streak: number;
  bestStreak: number;
  lastPlayedDay: string | null;
  history: Array<{
    id: string;
    category: ArenaCategory;
    length: number;
    correct: number;
    points: number;
    at: number;
    daily: boolean;
  }>;
}

export interface LocalAttempt {
  id: string;
  category: ArenaCategory;
  length: number;
  daily: boolean;
  startedAt: number;
  questions: PracticeQuestion[];
}

function emptyProfile(): LocalProfile {
  return {
    handle: '',
    country: 'NP',
    totalPoints: 0,
    quizzes: 0,
    correct: 0,
    answered: 0,
    streak: 0,
    bestStreak: 0,
    lastPlayedDay: null,
    history: [],
  };
}

export function loadLocalProfile(): LocalProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProfile();
    const parsed = JSON.parse(raw) as Partial<LocalProfile>;
    return { ...emptyProfile(), ...parsed, history: parsed.history ?? [] };
  } catch {
    return emptyProfile();
  }
}

export function saveLocalProfile(profile: LocalProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    /* storage full or blocked — practice still works, it just will not persist */
  }
}

export function clearLocalProfile(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * A practice quiz: real questions, no points claimed.
 *
 * `length` used to be capped at 4 here, which meant asking for a five-question
 * round delivered "Question 1 of 4". The cap is gone; the only limit now is how
 * many questions the category actually holds, and the caller reports the real
 * number back to the student instead of silently shortening the round.
 */
export const SECONDS_PER_QUESTION = 45;

export function startPractice(category: ArenaCategory, length: number, daily = false): LocalAttempt {
  const questions = practiceFor(category, length);
  return {
    // Prefixed so it can never be mistaken for a server attempt id.
    id: `practice_${Date.now().toString(36)}`,
    category,
    length: questions.length,
    daily,
    startedAt: Date.now(),
    questions,
  };
}

/**
 * Score a practice quiz locally.
 *
 * The caller decides what to do with the result: practice mode shows it and
 * discards it; demo mode adds it to the local profile. `applyPoints` is
 * explicit so a signed-out visitor can never accidentally accumulate a score
 * that looks like a real one.
 */
export function submitPractice(attempt: LocalAttempt, answers: Record<string, number>): SubmitResult {
  const scored = scoreAttempt(
    attempt.questions.map((q) => ({
      id: q.id,
      category: q.category,
      difficulty: q.difficulty as Difficulty,
      answerIndex: q.answerIndex,
    })),
    answers,
  );

  const answered: AnsweredQuestion[] = scored.results.map((result) => {
    const question = attempt.questions.find((q) => q.id === result.questionId)!;
    return {
      questionId: result.questionId,
      prompt: question.prompt,
      options: question.options,
      chosenIndex: result.chosenIndex,
      correctIndex: result.correctIndex,
      correct: result.correct,
      explanation: question.explanation,
      points: result.points,
    };
  });

  return {
    attemptId: attempt.id,
    pointsThisAttempt: scored.attemptPoints,
    answerPoints: scored.answerPoints,
    completionBonus: scored.completionBonus,
    perfectBonus: scored.perfectBonus,
    streakBonus: 0,
    correct: scored.correct,
    total: scored.total,
    answers: answered,
    totals: { totalPoints: 0, quizzes: 0, accuracy: 0, streak: 0 },
    newBadges: [],
    duplicate: false,
  };
}

/** Demo mode only: fold a finished practice quiz into the local profile. */
export function applyToLocalProfile(profile: LocalProfile, attempt: LocalAttempt, result: SubmitResult): LocalProfile {
  const today = nepalDayKey(new Date());
  const streak = nextStreak({ lastPlayedDay: profile.lastPlayedDay, streak: profile.streak }, today);
  const bonus = streak.playedToday ? streakBonusFor(streak.streak) : 0;
  const points = result.pointsThisAttempt + bonus;

  const updated: LocalProfile = {
    ...profile,
    totalPoints: profile.totalPoints + points,
    quizzes: profile.quizzes + 1,
    correct: profile.correct + result.correct,
    answered: profile.answered + result.total,
    streak: streak.streak,
    bestStreak: Math.max(profile.bestStreak, streak.streak),
    lastPlayedDay: today,
    history: [
      {
        id: attempt.id,
        category: attempt.category,
        length: result.total,
        correct: result.correct,
        points,
        at: Date.now(),
        daily: attempt.daily,
      },
      ...profile.history,
    ].slice(0, 50),
  };
  saveLocalProfile(updated);
  return updated;
}

export function categoryOptions(): Array<{ id: ArenaCategory; label: string; icon: string; blurb: string }> {
  return ARENA_CATEGORIES.map((id) => ({ id, ...CATEGORY_META[id] }));
}

export function toQuizQuestions(attempt: LocalAttempt): QuizQuestion[] {
  return attempt.questions.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    options: q.options,
    difficulty: q.difficulty,
  }));
}
