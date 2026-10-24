/**
 * Global Quiz Arena — client types.
 *
 * These describe what the API sends. They intentionally contain no answer key:
 * a question is sent with its options and nothing else, and the correct index
 * only arrives after the attempt has been submitted and scored.
 */
import type {
  ArenaCategory,
  BadgeId,
  Difficulty,
} from '../../../shared/arena/scoring';

export type { ArenaCategory, BadgeId, Difficulty };

export interface CategoryMeta {
  id: ArenaCategory;
  label: string;
  icon: string;
  blurb: string;
  questions: { total: number; easy: number; medium: number; hard: number };
}

export interface ArenaMeta {
  categories: CategoryMeta[];
  difficulties: Difficulty[];
  lengths: number[];
  countries: Array<{ code: string; name: string; flag: string }>;
  points: { easy: number; medium: number; hard: number; completion: number; perfect: number; streak: number };
  questionCount: number;
  badges: Array<{ id: BadgeId; label: string; description: string; icon: string }>;
}

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

export interface Challenge {
  dayKey: string;
  category: ArenaCategory;
  difficulty: Difficulty;
  length: number;
}

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
  scope: 'global' | 'nepal' | 'weekly';
  rows: LeaderboardRow[];
  hasMore: boolean;
  nextCursor: string | null;
  you: (LeaderboardRow & { inTop: boolean }) | null;
  weekKey: string | null;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  difficulty: Difficulty;
}

export interface StartedAttempt {
  attemptId: string;
  category: ArenaCategory;
  difficulty: Difficulty;
  length: number;
  daily: boolean;
  seconds: number;
  questions: QuizQuestion[];
}

export interface AnsweredQuestion {
  questionId: string;
  prompt: string;
  options: string[];
  chosenIndex: number | null;
  correctIndex: number;
  correct: boolean;
  explanation: string;
  points: number;
}

export interface SubmitResult {
  attemptId: string;
  pointsThisAttempt: number;
  answerPoints: number;
  completionBonus: number;
  perfectBonus: number;
  streakBonus: number;
  correct: number;
  total: number;
  answers: AnsweredQuestion[];
  totals: { totalPoints: number; quizzes: number; accuracy: number; streak: number };
  newBadges: Array<{ id: BadgeId; label: string; icon: string; description: string }>;
  duplicate: boolean;
}

export interface RecentAttempt {
  attemptId: string;
  category: ArenaCategory;
  length: number;
  daily: boolean;
  correct: number;
  total: number;
  points: number;
  at: number | null;
}

export interface PointsEntry {
  id: string;
  points: number;
  breakdown: { answers: number; completion: number; perfect: number; streak: number };
  category: ArenaCategory;
  length: number;
  correct: number;
  daily: boolean;
  at: number | null;
}

export interface SubjectScore {
  category: ArenaCategory;
  label: string;
  icon: string;
  correct: number;
}

export interface ArenaHome {
  configured: boolean;
  mode?: 'emulator' | 'service-account' | 'demo';
  meta?: ArenaMeta;
  challenge?: Challenge;
  top?: LeaderboardRow[];
  champions?: LeaderboardRow[];
  me?: (PublicPlayer & { globalRank: number | null }) | null;
  needsProfile?: boolean;
  signedIn?: boolean;
  reason?: string;
}

export interface ArenaDashboard {
  configured: boolean;
  needsProfile: boolean;
  challenge: Challenge;
  player?: PublicPlayer;
  globalRank?: number | null;
  nepalRank?: number | null;
  recent?: RecentAttempt[];
  points?: PointsEntry[];
  subjects?: SubjectScore[];
}

export interface ProfileView {
  configured: boolean;
  player: PublicPlayer;
  globalRank: number | null;
  nepalRank: number | null;
  badgesAll?: Array<{ id: BadgeId; label: string; icon: string; description: string; earned: boolean }>;
  recent?: RecentAttempt[];
  points?: PointsEntry[];
  subjects?: SubjectScore[];
}
