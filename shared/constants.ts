/** Constants shared by the browser app, the API functions and tests. */

export const TUTOR_MODE_IDS = [
  'explain-simply',
  'step-by-step',
  'exam-prep',
  'quiz-me',
  'socratic',
  'quick-answer',
  'nepali',
] as const;

export type TutorModeId = (typeof TUTOR_MODE_IDS)[number];

export const QUESTION_TYPES = ['mcq', 'true-false', 'short-answer', 'fill-blank'] as const;
export type QuestionTypeId = (typeof QUESTION_TYPES)[number];

export const STUDY_TOOL_IDS = [
  'revision-summary',
  'formula-helper',
  'writing-assistant',
  'question-explainer',
] as const;

export type StudyToolId = (typeof STUDY_TOOL_IDS)[number];

/** Request limits enforced on the server (and mirrored in the UI). */
export const LIMITS = {
  maxBodyKb: 32,
  maxMessages: 24,
  maxMessageChars: 6000,
  maxTopicChars: 160,
  maxNotesChars: 8000,
  quizMinQuestions: 3,
  quizMaxQuestions: 15,
  flashcardMinCards: 4,
  flashcardMaxCards: 24,
  maxTitleChars: 160,
  maxNoteChars: 20000,
} as const;

export const AI_MODES_LABEL: Record<TutorModeId, string> = {
  'explain-simply': 'Explain Simply',
  'step-by-step': 'Step-by-Step',
  'exam-prep': 'Exam Preparation',
  'quiz-me': 'Quiz Me',
  socratic: 'Socratic Tutor',
  'quick-answer': 'Quick Answer',
  nepali: 'Nepali Explanation',
};
