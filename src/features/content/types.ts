/**
 * Content model for the learning library.
 *
 * Everything here is editorial content (courses, lessons, resources) that an
 * admin publishes — as opposed to `types/domain.ts`, which is student-owned
 * data (notes, quizzes, chats).
 *
 * Honesty rules baked into the shapes:
 *  - `status` is explicit, so drafts can never leak into the public site.
 *  - `source` and `license` are required on resources: we never present
 *    someone else's material as ours.
 *  - lessons describe *activities* (open the tutor, run a quiz) rather than
 *    storing invented textbook prose.
 */

export type ContentStatus = 'draft' | 'published' | 'archived';

export type CourseLevel = 'foundation' | 'school' | 'see' | 'plus-two';

export interface Lesson {
  id: string;
  title: string;
  /** One line describing what the student actually does. */
  summary: string;
  minutes: number;
  /** Where the lesson sends the student. */
  action: 'tutor' | 'quiz' | 'flashcards' | 'notes' | 'reading';
  /** Prompt used when the action opens the tutor. */
  prompt?: string;
  /** Short original guidance shown on the course page for 'reading' lessons. */
  body?: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  subjectId: string;
  gradeMin: number;
  gradeMax: number;
  level: CourseLevel;
  status: ContentStatus;
  /** Two learning outcomes, written as "You can …". */
  outcomes: string[];
  lessons: Lesson[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export type ResourceType = 'guide' | 'notes' | 'practice' | 'formula' | 'syllabus';

export interface Resource {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: ResourceType;
  subjectId: string | null;
  grade: number | null;
  status: ContentStatus;
  /** Original body text for guides written by Ujyalo Learn. */
  body: string[];
  /** External or storage link, if the resource is a file. Never invented. */
  fileUrl: string | null;
  /** Who wrote it. Required — no anonymous material. */
  source: string;
  license: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  contactEmail: string;
  /** Shown as a banner on every page when set. */
  maintenanceNotice: string;
  defaultLanguage: 'en' | 'ne';
  updatedAt: string;
  updatedBy: string;
}

export type AuditAction =
  | 'course.create'
  | 'course.update'
  | 'course.publish'
  | 'course.unpublish'
  | 'course.archive'
  | 'course.delete'
  | 'resource.create'
  | 'resource.update'
  | 'resource.publish'
  | 'resource.unpublish'
  | 'resource.archive'
  | 'resource.delete'
  | 'settings.update'
  | 'role.change';

export interface AuditEvent {
  id: string;
  at: string;
  actorId: string;
  actorEmail: string;
  action: AuditAction;
  entity: 'course' | 'resource' | 'settings' | 'user';
  entityId: string;
  summary: string;
}

export const LEVEL_LABEL: Record<CourseLevel, string> = {
  foundation: 'Foundation',
  school: 'Class 9–10',
  see: 'SEE preparation',
  'plus-two': 'Class 11–12',
};

export const RESOURCE_TYPE_LABEL: Record<ResourceType, string> = {
  guide: 'Study guide',
  notes: 'Notes',
  practice: 'Practice',
  formula: 'Formula sheet',
  syllabus: 'Syllabus',
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/^-|-$/g, '');
}

/** Slugs are part of public URLs, so they are validated before saving. */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 3 && slug.length <= 60;
}

export const isPublic = (item: { status: ContentStatus }): boolean => item.status === 'published';
