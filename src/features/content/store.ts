import type { AuditEvent, Course, Resource, SeoOverride, SiteSettings } from './types';

/**
 * Content storage contract.
 *
 * Two implementations, chosen once per session exactly like the student data
 * store:
 *  - FirestoreContentStore — shared content, writes gated by security rules
 *    and an `admin` custom claim / role document.
 *  - LocalContentStore — browser-only demo library, seeded with the starter
 *    content so the public pages and the admin preview both work with no
 *    Firebase project.
 */
export interface ContentStore {
  mode: 'firebase' | 'local';

  listCourses(options?: { includeDrafts?: boolean }): Promise<Course[]>;
  getCourse(slug: string, options?: { includeDrafts?: boolean }): Promise<Course | null>;
  saveCourse(course: Course): Promise<void>;
  deleteCourse(id: string): Promise<void>;

  listResources(options?: { includeDrafts?: boolean }): Promise<Resource[]>;
  getResource(slug: string, options?: { includeDrafts?: boolean }): Promise<Resource | null>;
  saveResource(resource: Resource): Promise<void>;
  deleteResource(id: string): Promise<void>;

  getSettings(): Promise<SiteSettings>;
  /**
   * Whether the settings document genuinely exists in storage.
   *
   * Needed because `getSettings()` returns defaults when nothing is stored —
   * an object that is indistinguishable from a saved one. Anything that offers
   * to import or repair the settings needs to tell "absent" from "present".
   */
  hasStoredSettings(): Promise<boolean>;
  saveSettings(settings: SiteSettings): Promise<void>;

  listSeoOverrides(): Promise<SeoOverride[]>;
  saveSeoOverride(override: SeoOverride): Promise<void>;

  listAudit(limit?: number): Promise<AuditEvent[]>;
  logAudit(event: AuditEvent): Promise<void>;
}

export type AdminRole = 'owner' | 'admin' | 'editor' | 'student';

export const ROLE_LABEL: Record<AdminRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  student: 'Student',
};

/** Editors may write content but never settings or roles. */
export function canManageContent(role: AdminRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'editor';
}

export function canManageSettings(role: AdminRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function canManageRoles(role: AdminRole): boolean {
  return role === 'owner';
}
