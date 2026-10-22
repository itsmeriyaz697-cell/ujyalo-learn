/** Shared domain models. All private records include an `ownerId`. */

import type { TutorModeId } from '@/config/curriculum';

export type ISODate = string;

export interface StudentPreferences {
  grade: string;
  curriculum: string;
  language: string;
  subjects: string[];
  goals: string[];
  explanationStyle: string;
  dailyMinutes: number;
  country: string;
}

export interface StudentProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
  preferences: StudentPreferences;
  onboardingComplete: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
  aiRequestsToday?: number;
  aiUsageDate?: string;
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  conversationId: string;
  ownerId: string;
  role: ChatRole;
  content: string;
  mode: TutorModeId | string;
  createdAt: ISODate;
  /** Non-fatal issue surfaced to the student, e.g. a truncated response. */
  notice?: string;
}

export interface Conversation {
  id: string;
  ownerId: string;
  title: string;
  subjectId: string | null;
  mode: TutorModeId | string;
  preview: string;
  messageCount: number;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Note {
  id: string;
  ownerId: string;
  title: string;
  content: string;
  subjectId: string | null;
  topic: string;
  source: 'ai' | 'student';
  favorite: boolean;
  tags: string[];
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type QuestionType = 'mcq' | 'true-false' | 'short-answer' | 'fill-blank';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  /** Kept client-side but never rendered before submission. */
  answer: string;
  /** Model-supplied acceptable variants for free-text answers. */
  acceptedAnswers?: string[];
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface Quiz {
  id: string;
  ownerId: string;
  title: string;
  subjectId: string;
  grade: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questions: QuizQuestion[];
  createdAt: ISODate;
  source: 'ai';
}

export interface QuizAnswerRecord {
  questionId: string;
  given: string;
  correct: boolean;
}

export interface QuizAttempt {
  id: string;
  ownerId: string;
  quizId: string;
  quizTitle: string;
  subjectId: string;
  score: number;
  total: number;
  percent: number;
  answers: QuizAnswerRecord[];
  durationSeconds?: number;
  createdAt: ISODate;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface FlashcardDeck {
  id: string;
  ownerId: string;
  title: string;
  subjectId: string | null;
  topic: string;
  cards: Flashcard[];
  source: 'ai' | 'student';
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface StudyGoal {
  id: string;
  ownerId: string;
  title: string;
  subjectId: string | null;
  targetDate: string | null;
  completed: boolean;
  createdAt: ISODate;
}

export interface StudyTask {
  id: string;
  ownerId: string;
  goalId: string | null;
  title: string;
  subjectId: string | null;
  topic: string;
  date: string; // YYYY-MM-DD
  minutes: number;
  completed: boolean;
  completedAt?: ISODate | null;
  createdAt: ISODate;
}

export type ActivityType = 'tutor' | 'quiz' | 'note' | 'flashcard' | 'task' | 'goal';

export interface ActivityEvent {
  id: string;
  ownerId: string;
  type: ActivityType;
  label: string;
  subjectId?: string | null;
  minutes?: number;
  createdAt: ISODate;
}

export interface UsageSummary {
  today: number;
  remaining: number;
  limit: number;
}
