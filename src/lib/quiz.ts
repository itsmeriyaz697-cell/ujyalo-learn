import type { Quiz, QuizAnswerRecord, QuizAttempt, QuizQuestion } from '@/types/domain';

/** Normalises an answer for fair comparison of free-text responses. */
export function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[“”‘’'"`]/g, '')
    .replace(/[.,!?;:()[\]{}\-_/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Returns true when a student's answer matches the expected answer.
 * Free-text answers accept any of the model-supplied `acceptedAnswers`.
 * A leading article ("the water", "a cell") is ignored for short answers.
 */
export function isAnswerCorrect(question: QuizQuestion, given: string): boolean {
  if (!given || !given.trim()) return false;
  const normalize = (s: string) => normalizeAnswer(s).replace(/^(the|a|an)\s+/, '');
  const expected = [question.answer, ...(question.acceptedAnswers ?? [])].map(normalize);
  const actual = normalize(given);

  if (question.type === 'mcq' || question.type === 'true-false') {
    return expected.includes(actual);
  }
  if (expected.includes(actual)) return true;

  // Numeric answers: allow comma grouping, spaces and trailing zeros
  // (1,200 vs 1200; 2.50 vs 2.5). Uses the raw strings so decimal points
  // are not stripped by normalisation.
  const numericPattern = /^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i;
  const toNumber = (value: string) => value.trim().replace(/[\s,]/g, '');
  const givenRaw = toNumber(given);
  if (numericPattern.test(givenRaw)) {
    const givenNumber = Number(givenRaw);
    const candidates = [question.answer, ...(question.acceptedAnswers ?? [])];
    return candidates.some((candidate) => {
      const candidateRaw = toNumber(candidate);
      if (!numericPattern.test(candidateRaw)) return false;
      return Number(candidateRaw) === givenNumber;
    });
  }
  return false;
}

export interface ScoreResult {
  score: number;
  total: number;
  percent: number;
  answers: QuizAnswerRecord[];
}

export function scoreQuiz(quiz: Pick<Quiz, 'questions'>, responses: Record<string, string>): ScoreResult {
  const answers: QuizAnswerRecord[] = quiz.questions.map((q) => {
    const given = responses[q.id] ?? '';
    return { questionId: q.id, given, correct: isAnswerCorrect(q, given) };
  });
  const total = quiz.questions.length;
  const score = answers.filter((a) => a.correct).length;
  return { score, total, percent: total ? Math.round((score / total) * 100) : 0, answers };
}

export function buildAttempt(
  quiz: Quiz,
  result: ScoreResult,
  extra: { id: string; ownerId: string; durationSeconds?: number; now?: Date },
): QuizAttempt {
  return {
    id: extra.id,
    ownerId: extra.ownerId,
    quizId: quiz.id,
    quizTitle: quiz.title,
    subjectId: quiz.subjectId,
    score: result.score,
    total: result.total,
    percent: result.percent,
    answers: result.answers,
    durationSeconds: extra.durationSeconds,
    createdAt: (extra.now ?? new Date()).toISOString(),
  };
}

export type ScoreBand = 'excellent' | 'good' | 'developing' | 'needs-work';

export function scoreBand(percent: number): ScoreBand {
  if (percent >= 85) return 'excellent';
  if (percent >= 65) return 'good';
  if (percent >= 40) return 'developing';
  return 'needs-work';
}

export function scoreMessage(percent: number): string {
  switch (scoreBand(percent)) {
    case 'excellent':
      return 'Excellent work. Try harder questions or a new topic next.';
    case 'good':
      return 'Good progress. Review the explanations for the ones you missed.';
    case 'developing':
      return 'You are getting there. Use the explanations, then retry the incorrect questions.';
    default:
      return 'This topic needs another look. Ask your tutor to explain it simply, then retry.';
  }
}
