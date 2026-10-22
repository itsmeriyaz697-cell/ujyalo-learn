/**
 * Curriculum, subject and personalisation configuration.
 *
 * Everything here is *configurable data*, not hard-coded claims about any
 * official syllabus. Ujyalo Learn's AI explanations are clearly labelled as
 * AI-generated and are not official curriculum material.
 */

export interface SubjectConfig {
  id: string;
  name: string;
  short: string;
  description: string;
  minGrade: number;
  maxGrade: number;
  color: string;
  examRelevant: boolean;
}

export const SUBJECTS: SubjectConfig[] = [
  {
    id: 'mathematics',
    name: 'Mathematics',
    short: 'Maths',
    description: 'Arithmetic, algebra, geometry, trigonometry, calculus and problem solving.',
    minGrade: 1,
    maxGrade: 12,
    color: '#3B61F0',
    examRelevant: true,
  },
  {
    id: 'science',
    name: 'Science',
    short: 'Science',
    description: 'Physics, chemistry and biology concepts with everyday examples.',
    minGrade: 1,
    maxGrade: 12,
    color: '#0E9F6E',
    examRelevant: true,
  },
  {
    id: 'english',
    name: 'English',
    short: 'English',
    description: 'Grammar, reading comprehension, vocabulary and writing skills.',
    minGrade: 1,
    maxGrade: 12,
    color: '#7C3AED',
    examRelevant: true,
  },
  {
    id: 'nepali',
    name: 'Nepali',
    short: 'Nepali',
    description: 'नेपाली व्याकरण, पठन बोध, लेखन र साहित्य।',
    minGrade: 1,
    maxGrade: 12,
    color: '#DC2626',
    examRelevant: true,
  },
  {
    id: 'social-studies',
    name: 'Social Studies',
    short: 'Social',
    description: 'History, geography, civics and society — facts separated from interpretation.',
    minGrade: 4,
    maxGrade: 12,
    color: '#B45309',
    examRelevant: true,
  },
  {
    id: 'computer-science',
    name: 'Computer Science',
    short: 'Computer',
    description: 'Programming basics, logic, computer systems and digital literacy.',
    minGrade: 6,
    maxGrade: 12,
    color: '#0891B2',
    examRelevant: false,
  },
  {
    id: 'optional-mathematics',
    name: 'Optional Mathematics',
    short: 'Opt. Maths',
    description: 'Additional maths topics for secondary and SEE-level students.',
    minGrade: 8,
    maxGrade: 12,
    color: '#2563EB',
    examRelevant: true,
  },
  {
    id: 'health-physical-education',
    name: 'Health & Physical Education',
    short: 'HPE',
    description: 'Health, nutrition, safety, physical activity and well-being.',
    minGrade: 1,
    maxGrade: 12,
    color: '#059669',
    examRelevant: false,
  },
  {
    id: 'economics',
    name: 'Economics',
    short: 'Economics',
    description: 'Basic economic ideas, markets, development and current issues.',
    minGrade: 9,
    maxGrade: 12,
    color: '#BE185D',
    examRelevant: false,
  },
];

export const getSubject = (id: string): SubjectConfig | undefined =>
  SUBJECTS.find((s) => s.id === id);

export const subjectsForGrade = (grade: number): SubjectConfig[] =>
  SUBJECTS.filter((s) => grade >= s.minGrade && grade <= s.maxGrade);

export interface GradeOption {
  value: string;
  label: string;
  level: number | null;
  examPrep?: boolean;
}

export const GRADES: GradeOption[] = [
  ...Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `Grade ${i + 1}`,
    level: i + 1,
  })),
  { value: 'see', label: 'SEE Preparation', level: 10, examPrep: true },
  { value: 'grade11-12', label: 'Grade 11–12 (Higher Secondary)', level: 11 },
];

export const gradeLabel = (value: string): string =>
  GRADES.find((g) => g.value === value)?.label ?? `Grade ${value}`;

export interface CurriculumOption {
  id: string;
  label: string;
  region: string;
  note: string;
}

/**
 * Curricula are *learning context* for the AI tutor. Ujyalo Learn does not
 * bundle official textbooks, and never claims its explanations are official
 * curriculum material.
 */
export const CURRICULA: CurriculumOption[] = [
  {
    id: 'nepal-national',
    label: 'Nepal National Curriculum (CDC)',
    region: 'Nepal',
    note: 'General school learning aligned to Nepali school subjects and grade levels.',
  },
  {
    id: 'see-preparation',
    label: 'SEE Examination Preparation',
    region: 'Nepal',
    note: 'Revision-style practice for the Secondary Education Examination.',
  },
  {
    id: 'cbse',
    label: 'CBSE',
    region: 'India',
    note: 'Central Board of Secondary Education style practice.',
  },
  {
    id: 'icse',
    label: 'ICSE',
    region: 'India',
    note: 'Council for the Indian School Certificate Examinations style practice.',
  },
  {
    id: 'cambridge',
    label: 'Cambridge (IGCSE / AS / A Level)',
    region: 'International',
    note: 'Cambridge-style concept explanations and practice.',
  },
  {
    id: 'ib',
    label: 'International Baccalaureate (IB)',
    region: 'International',
    note: 'Inquiry-oriented explanations and practice.',
  },
  {
    id: 'common-core',
    label: 'US Common Core',
    region: 'United States',
    note: 'Common Core style maths and English practice.',
  },
  {
    id: 'other',
    label: 'Other / Not sure',
    region: 'Anywhere',
    note: 'The tutor will use your grade level and questions only.',
  },
];

export const CURRICULUM_IDS = CURRICULA.map((c) => c.id);

export const getCurriculum = (id: string) => CURRICULA.find((c) => c.id === id);

