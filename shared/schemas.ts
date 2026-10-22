import { z } from 'zod';
import {
  LIMITS,
  QUESTION_TYPES,
  STUDY_TOOL_IDS,
  TUTOR_MODE_IDS,
} from './constants.js';

/** ─────────────────────  AI tutor requests  ───────────────────── */

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(LIMITS.maxMessageChars),
});

export const studentContextSchema = z.object({
  grade: z.string().max(24).default('10'),
  curriculum: z.string().max(48).default('nepal-national'),
  language: z.string().max(24).default('en'),
  subjects: z.array(z.string().max(48)).max(9).default([]),
  explanationStyle: z.string().max(48).default('simple'),
  country: z.string().max(24).default('NP'),
  studentName: z.string().max(60).optional(),
});

export const tutorRequestSchema = z.object({
  mode: z.enum(TUTOR_MODE_IDS).default('explain-simply'),
  messages: z.array(chatMessageSchema).min(1).max(LIMITS.maxMessages),
  context: studentContextSchema.default({}),
  stream: z.boolean().default(true),
  subjectId: z.string().max(48).optional(),
});

export type TutorRequest = z.infer<typeof tutorRequestSchema>;

/** ─────────────────────  Structured AI tools  ───────────────────── */

export const studyToolRequestSchema = z.object({
  tool: z.enum(STUDY_TOOL_IDS),
  input: z.string().min(3).max(LIMITS.maxMessageChars),
  subject: z.string().max(60).optional(),
  grade: z.string().max(24).default('10'),
  language: z.string().max(24).default('en'),
  stream: z.boolean().default(true),
});

export type StudyToolRequest = z.infer<typeof studyToolRequestSchema>;

/** ─────────────────────  Quiz generation  ───────────────────── */

export const quizRequestSchema = z.object({
  subject: z.string().min(2).max(60),
  grade: z.string().min(1).max(24),
  topic: z.string().min(2).max(LIMITS.maxTopicChars),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).default('medium'),
  count: z.number().int().min(LIMITS.quizMinQuestions).max(LIMITS.quizMaxQuestions).default(5),
  questionTypes: z
    .array(z.enum(QUESTION_TYPES))
    .min(1)
    .default(['mcq']),
  language: z.string().max(24).default('en'),
});

export type QuizRequest = z.infer<typeof quizRequestSchema>;

export const quizQuestionSchema = z.object({
  id: z.string().min(1).max(40),
  type: z.enum(QUESTION_TYPES),
  question: z.string().min(4).max(1200),
  options: z.array(z.string().min(1).max(400)).min(2).max(6).optional(),
  answer: z.string().min(1).max(400),
  acceptedAnswers: z.array(z.string().min(1).max(400)).max(8).optional(),
  explanation: z.string().min(1).max(1600),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
});

export const generatedQuizSchema = z.object({
  title: z.string().min(3).max(160),
  topic: z.string().max(160).optional(),
  questions: z.array(quizQuestionSchema).min(1).max(LIMITS.quizMaxQuestions),
});

export type GeneratedQuiz = z.infer<typeof generatedQuizSchema>;

export const flashcardSchema = z.object({
  id: z.string().min(1).max(40),
  front: z.string().min(1).max(500),
  back: z.string().min(1).max(1200),
});

export const generatedFlashcardsSchema = z.object({
  title: z.string().min(3).max(160),
  cards: z.array(flashcardSchema).min(1).max(LIMITS.flashcardMaxCards),
});

export type GeneratedFlashcards = z.infer<typeof generatedFlashcardsSchema>;

export const flashcardRequestSchema = z.object({
  topic: z.string().min(2).max(LIMITS.maxTopicChars),
  subject: z.string().max(60).optional(),
  grade: z.string().max(24).default('10'),
  count: z.number().int().min(LIMITS.flashcardMinCards).max(LIMITS.flashcardMaxCards).default(8),
  notes: z.string().max(LIMITS.maxNotesChars).optional(),
});

export type FlashcardRequest = z.infer<typeof flashcardRequestSchema>;

