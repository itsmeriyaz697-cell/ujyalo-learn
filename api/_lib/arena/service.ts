/**
 * Global Quiz Arena — server-side service.
 *
 * Everything a student could otherwise fake lives here: the answer key, the
 * points total, the streak, the badges and the rank. The browser sends answers
 * and receives a verdict; it never gets to decide what its own score is.
 */
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import {
  ANSWER_POINTS,
  ARENA_CATEGORIES,
  BADGES,
  CATEGORY_META,
  COMPLETION_BONUS,
  DIFFICULTIES,
  PERFECT_BONUS,
  QUIZ_LENGTHS,
  checkAttemptTiming,
  evaluateBadges,
  nepalDayKey,
  nextStreak,
  normaliseHandle,
  percent,
  scoreAttempt,
  secondsForQuiz,
  streakBonusFor,
  weekKeyFor,
  type ArenaCategory,
  type Difficulty,
  type AnswerMap,
  type BadgeId,
  type CategoryTally,
} from '../../../shared/arena/scoring.js';
import { QUESTION_BANK, bankSummary, pickQuestions, questionById } from './bank.js';

const COL = {
  players: 'arenaPlayers',
  handles: 'arenaHandles',
  attempts: 'arenaAttempts',
  points: 'arenaPoints',
  daily: 'arenaDaily',
  rate: 'arenaRate',
  badges: 'arenaBadges',
} as const;

/** Countries offered on the profile form. Deliberately short and explicit. */
export const COUNTRIES: Array<{ code: string; name: string; flag: string }> = [
  { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'BT', name: 'Bhutan', flag: '🇧🇹' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'OT', name: 'Somewhere else', flag: '🌐' },
];

const COUNTRY_BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

export function flagFor(code: string | undefined): string {
  return COUNTRY_BY_CODE.get(code ?? '')?.flag ?? '🌐';
}

export interface PlayerDoc {
  uid: string;
  handle: string;
  handleLower: string;
  country: string;
  totalPoints: number;
  weekKey: string;
  weekPoints: number;
  quizzes: number;
  correct: number;
  answered: number;
  streak: number;
  bestStreak: number;
  lastPlayedDay: string | null;
  perfectEver: boolean;
  badges: BadgeId[];
  categoryCorrect: CategoryTally;
  createdAt: unknown;
  updatedAt: unknown;
}

/** Public shape — note the absence of any account identifier. */
export interface PublicPlayer {
  handle: string;
  country: string;
  flag: string;
  totalPoints: number;
  quizzes: number;
  accuracy: number;
  streak: number;
  badges: Array<{ id: BadgeId; label: string; icon: string; description: string }>;
}

export function toPublicPlayer(doc: PlayerDoc): PublicPlayer {
  return {
    handle: doc.handle,
    country: doc.country,
    flag: flagFor(doc.country),
    totalPoints: doc.totalPoints ?? 0,
    quizzes: doc.quizzes ?? 0,
    accuracy: percent(doc.correct ?? 0, doc.answered ?? 0),
    streak: doc.streak ?? 0,
    badges: (doc.badges ?? []).map((id) => ({
      id,
      label: BADGES[id]?.label ?? id,
      icon: BADGES[id]?.icon ?? '🏅',
      description: BADGES[id]?.description ?? '',
    })),
  };
}

const DEFAULT_PLAYER = {
  totalPoints: 0,
  weekKey: weekKeyFor(new Date()),
  weekPoints: 0,
  quizzes: 0,
  correct: 0,
  answered: 0,
  streak: 0,
  bestStreak: 0,
  lastPlayedDay: null as string | null,
  perfectEver: false,
  badges: [] as BadgeId[],
  categoryCorrect: {} as CategoryTally,
};

export async function getPlayer(db: Firestore, uid: string): Promise<PlayerDoc | null> {
  const snap = await db.collection(COL.players).doc(uid).get();
  if (!snap.exists) return null;
  return { ...DEFAULT_PLAYER, ...(snap.data() as Partial<PlayerDoc>), uid } as PlayerDoc;
}

export class ArenaError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

/**
 * A token bucket per account, stored in Firestore so it survives a cold start.
 * Small enough to be cheap; generous enough that no honest student meets it.
 */