export interface CountryOption {
  code: string;
  name: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: 'NP', name: 'Nepal' },
  { code: 'IN', name: 'India' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'BT', name: 'Bhutan' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'OTHER', name: 'Other' },
];

export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ne', label: 'Nepali', native: 'नेपाली' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'other', label: 'Another language', native: 'Other' },
];

export const LEARNING_GOALS = [
  { id: 'exam-prep', label: 'Prepare for exams', description: 'Revision, practice questions and exam technique.' },
  { id: 'homework', label: 'Get homework help', description: 'Understand homework instead of just copying answers.' },
  { id: 'concepts', label: 'Understand difficult concepts', description: 'Clear explanations of topics that feel confusing.' },
  { id: 'regular-practice', label: 'Practise regularly', description: 'Build a steady study habit with short sessions.' },
  { id: 'improve-grades', label: 'Improve my grades', description: 'Work on strengths and weaknesses across subjects.' },
  { id: 'self-paced', label: 'Learn at my own pace', description: 'No pressure — revisit topics whenever you need.' },
];

export const EXPLANATION_STYLES = [
  { id: 'simple', label: 'Simple and friendly', description: 'Everyday words, short sentences and familiar examples.' },
  { id: 'step-by-step', label: 'Step-by-step detailed', description: 'Every step shown and explained, from start to finish.' },
  { id: 'exam-focused', label: 'Exam focused', description: 'Key points, marks scheme ideas and common mistakes.' },
  { id: 'concise', label: 'Concise', description: 'Just the essentials, quickly.' },
  { id: 'story', label: 'Stories and analogies', description: 'Learn through comparisons and real-life situations.' },
];

import type { TutorModeId } from '@shared/constants';

export interface TutorModeConfig {
  id: TutorModeId;
  label: string;
  description: string;
  icon: string;
}

/**
 * Tutoring modes. The `id` is sent to the server, which maps it to a
 * dedicated instruction block. Modes genuinely change tutor behaviour.
 */
export const TUTOR_MODES: TutorModeConfig[] = [
  { id: 'explain-simply', label: 'Explain Simply', description: 'Easy explanations with everyday examples.', icon: 'Lightbulb' },
  { id: 'step-by-step', label: 'Step-by-Step', description: 'Detailed reasoning and worked solutions.', icon: 'ListOrdered' },
  { id: 'exam-prep', label: 'Exam Preparation', description: 'Revision priorities, marks and practice.', icon: 'GraduationCap' },
  { id: 'quiz-me', label: 'Quiz Me', description: 'Interactive questions with feedback.', icon: 'CircleHelp' },
  { id: 'socratic', label: 'Socratic Tutor', description: 'Guiding questions before solutions.', icon: 'MessagesSquare' },
  { id: 'quick-answer', label: 'Quick Answer', description: 'Concise answer with essential context.', icon: 'Zap' },
  { id: 'nepali', label: 'Nepali Explanation', description: 'नेपालीमा स्पष्टीकरण।', icon: 'Languages' },
];

export type { TutorModeId } from '@shared/constants';

/** Non-chat study tools, all backed by the same AI service. */
export const STUDY_TOOLS = [
  { id: 'revision-summary', label: 'Revision summary', description: 'Key concepts, definitions, formulas, examples, mistakes and practice.', path: '/app/tools/revision-summary' },
  { id: 'formula-helper', label: 'Formula helper', description: 'Understand what a formula means, its units and a worked example.', path: '/app/tools/formula-helper' },
  { id: 'writing-assistant', label: 'Writing assistant', description: 'Improve clarity and grammar while explaining each change.', path: '/app/tools/writing-assistant' },
  { id: 'question-explainer', label: 'Question explainer', description: 'Paste a question and get a grade-appropriate explanation.', path: '/app/tools/question-explainer' },
];

export const PRICING_TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: 'Rs 0',
    period: 'forever',
    tagline: 'Everything you need to start learning today.',
    available: true,
    features: [
      'AI tutor with all tutoring modes',
      'Daily AI request allowance',
      'Quizzes with explanations',
      'Notes, flashcards and study planner',
      'Basic progress tracking',
    ],
    limits: 'AI requests and quiz generation are rate-limited to keep the service affordable.',
    cta: 'Start Learning Free',
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 'Planned',
    period: 'future',
    tagline: 'More practice, more explanations, more support.',
    available: false,
    features: [
      'Higher daily AI usage limits',
      'Longer revision summaries and flashcard decks',
      'Advanced progress insights',
      'Priority support',
    ],
    limits: 'Not available yet. No payment is collected on this site.',
    cta: 'Coming later',
  },
  {
    id: 'school',
    name: 'School',
    price: 'Planned',
    period: 'future',
    tagline: 'For teachers and classrooms that need group tools.',
    available: false,
    features: [
      'Classroom management',
      'Teacher-created study sets',
      'Group usage reporting',
      'Admin controls',
    ],
    limits: 'Not available yet. Requires additional privacy and safety review.',
    cta: 'Contact us',
  },
];

export const SITE = {
  name: 'Ujyalo Learn',
  tagline: 'Learn Smarter. Shine Brighter.',
  description:
    'Ujyalo Learn is an AI-powered learning and tutoring platform for students in Nepal and beyond. Understand difficult concepts, practise questions and prepare for exams with a patient personal AI tutor.',
  founder: 'Riyaz Chalise',
  /**
   * The owner supplies the real production domain through VITE_SITE_URL.
   * When it is missing we return an empty string and canonical/og:url tags are
   * omitted entirely rather than advertising a domain that is not ours.
   */
  get url(): string {
    const fromEnv = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SITE_URL : undefined;
    return (fromEnv ?? '').trim().replace(/\/$/, '');
  },
};