/** ─────────────────────  Validation helpers  ───────────────────── */

export function formatZodError(error: z.ZodError): string {
  return error.issues
    .slice(0, 4)
    .map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`)
    .join('; ');
}

/**
 * Validates model-generated quiz JSON and repairs safe inconsistencies:
 * - ensures MCQ answers match one of the options
 * - ensures true/false answers are "True" or "False"
 * - adds ids when missing
 * Throws if the payload cannot be repaired.
 */
export function validateGeneratedQuiz(raw: unknown, requestedCount?: number): GeneratedQuiz {
  if (!raw || typeof raw !== 'object') throw new Error('Quiz response was not an object.');
  const data = raw as Record<string, unknown>;
  if (!Array.isArray(data.questions)) throw new Error('Quiz response has no questions array.');

  const repairedQuestions = data.questions
    .slice(0, requestedCount ? Math.max(requestedCount, 1) : LIMITS.quizMaxQuestions)
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') throw new Error('Question was not an object.');
      const q = entry as Record<string, unknown>;
      const type = String(q.type ?? 'mcq').toLowerCase().replace(/\s+/g, '-');
      const normalizedType = type === 'truefalse' ? 'true-false' : type === 'fill-in-the-blank' || type === 'fill-in-the-blanks' ? 'fill-blank' : type;
      let options = Array.isArray(q.options)
        ? q.options.map((o) => String(o)).filter(Boolean).slice(0, 6)
        : undefined;
      let answer = String(q.answer ?? '').trim();

      if (normalizedType === 'mcq') {
        if (!options || options.length < 2) throw new Error('Multiple-choice question is missing options.');
        const match = options.find((o) => o.trim().toLowerCase() === answer.toLowerCase());
        if (!match) {
          const letter = answer.toUpperCase().match(/^[A-F]$/);
          const byLetter = letter ? options[letter[0].charCodeAt(0) - 65] : undefined;
          if (!byLetter) throw new Error('Multiple-choice answer does not match its options.');
          answer = byLetter;
        } else {
          answer = match;
        }
      }
      if (normalizedType === 'true-false') {
        options = ['True', 'False'];
        answer = /^t/i.test(answer) ? 'True' : /^f/i.test(answer) ? 'False' : '';
        if (!answer) throw new Error('True/false answer must be True or False.');
      }
      if (normalizedType === 'short-answer' || normalizedType === 'fill-blank') {
        options = undefined;
        if (!answer) throw new Error('Answer is missing.');
      }
      if (!['mcq', 'true-false', 'short-answer', 'fill-blank'].includes(normalizedType)) {
        throw new Error(`Unsupported question type: ${String(q.type)}`);
      }

      return {
        id: typeof q.id === 'string' && q.id.length <= 40 ? q.id : `q${index + 1}`,
        type: normalizedType as GeneratedQuiz['questions'][number]['type'],
        question: String(q.question ?? '').trim(),
        options,
        answer,
        acceptedAnswers: Array.isArray(q.acceptedAnswers)
          ? q.acceptedAnswers.map(String).slice(0, 8)
          : undefined,
        explanation: String(q.explanation ?? '').trim() || 'Review this topic again with your tutor.',
        difficulty: ['easy', 'medium', 'hard'].includes(String(q.difficulty))
          ? (String(q.difficulty) as 'easy' | 'medium' | 'hard')
          : undefined,
      };
    });

  if (!repairedQuestions.length) throw new Error('No usable questions were returned.');

  return generatedQuizSchema.parse({
    title: String(data.title ?? 'Practice quiz').slice(0, 160),
    topic: data.topic ? String(data.topic).slice(0, 160) : undefined,
    questions: repairedQuestions,
  });
}

/** Safely extracts the first balanced JSON object from model text (handles ```json fences). */
export function extractJsonObject(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  if (start === -1) throw new Error('No JSON object found in model response.');
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < candidate.length; i += 1) {
    const ch = candidate[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return JSON.parse(candidate.slice(start, i + 1));
    }
  }
  throw new Error('Model response contained incomplete JSON.');
}
