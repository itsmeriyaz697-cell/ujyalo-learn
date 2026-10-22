import { describe, expect, it } from 'vitest';
import {
  extractJsonObject,
  quizRequestSchema,
  tutorRequestSchema,
  validateGeneratedQuiz,
} from '../shared/schemas';

describe('tutorRequestSchema', () => {
  it('accepts a valid request and applies defaults', () => {
    const parsed = tutorRequestSchema.parse({
      messages: [{ role: 'user', content: 'Explain fractions' }],
    });
    expect(parsed.mode).toBe('explain-simply');
    expect(parsed.stream).toBe(true);
    expect(parsed.context.grade).toBe('10');
  });

  it('rejects an empty or oversized conversation', () => {
    expect(tutorRequestSchema.safeParse({ messages: [] }).success).toBe(false);
    const tooMany = Array.from({ length: 30 }, () => ({ role: 'user', content: 'hi' }));
    expect(tutorRequestSchema.safeParse({ messages: tooMany }).success).toBe(false);
    expect(
      tutorRequestSchema.safeParse({ messages: [{ role: 'user', content: 'x'.repeat(7000) }] }).success,
    ).toBe(false);
  });

  it('rejects an unknown tutoring mode', () => {
    const result = tutorRequestSchema.safeParse({
      mode: 'do-my-homework',
      messages: [{ role: 'user', content: 'hi' }],
    });
    expect(result.success).toBe(false);
  });
});

describe('quizRequestSchema', () => {
  it('enforces question count bounds', () => {
    const base = { subject: 'Science', grade: '9', topic: 'Cells' };
    expect(quizRequestSchema.safeParse({ ...base, count: 2 }).success).toBe(false);
    expect(quizRequestSchema.safeParse({ ...base, count: 15 }).success).toBe(true);
    expect(quizRequestSchema.safeParse({ ...base, count: 16 }).success).toBe(false);
  });
});

describe('extractJsonObject', () => {
  it('reads JSON from fenced blocks', () => {
    const text = 'Here you go:\n```json\n{"title":"T","questions":[]}\n```\nDone.';
    expect(extractJsonObject(text)).toEqual({ title: 'T', questions: [] });
  });

  it('handles braces inside strings', () => {
    const text = '{"title":"Uses {braces} inside","questions":[]}';
    expect(extractJsonObject(text)).toEqual({ title: 'Uses {braces} inside', questions: [] });
  });

  it('throws on incomplete JSON', () => {
    expect(() => extractJsonObject('{"title": "broken"')).toThrow();
    expect(() => extractJsonObject('no json here')).toThrow();
  });
});

describe('validateGeneratedQuiz', () => {
  const base = {
    title: 'Fractions practice',
    questions: [
      {
        type: 'mcq',
        question: 'What is 1/2 + 1/4?',
        options: ['1/6', '3/4', '2/6', '1/8'],
        answer: 'B',
        explanation: 'Use a common denominator: 2/4 + 1/4 = 3/4.',
      },
      {
        type: 'truefalse',
        question: '1/3 is larger than 1/2.',
        answer: 'false',
        explanation: 'One half is larger than one third.',
      },
      {
        type: 'fill-in-the-blank',
        question: 'The top number of a fraction is called the ____.',
        answer: 'numerator',
        explanation: 'The numerator sits above the line.',
      },
    ],
  };

  it('repairs letter answers, true/false variants and fills ids', () => {
    const quiz = validateGeneratedQuiz(base, 3);
    expect(quiz.questions[0].answer).toBe('3/4');
    expect(quiz.questions[0].id).toBe('q1');
    expect(quiz.questions[1].type).toBe('true-false');
    expect(quiz.questions[1].answer).toBe('False');
    expect(quiz.questions[2].type).toBe('fill-blank');
    expect(quiz.questions[2].options).toBeUndefined();
  });

  it('rejects a multiple-choice question whose answer is not an option', () => {
    const broken = structuredClone(base);
    broken.questions[0].answer = 'Z';
    expect(() => validateGeneratedQuiz(broken)).toThrow(/answer/i);
  });

  it('rejects non-objects and missing questions', () => {
    expect(() => validateGeneratedQuiz(null)).toThrow();
    expect(() => validateGeneratedQuiz({ title: 'x' })).toThrow(/questions/i);
    expect(() => validateGeneratedQuiz({ title: 'x', questions: [] })).toThrow(/No usable/i);
  });

  it('caps the number of questions to the requested count', () => {
    const many = {
      title: 'Long',
      questions: Array.from({ length: 6 }, (_, index) => ({
        type: 'true-false',
        question: `Question ${index + 1}?`,
        answer: 'True',
        explanation: 'Because.',
      })),
    };
    expect(validateGeneratedQuiz(many, 4).questions).toHaveLength(4);
  });
});