export async function consumeRateLimit(
  db: Firestore,
  uid: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): Promise<void> {
  const ref = db.collection(COL.rate).doc(uid);
  const now = Date.now();
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() as { windowStart?: number; count?: number } | undefined;
    const windowStart = data?.windowStart ?? 0;
    const count = now - windowStart > windowMs ? 0 : data?.count ?? 0;
    if (count >= limit) {
      throw new ArenaError(429, 'rate_limited', 'You are going a bit fast. Take a short break, then try again.');
    }
    tx.set(ref, { windowStart: count === 0 ? now : windowStart, count: count + 1, updatedAt: now }, { merge: true });
  });
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function claimProfile(
  db: Firestore,
  uid: string,
  input: { handle: string; country: string },
): Promise<PlayerDoc> {
  const handleLower = normaliseHandle(input.handle);
  if (!handleLower) {
    throw new ArenaError(
      400,
      'invalid_handle',
      'Usernames need 3–20 characters: letters, numbers, hyphens or underscores, starting with a letter or number.',
    );
  }
  if (!COUNTRY_BY_CODE.has(input.country)) {
    throw new ArenaError(400, 'invalid_country', 'Pick your country from the list.');
  }

  const playerRef = db.collection(COL.players).doc(uid);
  const handleRef = db.collection(COL.handles).doc(handleLower);

  return db.runTransaction(async (tx) => {
    const [playerSnap, handleSnap] = await Promise.all([tx.get(playerRef), tx.get(handleRef)]);
    const existing = playerSnap.exists ? (playerSnap.data() as Partial<PlayerDoc>) : null;

    // Claiming a handle is a one-time decision. Allowing it to change would let
    // a student take the top-ranked name after someone else had earned it.
    if (existing?.handleLower && existing.handleLower !== handleLower) {
      throw new ArenaError(409, 'handle_locked', 'Your username is already set and cannot be changed.');
    }
    if (handleSnap.exists && handleSnap.data()?.uid !== uid) {
      throw new ArenaError(409, 'handle_taken', 'That username is already taken. Please choose another.');
    }

    const displayHandle = input.handle.trim().replace(/\s+/g, '-');
    const base = {
      ...DEFAULT_PLAYER,
      ...existing,
      uid,
      handle: displayHandle,
      handleLower,
      country: input.country,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (!existing) base.createdAt = FieldValue.serverTimestamp();

    tx.set(playerRef, base, { merge: true });
    tx.set(handleRef, { uid, handle: displayHandle, at: FieldValue.serverTimestamp() });
    return { ...(base as unknown as PlayerDoc), uid };
  });
}

export async function updateCountry(db: Firestore, uid: string, country: string): Promise<void> {
  if (!COUNTRY_BY_CODE.has(country)) throw new ArenaError(400, 'invalid_country', 'Pick your country from the list.');
  await db.collection(COL.players).doc(uid).set({ country, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

// ---------------------------------------------------------------------------
// Starting an attempt
// ---------------------------------------------------------------------------

function assertCategory(value: unknown): ArenaCategory {
  if (typeof value !== 'string' || !ARENA_CATEGORIES.includes(value as ArenaCategory)) {
    throw new ArenaError(400, 'invalid_category', 'Choose one of the quiz categories.');
  }
  return value as ArenaCategory;
}

function assertDifficulty(value: unknown): Difficulty {
  if (typeof value !== 'string' || !DIFFICULTIES.includes(value as Difficulty)) {
    throw new ArenaError(400, 'invalid_difficulty', 'Choose easy, medium or hard.');
  }
  return value as Difficulty;
}

function assertLength(value: unknown): number {
  const n = Number(value);
  if (!QUIZ_LENGTHS.includes(n as 5 | 10 | 20)) {
    throw new ArenaError(400, 'invalid_length', 'Choose a quiz of 5, 10 or 20 questions.');
  }
  return n;
}

/** Today's featured challenge, created once per Kathmandu day. */
export async function todaysChallenge(db: Firestore, now = new Date()) {
  const dayKey = nepalDayKey(now);
  const ref = db.collection(COL.daily).doc(dayKey);
  const snap = await ref.get();
  if (snap.exists) {
    const data = snap.data() as { category: ArenaCategory; difficulty: Difficulty; length: number };
    return { dayKey, ...data };
  }

  // Deterministic category for the day: every student worldwide gets the same
  // challenge, and it is stable across reloads without extra state.
  let hash = 0;
  for (const ch of dayKey) hash = (hash * 31 + ch.charCodeAt(0)) % 100000;
  const category = ARENA_CATEGORIES[hash % ARENA_CATEGORIES.length];
  const rotations: Difficulty[] = ['easy', 'medium', 'hard'];
  const dayNumber = Number(dayKey.replace(/-/g, ''));
  const difficulty = rotations[dayNumber % 3];
  const length = 5;

  const chosen = pickQuestions(category, difficulty, length);
  const payload = {
    category,
    difficulty,
    length,
    questionIds: chosen.map((q) => q.id),
    setAt: FieldValue.serverTimestamp(),
  };
  await ref.set(payload, { merge: true });
  return { dayKey, category, difficulty, length };
}

export interface StartInput {
  category: unknown;
  difficulty: unknown;
  length: unknown;
  daily?: boolean;
}

export async function startAttempt(db: Firestore, uid: string, input: StartInput) {
  const player = await getPlayer(db, uid);
  if (!player) throw new ArenaError(409, 'no_profile', 'Choose a username before your first quiz.');

  const daily = Boolean(input.daily);
  let category: ArenaCategory;
  let difficulty: Difficulty;
  let length: number;
  let questions;

  if (daily) {
    const challenge = await todaysChallenge(db);
    category = challenge.category;
    difficulty = challenge.difficulty;
    length = challenge.length;
    const daySnap = await db.collection(COL.daily).doc(challenge.dayKey).get();
    const ids = (daySnap.data()?.questionIds ?? []) as string[];
    questions = ids.map((id) => questionById(id)).filter(Boolean);
    if (questions.length !== length) throw new ArenaError(503, 'daily_unavailable', 'Today’s challenge is unavailable. Please try a normal quiz.');
  } else {
    category = assertCategory(input.category);
    difficulty = assertDifficulty(input.difficulty);
    length = assertLength(input.length);
    questions = pickQuestions(category, difficulty, length);
  }

  const now = Date.now();
  const ref = db.collection(COL.attempts).doc();
  await ref.set({
    uid,
    category,
    difficulty,
    length,
    daily,
    // The answer key stays here, server-side. The response below sends only
    // prompts and options.
    questionIds: questions.map((q) => q!.id),
    issuedAt: now,
    expiresAt: now + (secondsForQuiz(length) + 60) * 1000,
    status: 'issued',
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    attemptId: ref.id,
    category,
    difficulty,
    length,
    daily,
    seconds: secondsForQuiz(length),
    questions: questions.map((q) => ({
      id: q!.id,
      prompt: q!.prompt,
      options: q!.options,
      difficulty: q!.difficulty,
    })),
  };
}

// ---------------------------------------------------------------------------
// Submitting an attempt
// ---------------------------------------------------------------------------

export interface SubmitResult {
  attemptId: string;
  pointsThisAttempt: number;
  answerPoints: number;
  completionBonus: number;
  perfectBonus: number;
  streakBonus: number;
  correct: number;
  total: number;
  answers: Array<{
    questionId: string;
    prompt: string;
    options: string[];
    chosenIndex: number | null;
    correctIndex: number;
    correct: boolean;
    explanation: string;
    points: number;
  }>;
  totals: { totalPoints: number; quizzes: number; accuracy: number; streak: number };
  newBadges: Array<{ id: BadgeId; label: string; icon: string; description: string }>;
  duplicate: boolean;
}

export async function submitAttempt(
  db: Firestore,
  uid: string,
  attemptId: string,
  answers: AnswerMap,
): Promise<SubmitResult> {
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(attemptId)) throw new ArenaError(400, 'invalid_attempt', 'Unknown quiz attempt.');

  const attemptRef = db.collection(COL.attempts).doc(attemptId);
  const playerRef = db.collection(COL.players).doc(uid);
  const now = Date.now();
  const today = nepalDayKey(new Date(now));
  const weekKey = weekKeyFor(new Date(now));

  const outcome = await db.runTransaction(async (tx) => {
    const attemptSnap = await tx.get(attemptRef);
    if (!attemptSnap.exists) throw new ArenaError(404, 'attempt_not_found', 'That quiz attempt could not be found.');
    const attempt = attemptSnap.data() as {
      uid: string;
      category: ArenaCategory;
      difficulty: Difficulty;
      length: number;
      daily: boolean;
      questionIds: string[];
      issuedAt: number;
      status: 'issued' | 'submitted';
      result?: SubmitResult;
    };

    if (attempt.uid !== uid) throw new ArenaError(403, 'not_your_attempt', 'You can only submit your own quiz.');

    // Idempotency: a second submit returns the stored result and awards nothing.
    // This is what stops a replayed request from farming points.
    if (attempt.status === 'submitted') {
      return { duplicate: true, stored: attempt.result ?? null };
    }

    const timing = checkAttemptTiming({ startedAt: attempt.issuedAt, length: attempt.length, now });
    if (!timing.ok) {
      throw new ArenaError(
        timing.reason === 'too_fast' ? 400 : 410,
        timing.reason === 'too_fast' ? 'too_fast' : 'expired',
        timing.reason === 'too_fast'
          ? 'That quiz was submitted faster than a person could read it, so it cannot be scored.'
          : 'That quiz took too long and has expired. Start a new one — your earlier quizzes are unaffected.',
      );
    }

    const questions = attempt.questionIds.map((id) => questionById(id)).filter(Boolean);
    if (questions.length !== attempt.length) {
      throw new ArenaError(500, 'bank_mismatch', 'This quiz’s questions are no longer available.');
    }

    // Only keys that belong to this attempt are read, so extra entries in the
    // request body are ignored rather than trusted.
    const cleanAnswers: AnswerMap = {};
    for (const question of questions) {
      const value = answers?.[question!.id];
      if (Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 3) {
        cleanAnswers[question!.id] = value as number;
      }
    }

    const scored = scoreAttempt(
      questions.map((q) => ({
        id: q!.id,
        category: q!.category,
        difficulty: q!.difficulty,
        answerIndex: q!.answerIndex,
      })),
      cleanAnswers,
    );

    const playerSnap = await tx.get(playerRef);
    if (!playerSnap.exists) throw new ArenaError(409, 'no_profile', 'Choose a username before your first quiz.');
    const player = { ...DEFAULT_PLAYER, ...(playerSnap.data() as Partial<PlayerDoc>) };

    const streak = nextStreak({ lastPlayedDay: player.lastPlayedDay, streak: player.streak }, today);
    const bonus = streak.playedToday ? streakBonusFor(streak.streak) : 0;
    const pointsThisAttempt = scored.attemptPoints + bonus;

    // Weekly bucket rolls over without touching lifetime points.
    const weekPoints = (player.weekKey === weekKey ? player.weekPoints : 0) + pointsThisAttempt;

    const categoryCorrect: CategoryTally = { ...player.categoryCorrect };
    for (const result of scored.results) {
      if (result.correct) {
        const key = questions.find((q) => q!.id === result.questionId)!.category;
        categoryCorrect[key] = (categoryCorrect[key] ?? 0) + 1;
      }
    }

    const nextPlayer = {
      ...player,
      totalPoints: player.totalPoints + pointsThisAttempt,
      weekKey,
      weekPoints,
      quizzes: player.quizzes + 1,
      correct: player.correct + scored.correct,
      answered: player.answered + scored.results.length,
      streak: streak.streak,
      bestStreak: Math.max(player.bestStreak, streak.streak),
      lastPlayedDay: today,
      perfectEver: player.perfectEver || scored.perfect,
      categoryCorrect,
    };

    const answerBreakdown = scored.results.map((result) => {
      const question = questionById(result.questionId)!;
      return {
        questionId: result.questionId,
        prompt: question.prompt,
        options: question.options as string[],
        chosenIndex: result.chosenIndex,
        correctIndex: result.correctIndex,
        correct: result.correct,
        explanation: question.explanation,
        points: result.points,
      };
    });

    const result: SubmitResult = {
      attemptId,
      pointsThisAttempt,
      answerPoints: scored.answerPoints,
      completionBonus: COMPLETION_BONUS,
      perfectBonus: scored.perfectBonus,
      streakBonus: bonus,
      correct: scored.correct,
      total: scored.total,
      answers: answerBreakdown,
      totals: {
        totalPoints: nextPlayer.totalPoints,
        quizzes: nextPlayer.quizzes,
        accuracy: percent(nextPlayer.correct, nextPlayer.answered),
        streak: nextPlayer.streak,
      },
      newBadges: [],
      duplicate: false,
    };

    tx.update(attemptRef, {
      status: 'submitted',
      submittedAt: now,
      answers: cleanAnswers,
      result,
      awarded: pointsThisAttempt,
    });
    tx.set(playerRef, {
      ...nextPlayer,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    // Immutable ledger: one row per attempt, used for the points history.
    tx.set(db.collection(COL.points).doc(attemptId), {
      uid,
      attemptId,
      kind: 'quiz',
      points: pointsThisAttempt,
      breakdown: {
        answers: scored.answerPoints,
        completion: COMPLETION_BONUS,
        perfect: scored.perfectBonus,
        streak: bonus,
      },
      category: attempt.category,
      length: attempt.length,
      correct: scored.correct,
      daily: attempt.daily,
      day: today,
      weekKey,
      createdAt: now,
    });

    return { duplicate: false, stored: result, nextPlayer, categoryCorrect };
  });

  if (outcome.duplicate) {
    if (!outcome.stored) throw new ArenaError(409, 'already_submitted', 'That quiz has already been submitted.');
    return { ...outcome.stored, duplicate: true };
  }

  const result = outcome.stored as SubmitResult;

  // Badges depend on rank, which is a separate read, so they are settled after
  // the transaction. Adding a badge twice is harmless: the array is a set.
  try {
    const rank = await globalRank(db, uid);
    const earned = evaluateBadges({
      quizzes: result.totals.quizzes,
      perfectEver: (await getPlayer(db, uid))?.perfectEver ?? false,
      streak: result.totals.streak,
      categoryCorrect: outcome.categoryCorrect ?? {},
      globalRank: rank,
    });
    const player = await getPlayer(db, uid);
    const existing = new Set(player?.badges ?? []);
    const fresh = earned.filter((id) => !existing.has(id));
    if (fresh.length && player) {
      await db.collection(COL.players).doc(uid).set({ badges: [...existing, ...fresh] }, { merge: true });
      const batch = db.batch();
      for (const badge of fresh) {
        batch.set(db.collection(COL.badges).doc(`${uid}_${badge}`), {
          uid,
          badge,
          at: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
    }
    result.newBadges = fresh.map((id) => ({
      id,
      label: BADGES[id].label,
      icon: BADGES[id].icon,
      description: BADGES[id].description,
    }));
  } catch {
    // A badge failure must never cost the student their points, which are
    // already committed. It is retried on the next quiz.
  }

  return result;
}

// ---------------------------------------------------------------------------
// Rankings
// ---------------------------------------------------------------------------

async function rankAbove(db: Firestore, collectionQuery: (q: FirebaseFirestore.Query) => FirebaseFirestore.Query, column: string, mine: number): Promise<number | null> {
  if (mine <= 0) return null;
  try {
    const snap = await collectionQuery(db.collection(COL.players)).where(column, '>', mine).count().get();
    return snap.data().count + 1;
  } catch {
    return null;
  }
}

export async function globalRank(db: Firestore, uid: string): Promise<number | null> {
  const player = await getPlayer(db, uid);
  if (!player) return null;
  return rankAbove(db, (q) => q, 'totalPoints', player.totalPoints);
}

export async function nepalRank(db: Firestore, uid: string): Promise<number | null> {
  const player = await getPlayer(db, uid);
  if (!player || player.country !== 'NP') return null;
  return rankAbove(db, (q) => q.where('country', '==', 'NP'), 'totalPoints', player.totalPoints);
}

export type LeaderboardScope = 'global' | 'nepal' | 'weekly';

export interface LeaderboardRow {
  rank: number;
  handle: string;
  country: string;
  flag: string;
  points: number;
  quizzes: number;
  accuracy: number;
  isYou: boolean;
}

export interface LeaderboardPage {
  scope: LeaderboardScope;
  rows: LeaderboardRow[];
  hasMore: boolean;
  nextCursor: string | null;
  you: (LeaderboardRow & { inTop: boolean }) | null;
  weekKey: string | null;
}

const PAGE_SIZE = 25;
const MAX_PAGE = 100;

export async function leaderboard(
  db: Firestore,
  uid: string | null,
  scope: LeaderboardScope,
  offset = 0,
  limit = PAGE_SIZE,
): Promise<LeaderboardPage> {
  const take = Math.min(Math.max(1, limit), MAX_PAGE);
  const skip = Math.max(0, Math.min(offset, 2000));
  const weekKey = weekKeyFor(new Date());

  let query = db.collection(COL.players).orderBy('totalPoints', 'desc');
  if (scope === 'nepal') query = db.collection(COL.players).where('country', '==', 'NP').orderBy('totalPoints', 'desc');
  if (scope === 'weekly') query = db.collection(COL.players).where('weekKey', '==', weekKey).orderBy('weekPoints', 'desc');

  const snap = await query.limit(skip + take + 1).get();
  const docs = snap.docs.slice(skip);
  const hasMore = docs.length > take;
  const pageDocs = docs.slice(0, take);

  const rows: LeaderboardRow[] = pageDocs.map((doc, index) => {
    const data = doc.data() as PlayerDoc;
    return {
      rank: skip + index + 1,
      handle: data.handle,
      country: data.country,
      flag: flagFor(data.country),
      points: scope === 'weekly' ? data.weekPoints ?? 0 : data.totalPoints ?? 0,
      quizzes: data.quizzes ?? 0,
      accuracy: percent(data.correct ?? 0, data.answered ?? 0),
      isYou: uid === doc.id,
    };
  });

  // Hidden scores must stay hidden: players with no points are not ranked at
  // all, rather than being shown as "rank 1" on an empty board.
  const visible = rows.filter((row) => row.points > 0);

  let you: LeaderboardPage['you'] = null;
  if (uid) {
    const player = await getPlayer(db, uid);
    if (player) {
      const mine = scope === 'weekly' ? (player.weekKey === weekKey ? player.weekPoints : 0) : player.totalPoints;
      const rank = await (async () => {
        let q = db.collection(COL.players).where(
          scope === 'weekly' ? 'weekPoints' : 'totalPoints',
          '>',
          mine,
        );
        if (scope === 'weekly') q = q.where('weekKey', '==', weekKey);
        if (scope === 'nepal') q = q.where('country', '==', 'NP');
        if (mine <= 0) return null;
        try {
          const count = await q.count().get();
          return count.data().count + 1;
        } catch {
          return null;
        }
      })();
      const inTop = visible.some((row) => row.isYou);
      you = {
        rank: rank ?? 0,
        handle: player.handle,
        country: player.country,
        flag: flagFor(player.country),
        points: mine,
        quizzes: player.quizzes ?? 0,
        accuracy: percent(player.correct ?? 0, player.answered ?? 0),
        isYou: true,
        inTop,
      };
    }
  }

  return {
    scope,
    rows: visible,
    hasMore,
    nextCursor: hasMore ? String(skip + take) : null,
    you,
    weekKey: scope === 'weekly' ? weekKey : null,
  };
}

export async function previousWeekChampions(db: Firestore): Promise<LeaderboardRow[]> {
  const now = new Date();
  const thisWeek = weekKeyFor(now);
  // Look back over recent weeks for the most recent week that has players.
  for (let back = 1; back <= 4; back += 1) {
    const probe = new Date(now.getTime() - back * 7 * 86400000);
    const key = weekKeyFor(probe);
    if (key === thisWeek) continue;
    const snap = await db
      .collection(COL.players)
      .where('weekKey', '==', key)
      .orderBy('weekPoints', 'desc')
      .limit(3)
      .get()
      .catch(() => null);
    if (!snap || snap.empty) continue;
    return snap.docs
      .map((doc, index) => {
        const data = doc.data() as PlayerDoc;
        return {
          rank: index + 1,
          handle: data.handle,
          country: data.country,
          flag: flagFor(data.country),
          points: data.weekPoints ?? 0,
          quizzes: data.quizzes ?? 0,
          accuracy: percent(data.correct ?? 0, data.answered ?? 0),
          isYou: false,
        };
      })
      .filter((row) => row.points > 0);
  }
  return [];
}

// ---------------------------------------------------------------------------
// History and profile pages
// ---------------------------------------------------------------------------

export async function pointsHistory(db: Firestore, uid: string, limit = 20) {
  const snap = await db
    .collection(COL.points)
    .where('uid', '==', uid)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      points: data.points as number,
      breakdown: data.breakdown as { answers: number; completion: number; perfect: number; streak: number },
      category: data.category as ArenaCategory,
      length: data.length as number,
      correct: data.correct as number,
      daily: Boolean(data.daily),
      at: (data.createdAt as number) ?? null,
    };
  });
}

export async function recentAttempts(db: Firestore, uid: string, limit = 10) {
  const snap = await db
    .collection(COL.attempts)
    .where('uid', '==', uid)
    .where('status', '==', 'submitted')
    .orderBy('submittedAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((doc) => {
    const data = doc.data();
    const result = data.result as SubmitResult | undefined;
    return {
      attemptId: doc.id,
      category: data.category as ArenaCategory,
      length: data.length as number,
      daily: Boolean(data.daily),
      correct: result?.correct ?? 0,
      total: data.length as number,
      points: (data.awarded as number) ?? 0,
      at: (data.submittedAt as number) ?? null,
    };
  });
}

export async function subjectPerformance(db: Firestore, uid: string) {
  const player = await getPlayer(db, uid);
  const tally = player?.categoryCorrect ?? {};
  return ARENA_CATEGORIES.map((category) => ({
    category,
    label: CATEGORY_META[category].label,
    icon: CATEGORY_META[category].icon,
    correct: tally[category] ?? 0,
  }));
}

export interface ProfileView {
  player: PublicPlayer;
  globalRank: number | null;
  nepalRank: number | null;
  recent: Awaited<ReturnType<typeof recentAttempts>>;
  points: Awaited<ReturnType<typeof pointsHistory>>;
  subjects: Awaited<ReturnType<typeof subjectPerformance>>;
  badgesAll: Array<{ id: BadgeId; label: string; icon: string; description: string; earned: boolean }>;
}

export async function profileView(db: Firestore, uid: string, forSelf: boolean): Promise<ProfileView | null> {
  const player = await getPlayer(db, uid);
  if (!player) return null;
  const [g, n, recent, points, subjects] = forSelf
    ? await Promise.all([
        globalRank(db, uid),
        nepalRank(db, uid),
        recentAttempts(db, uid),
        pointsHistory(db, uid),
        subjectPerformance(db, uid),
      ])
    : [null, null, [], [], []];
  const earned = new Set(player.badges ?? []);
  return {
    player: toPublicPlayer(player),
    globalRank: forSelf ? g : null,
    nepalRank: forSelf ? n : null,
    recent,
    points,
    subjects,
    badgesAll: (Object.keys(BADGES) as BadgeId[]).map((id) => ({
      id,
      label: BADGES[id].label,
      icon: BADGES[id].icon,
      description: BADGES[id].description,
      earned: earned.has(id),
    })),
  };
}

export async function profileByHandle(db: Firestore, handle: string) {
  const handleLower = normaliseHandle(handle);
  if (!handleLower) return null;
  const snap = await db.collection(COL.handles).doc(handleLower).get();
  if (!snap.exists) return null;
  const uid = snap.data()?.uid as string | undefined;
  if (!uid) return null;
  const player = await getPlayer(db, uid);
  if (!player) return null;
  return {
    player: toPublicPlayer(player),
    globalRank: await globalRank(db, uid),
    nepalRank: player.country === 'NP' ? await nepalRank(db, uid) : null,
    badgesAll: (Object.keys(BADGES) as BadgeId[]).map((id) => ({
      id,
      label: BADGES[id].label,
      icon: BADGES[id].icon,
      description: BADGES[id].description,
      earned: (player.badges ?? []).includes(id),
    })),
  };
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

export async function meta() {
  return {
    categories: ARENA_CATEGORIES.map((category) => ({
      id: category,
      ...CATEGORY_META[category],
      questions: bankSummary()[category],
    })),
    difficulties: DIFFICULTIES,
    lengths: QUIZ_LENGTHS,
    countries: COUNTRIES,
    points: {
      easy: ANSWER_POINTS.easy,
      medium: ANSWER_POINTS.medium,
      hard: ANSWER_POINTS.hard,
      completion: COMPLETION_BONUS,
      perfect: PERFECT_BONUS,
      streak: 25,
    },
    questionCount: QUESTION_BANK.length,
    badges: (Object.keys(BADGES) as BadgeId[]).map((id) => ({
      id,
      ...BADGES[id],
    })),
  };
}
