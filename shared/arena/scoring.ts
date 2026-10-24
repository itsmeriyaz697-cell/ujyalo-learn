/**
 * Global Quiz Arena — scoring rules.
 *
 * Pure functions only: no Firestore, no React, no clock of its own. The server
 * calls these to decide what an attempt is worth; the demo mode calls exactly
 * the same code so a student practising offline sees the same numbers they
 * would get online. Because both paths share this file, the two cannot drift.
 *
 * The client is never trusted with the answer key. These functions take the
 * answers, not the browser's opinion of them.
 */

export const ARENA_CATEGORIES = [
  'mathematics',
  'physics',
  'chemistry',
  'biology',
  'english',
  'computer-science',
  'general-knowledge',
  'geography',
  'history',
  'economics',
  'business',
  'technology',
  'logical-reasoning',
  'environmental-science',
  'astronomy',
] as const;

export type ArenaCategory = (typeof ARENA_CATEGORIES)[number];

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const QUIZ_LENGTHS = [5, 10, 20] as const;
export type QuizLength = (typeof QUIZ_LENGTHS)[number];

/** Points per correct answer, by the difficulty of that individual question. */
export const ANSWER_POINTS: Record<Difficulty, number> = {
  easy: 5,
  medium: 10,
  hard: 15,
};

export const COMPLETION_BONUS = 5;
export const PERFECT_BONUS = 20;
export const STREAK_BONUS = 25;
/** A streak bonus lands every seventh consecutive day, not only on day seven. */
export const STREAK_BONUS_EVERY = 7;

export const CATEGORY_META: Record<ArenaCategory, { label: string; icon: string; blurb: string }> = {
  mathematics: { label: 'Mathematics', icon: '➗', blurb: 'Algebra, geometry, arithmetic' },
  physics: { label: 'Physics', icon: '🧲', blurb: 'Motion, forces, energy' },
  chemistry: { label: 'Chemistry', icon: '⚗️', blurb: 'Atoms, reactions, the periodic table' },
  biology: { label: 'Biology', icon: '🧬', blurb: 'Cells, plants, the human body' },
  english: { label: 'English', icon: '📖', blurb: 'Grammar, vocabulary, comprehension' },
  'computer-science': { label: 'Computer Science', icon: '💻', blurb: 'Algorithms, data, programming' },
  'general-knowledge': { label: 'General Knowledge', icon: '🌍', blurb: 'The world at a glance' },
  geography: { label: 'Geography', icon: '🗺️', blurb: 'Countries, rivers, climate' },
  history: { label: 'History', icon: '🏺', blurb: 'Nepal and the wider world' },
  economics: { label: 'Economics', icon: '📈', blurb: 'Markets, money, trade' },
  business: { label: 'Business', icon: '💼', blurb: 'Companies, costs, customers' },
  technology: { label: 'Technology', icon: '⚙️', blurb: 'How modern systems work' },
  'logical-reasoning': { label: 'Logical Reasoning', icon: '🧩', blurb: 'Patterns, sequences, deduction' },
  'environmental-science': { label: 'Environmental Science', icon: '🌱', blurb: 'Ecosystems, climate, conservation' },
  astronomy: { label: 'Astronomy', icon: '🔭', blurb: 'Planets, stars, deep space' },
};

export interface QuestionKey {
  id: string;
  category: ArenaCategory;
  difficulty: Difficulty;
  /** Index of the correct option. Server-side only — never sent before scoring. */
  answerIndex: number;
}

export interface AnswerMap {
  [questionId: string]: number;
}

export interface QuestionResult {
  questionId: string;
  chosenIndex: number | null;
  correctIndex: number;
  correct: boolean;
  difficulty: Difficulty;
  points: number;
}

export interface ScoredAttempt {
  results: QuestionResult[];
  correct: number;
  answered: number;
  total: number;
  /** Points from correct answers only. */
  answerPoints: number;
  completionBonus: number;
  perfectBonus: number;
  /** Points before the streak bonus, which depends on the player's history. */
  attemptPoints: number;
  /** True when every question was answered correctly. */
  perfect: boolean;
}

