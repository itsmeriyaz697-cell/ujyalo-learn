import { describe, expect, it } from 'vitest';
import {
  buildFlashcardPrompt,
  buildQuizUserPrompt,
  buildToolSystemPrompt,
  buildTutorSystemPrompt,
  TUTOR_SYSTEM_PROMPT,
} from '../api/_lib/prompts';
import { TUTOR_MODE_IDS } from '../shared/constants';

const context = {
  grade: '10',
  curriculum: 'see-preparation',
  language: 'en',
  subjects: ['mathematics', 'science'],
  explanationStyle: 'step-by-step',
  country: 'NP',
};

describe('tutor system prompt', () => {
  it('contains the required teaching and honesty rules', () => {
    expect(TUTOR_SYSTEM_PROMPT).toContain('Never claim to have checked a textbook');
    expect(TUTOR_SYSTEM_PROMPT).toContain('Do not fabricate citations');
    expect(TUTOR_SYSTEM_PROMPT).toContain('Offer one or two practice questions');
    expect(TUTOR_SYSTEM_PROMPT).toContain('Respect privacy');
  });

  it('adapts to the student context', () => {
    const prompt = buildTutorSystemPrompt('explain-simply', context);
    expect(prompt).toContain('Grade 10');
    expect(prompt).toContain('SEE Examination Preparation');
    expect(prompt).toContain('Mathematics, Science');
    expect(prompt).toContain('detailed step-by-step explanations');
  });

  it('gives every mode genuinely different instructions', () => {
    const prompts = TUTOR_MODE_IDS.map((mode) => buildTutorSystemPrompt(mode, context));
    const unique = new Set(prompts);
    expect(unique.size).toBe(TUTOR_MODE_IDS.length);
    expect(buildTutorSystemPrompt('quiz-me', context)).toContain('ONE question at a time');
    expect(buildTutorSystemPrompt('socratic', context)).toContain('guiding questions');
    expect(buildTutorSystemPrompt('quick-answer', context)).toContain('under 120 words');
    expect(buildTutorSystemPrompt('nepali', context)).toContain('Nepali');
    expect(buildTutorSystemPrompt('exam-prep', context)).toContain('Exam Preparation');
  });

  it('forces Nepali for the Nepali mode even when the profile language is English', () => {
    const prompt = buildTutorSystemPrompt('nepali', context);
    expect(prompt).toContain('Preferred language: Nepali');
  });
});

describe('study tool prompts', () => {
  it('defines the required sections for a revision summary', () => {
    const prompt = buildToolSystemPrompt('revision-summary', '9', 'en');
    for (const heading of ['Key concepts', 'Important definitions', 'Formulas', 'Common mistakes', 'Practice questions']) {
      expect(prompt).toContain(heading);
    }
  });

  it('asks the writing assistant to explain changes', () => {
    expect(buildToolSystemPrompt('writing-assistant', '7', 'en')).toContain('What I changed and why');
  });

  it('uses Nepali when requested', () => {
    expect(buildToolSystemPrompt('question-explainer', '8', 'ne')).toContain('Nepali');
  });
});

describe('quiz and flashcard prompts', () => {
  it('requests strict JSON for quizzes with explicit type rules', () => {
    const prompt = buildQuizUserPrompt({
      subject: 'Science',
      grade: '8',
      topic: 'Cells',
      difficulty: 'medium',
      count: 5,
      questionTypes: ['mcq', 'short-answer'],
      language: 'en',
    });
    expect(prompt).toContain('Return ONLY valid JSON');
    expect(prompt).toContain('"questions"');
    expect(prompt).toContain('Exactly 5 questions');
    expect(prompt).toContain('no external figures or copyrighted exam questions');
  });

  it('includes student notes in flashcard prompts when provided', () => {
    const prompt = buildFlashcardPrompt({
      topic: 'Photosynthesis',
      grade: '10',
      count: 6,
      notes: 'Light energy is captured by chlorophyll.',
    });
    expect(prompt).toContain('chlorophyll');
    expect(prompt).toContain('Exactly 6 cards');
  });
});
