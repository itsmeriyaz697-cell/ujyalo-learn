/** Label maps shared by server prompts and the client. */

export const CURRICULUM_LABELS: Record<string, string> = {
  'nepal-national': 'Nepal National Curriculum (CDC)',
  'see-preparation': 'SEE Examination Preparation (Nepal)',
  cbse: 'CBSE (India)',
  icse: 'ICSE (India)',
  cambridge: 'Cambridge IGCSE / AS / A Level',
  ib: 'International Baccalaureate',
  'common-core': 'US Common Core',
  other: 'General / unspecified curriculum',
};

export const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  ne: 'Nepali (नेपाली)',
  hi: 'Hindi (हिन्दी)',
  other: 'the student’s preferred language',
};

export const STYLE_LABELS: Record<string, string> = {
  simple: 'simple, friendly language with everyday examples',
  'step-by-step': 'detailed step-by-step explanations',
  'exam-focused': 'exam-focused points, marks-style structure and common mistakes',
  concise: 'concise answers with only the essentials',
  story: 'stories, analogies and real-life comparisons',
};

export function gradeLabel(value: string): string {
  if (value === 'see') return 'SEE preparation (Nepal, Grade 10 level)';
  if (value === 'grade11-12') return 'Grade 11–12 (higher secondary)';
  if (/^\d+$/.test(value)) return `Grade ${value}`;
  return value || 'unspecified grade';
}

export function subjectLabel(id: string): string {
  const map: Record<string, string> = {
    mathematics: 'Mathematics',
    science: 'Science',
    english: 'English',
    nepali: 'Nepali',
    'social-studies': 'Social Studies',
    'computer-science': 'Computer Science',
    'optional-mathematics': 'Optional Mathematics',
    'health-physical-education': 'Health & Physical Education',
    economics: 'Economics',
  };
  return map[id] ?? id;
}