/**
 * Score an attempt.
 *
 * Rules made explicit because they are the ones students ask about:
 * - a wrong answer scores nothing, and a blank answer scores nothing either;
 * - nothing ever subtracts points;
 * - the completion bonus is paid for finishing, not for winning;
 * - the perfect bonus needs every question answered AND correct, so skipping
 *   the hard ones cannot buy it.
 */
export function scoreAttempt(questions: QuestionKey[], answers: AnswerMap): ScoredAttempt {
  const results: QuestionResult[] = questions.map((question) => {
    const raw = answers[question.id];
    const chosenIndex = Number.isInteger(raw) && raw >= 0 && raw <= 3 ? raw : null;
    const correct = chosenIndex !== null && chosenIndex === question.answerIndex;
    return {
      questionId: question.id,
      chosenIndex,
      correctIndex: question.answerIndex,
      correct,
      difficulty: question.difficulty,
      points: correct ? ANSWER_POINTS[question.difficulty] : 0,
    };
  });

  const correct = results.filter((r) => r.correct).length;
  const answered = results.filter((r) => r.chosenIndex !== null).length;
  const answerPoints = results.reduce((sum, r) => sum + r.points, 0);
  const perfect = results.length > 0 && correct === results.length;
  const completionBonus = COMPLETION_BONUS;
  const perfectBonus = perfect ? PERFECT_BONUS : 0;

  return {
    results,
    correct,
    answered,
    total: results.length,
    answerPoints,
    completionBonus,
    perfectBonus,
    attemptPoints: answerPoints + completionBonus + perfectBonus,
    perfect,
  };
}

/** Bonus paid when the streak reaches a multiple of seven. */
export function streakBonusFor(streak: number): number {
  return streak > 0 && streak % STREAK_BONUS_EVERY === 0 ? STREAK_BONUS : 0;
}

// ---------------------------------------------------------------------------
// Time
// ---------------------------------------------------------------------------

/**
 * Nepal time, not UTC.
 *
 * Students play late at night before an exam; at 00:30 in Kathmandu it is still
 * the previous day in UTC. If the streak used UTC, a student revising at 1am
 * would break their own streak by working hard. Days and weeks therefore follow
 * Asia/Kathmandu (UTC+05:45) everywhere.
 */
export const ARENA_TIME_ZONE = 'Asia/Kathmandu';

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ARENA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** YYYY-MM-DD in Kathmandu. */
export function nepalDayKey(at: Date): string {
  return dayFormatter.format(at);
}

