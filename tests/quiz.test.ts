import { describe, expect, it } from 'vitest';
import { buildAttempt, isAnswerCorrect, normalizeAnswer, scoreQuiz } from '../src/lib/quiz';
import type { Quiz, QuizQuestion } from '../src/types/domain';

const mcq: QuizQuestion = {
  id: 'q1',
  type: 'mcq',
  question: 'Which gas do plants absorb during photosynthesis?',
  options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Hydrogen'],
  answer: 'Carbon dioxide',
  explanation: 'Plants take in carbon dioxide and release oxygen.',
};

const trueFalse: QuizQuestion = {
  id: 'q2',
  type: 'true-false',
  question: 'Water boils at 100 °C at sea level.',
  options: ['True', 'False'],
  answer: 'True',
  explanation: 'At standard atmospheric pressure water boils at 100 °C.',
};

const shortAnswer: QuizQuestion = {
  id: 'q3',
  type: 'short-answer',
  question: 'What is the SI unit of force?',
  answer: 'newton',
  acceptedAnswers: ['N', 'Newtons'],
  explanation: 'Force is measured in newtons.',
};

const fillBlank: QuizQuestion = {
  id: 'q4',
  type: 'fill-blank',
  question: 'The process by which plants make food is called ____.',
  answer: 'photosynthesis',
  explanation: 'Chlorophyll captures light energy for photosynthesis.',
};

const numeric: QuizQuestion = {
  id: 'q5',
  type: 'short-answer',
  question: 'What is 1,200 + 300?',
  answer: '1500',
  explanation: '1200 + 300 = 1500.',
};

describe('answer normalisation', () => {
  it('ignores case, punctuation and extra whitespace', () => {
    expect(normalizeAnswer('  Carbon   Dioxide! ')).toBe('carbon dioxide');
    expect(normalizeAnswer('Newtons.')).toBe('newtons');
  });

  it('treats leading articles as optional for short answers', () => {
    expect(isAnswerCorrect(shortAnswer, 'the newton')).toBe(true);
  });
});

describe('isAnswerCorrect', () => {
  it('matches a multiple-choice answer exactly', () => {
    expect(isAnswerCorrect(mcq, 'Carbon dioxide')).toBe(true);
    expect(isAnswerCorrect(mcq, 'Oxygen')).toBe(false);
  });

  it('accepts true/false regardless of case', () => {
    expect(isAnswerCorrect(trueFalse, 'true')).toBe(true);
    expect(isAnswerCorrect(trueFalse, 'false')).toBe(false);
  });

  it('accepts model-supplied variants for short answers', () => {
    expect(isAnswerCorrect(shortAnswer, 'N')).toBe(true);
    expect(isAnswerCorrect(shortAnswer, 'Newtons')).toBe(true);
    expect(isAnswerCorrect(shortAnswer, 'joule')).toBe(false);
  });

  it('accepts equivalent numeric formatting', () => {
    expect(isAnswerCorrect(numeric, '1,500')).toBe(true);
    expect(isAnswerCorrect(numeric, '1500.0')).toBe(true);
    expect(isAnswerCorrect(numeric, '1600')).toBe(false);
  });

  it('treats empty or missing answers as incorrect', () => {
    expect(isAnswerCorrect(mcq, '')).toBe(false);
    expect(isAnswerCorrect(fillBlank, '   ')).toBe(false);
  });

  it('handles fill-in-the-blank answers', () => {
    expect(isAnswerCorrect(fillBlank, 'Photosynthesis')).toBe(true);
  });
});

describe('scoreQuiz', () => {
  const quiz = { questions: [mcq, trueFalse, shortAnswer, fillBlank, numeric] };

  it('calculates the score and percentage accurately', () => {
    const result = scoreQuiz(quiz, {
      q1: 'Carbon dioxide',
      q2: 'True',
      q3: 'joule', // wrong
      q4: 'photosynthesis',
      q5: '', // unanswered
    });
    expect(result.score).toBe(3);
    expect(result.total).toBe(5);
    expect(result.percent).toBe(60);
    expect(result.answers).toHaveLength(5);
    expect(result.answers.find((answer) => answer.questionId === 'q3')?.correct).toBe(false);
    expect(result.answers.find((answer) => answer.questionId === 'q5')?.given).toBe('');
  });

  it('handles a perfect score and an empty quiz safely', () => {
    const perfect = scoreQuiz(quiz, {
      q1: 'Carbon dioxide',
      q2: 'True',
      q3: 'newton',
      q4: 'photosynthesis',
      q5: '1500',
    });
    expect(perfect.score).toBe(5);
    expect(perfect.percent).toBe(100);

    const empty = scoreQuiz({ questions: [] }, {});
    expect(empty.score).toBe(0);
    expect(empty.total).toBe(0);
    expect(empty.percent).toBe(0);
  });

  it('builds a stored attempt with the owner and duration', () => {
    const fullQuiz = {
      id: 'quiz_1',
      ownerId: 'user_1',
      title: 'Cells quiz',
      subjectId: 'science',
      grade: '8',
      topic: 'Cells',
      difficulty: 'easy',
      questions: [mcq],
      createdAt: '2026-01-01T00:00:00.000Z',
      source: 'ai',
    } satisfies Quiz;

    const result = scoreQuiz(fullQuiz, { q1: 'Carbon dioxide' });
    const attempt = buildAttempt(fullQuiz, result, {
      id: 'attempt_1',
      ownerId: 'user_1',
      durationSeconds: 95,
      now: new Date('2026-01-02T00:00:00.000Z'),
    });

    expect(attempt.ownerId).toBe('user_1');
    expect(attempt.total).toBe(1);
    expect(attempt.percent).toBe(100);
    expect(attempt.durationSeconds).toBe(95);
    expect(attempt.createdAt).toBe('2026-01-02T00:00:00.000Z');
  });
});