function dayKeyToUtcDate(dayKey: string): Date {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(dayKey: string, days: number): string {
  const date = dayKeyToUtcDate(dayKey);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * ISO week key (2026-W43), with weeks starting Monday — computed on the
 * Kathmandu calendar date so the weekly board turns over at local midnight
 * on Monday rather than at an arbitrary hour on Sunday.
 */
export function weekKeyFor(at: Date): string {
  const dayKey = nepalDayKey(at);
  const date = dayKeyToUtcDate(dayKey);
  const dayOfWeek = date.getUTCDay() || 7; // Monday = 1 … Sunday = 7
  date.setUTCDate(date.getUTCDate() + 4 - dayOfWeek); // nearest Thursday
  const year = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export function previousWeekKey(at: Date): string {
  const dayKey = nepalDayKey(at);
  return weekKeyFor(new Date(dayKeyToUtcDate(addDays(dayKey, -7)).getTime() + 12 * 3600 * 1000));
}

export interface StreakInput {
  lastPlayedDay: string | null;
  streak: number;
}

export interface StreakOutcome {
  streak: number;
  /** True when this attempt started a new day, so the streak can grow. */
  playedToday: boolean;
}

/**
 * Streak for an attempt submitted on `today`.
 *
 * Playing twice in one day never advances the streak and never breaks it. A
 * missed day resets to 1 — the streak is about showing up, and a gap is a gap.
 */
export function nextStreak(previous: StreakInput, today: string): StreakOutcome {
  if (previous.lastPlayedDay === today) {
    return { streak: Math.max(previous.streak, 1), playedToday: false };
  }
  if (previous.lastPlayedDay === addDays(today, -1)) {
    return { streak: Math.max(previous.streak, 0) + 1, playedToday: true };
  }
  return { streak: 1, playedToday: true };
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

export const BADGES = {
  first_quiz: { label: 'First Quiz', description: 'Finished your first quiz', icon: '🎉' },
  quiz_master: { label: 'Quiz Master', description: 'Finished 25 quizzes', icon: '🏅' },
  perfect_score: { label: 'Perfect Score', description: 'Answered every question correctly', icon: '💯' },
  streak_7: { label: '7-Day Streak', description: 'Played seven days in a row', icon: '🔥' },
  streak_30: { label: '30-Day Streak', description: 'Played thirty days in a row', icon: '🌟' },
  math_genius: { label: 'Math Genius', description: '40 correct answers in Mathematics', icon: '➗' },
  science_explorer: { label: 'Science Explorer', description: '30 correct answers across Physics, Chemistry and Biology', icon: '🔬' },
  top_10: { label: 'Top 10 Player', description: 'Reached the global top ten', icon: '🏆' },
  global_champion: { label: 'Global Champion', description: 'Held first place on the global leaderboard', icon: '👑' },
} as const;

export type BadgeId = keyof typeof BADGES;

/** Per-category tally of correct answers, used for the subject badges. */
export interface CategoryTally {
  [category: string]: number;
}

export interface BadgeContext {
  quizzes: number;
  perfectEver: boolean;
  streak: number;
  categoryCorrect: CategoryTally;
  globalRank: number | null;
}

export const SCIENCE_CATEGORIES: ArenaCategory[] = ['physics', 'chemistry', 'biology'];

/** Badges earned given the player's totals *after* this attempt. */
export function evaluateBadges(context: BadgeContext): BadgeId[] {
  const earned: BadgeId[] = [];
  if (context.quizzes >= 1) earned.push('first_quiz');
  if (context.quizzes >= 25) earned.push('quiz_master');
  if (context.perfectEver) earned.push('perfect_score');
  if (context.streak >= 7) earned.push('streak_7');
  if (context.streak >= 30) earned.push('streak_30');
  if ((context.categoryCorrect.mathematics ?? 0) >= 40) earned.push('math_genius');
  const science = SCIENCE_CATEGORIES.reduce((sum, c) => sum + (context.categoryCorrect[c] ?? 0), 0);
  if (science >= 30) earned.push('science_explorer');
  if (context.globalRank !== null && context.globalRank <= 10) earned.push('top_10');
  if (context.globalRank === 1) earned.push('global_champion');
  return earned;
}

// ---------------------------------------------------------------------------
// Fair play
// ---------------------------------------------------------------------------

/** Seconds of thinking time a quiz is given, with a little grace on top. */
export const SECONDS_PER_QUESTION = 45;
export const SUBMIT_GRACE_SECONDS = 60;
/**
 * A submission that arrives faster than this cannot have been read, let alone
 * answered. It is rejected rather than scored, so a script cannot farm points
 * by posting answers instantly.
 */
export const MIN_SECONDS_PER_QUESTION = 2;

export interface AttemptTiming {
  startedAt: number;
  length: number;
  now: number;
}

export type TimingVerdict =
  | { ok: true }
  | { ok: false; reason: 'too_fast' | 'expired' };

export function checkAttemptTiming({ startedAt, length, now }: AttemptTiming): TimingVerdict {
  const elapsedSeconds = (now - startedAt) / 1000;
  if (elapsedSeconds < length * MIN_SECONDS_PER_QUESTION) return { ok: false, reason: 'too_fast' };
  const allowed = length * SECONDS_PER_QUESTION + SUBMIT_GRACE_SECONDS;
  if (elapsedSeconds > allowed) return { ok: false, reason: 'expired' };
  return { ok: true };
}

export function secondsForQuiz(length: number): number {
  return length * SECONDS_PER_QUESTION;
}

/**
 * A handle is what other students see. It is deliberately narrow: no spaces, no
 * dots, no "@", so it can never look like an email address and can never be
 * used to smuggle personal details onto a public leaderboard.
 */
export function normaliseHandle(input: string): string | null {
  const trimmed = input.trim().toLowerCase().replace(/\s+/g, '-');
  if (!/^[a-z0-9][a-z0-9_-]{2,19}$/.test(trimmed)) return null;
  return trimmed;
}

export function percent(correct: number, answered: number): number {
  if (answered <= 0) return 0;
  return Math.round((correct / answered) * 100);
}
