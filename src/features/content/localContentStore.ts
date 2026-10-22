import type { ContentStore } from './store';
import type { AuditEvent, Course, Resource, SiteSettings } from './types';
import { DEFAULT_SETTINGS, SEED_COURSES, SEED_RESOURCES } from './seed';

/**
 * Browser-only content store used when Firebase is not configured.
 *
 * It exists so the library and the admin screens can be exercised honestly in
 * a demo. The UI labels every screen in this mode; nothing here is published
 * to a server and nothing is shared between devices.
 */

const KEYS = {
  courses: 'ujyalo:content:courses:v1',
  resources: 'ujyalo:content:resources:v1',
  settings: 'ujyalo:content:settings:v1',
  audit: 'ujyalo:content:audit:v1',
  seeded: 'ujyalo:content:seeded:v1',
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — the caller shows an error state */
  }
}

function seedOnce() {
  try {
    if (localStorage.getItem(KEYS.seeded)) return;
    write(KEYS.courses, SEED_COURSES);
    write(KEYS.resources, SEED_RESOURCES);
    write(KEYS.settings, DEFAULT_SETTINGS);
    write(KEYS.audit, []);
    localStorage.setItem(KEYS.seeded, '1');
  } catch {
    /* private mode: fall back to in-memory seeds below */
  }
}

function courses(): Course[] {
  seedOnce();
  const stored = read<Course[]>(KEYS.courses, []);
  return stored.length ? stored : SEED_COURSES;
}

function resources(): Resource[] {
  seedOnce();
  const stored = read<Resource[]>(KEYS.resources, []);
  return stored.length ? stored : SEED_RESOURCES;
}

const byNewest = (a: { updatedAt: string }, b: { updatedAt: string }) => b.updatedAt.localeCompare(a.updatedAt);

export const localContentStore: ContentStore = {
  mode: 'local',

  async listCourses({ includeDrafts = false } = {}) {
    return courses()
      .filter((course) => includeDrafts || course.status === 'published')
      .sort(byNewest);
  },

  async getCourse(slug, { includeDrafts = false } = {}) {
    return (
      courses().find(
        (course) => course.slug === slug && (includeDrafts || course.status === 'published'),
      ) ?? null
    );
  },

  async saveCourse(course) {
    const all = courses();
    const index = all.findIndex((item) => item.id === course.id);
    const next = index >= 0 ? all.map((item) => (item.id === course.id ? course : item)) : [course, ...all];
    write(KEYS.courses, next);
  },

  async deleteCourse(id) {
    write(KEYS.courses, courses().filter((course) => course.id !== id));
  },

  async listResources({ includeDrafts = false } = {}) {
    return resources()
      .filter((resource) => includeDrafts || resource.status === 'published')
      .sort(byNewest);
  },

  async getResource(slug, { includeDrafts = false } = {}) {
    return (
      resources().find(
        (resource) => resource.slug === slug && (includeDrafts || resource.status === 'published'),
      ) ?? null
    );
  },

  async saveResource(resource) {
    const all = resources();
    const index = all.findIndex((item) => item.id === resource.id);
    const next =
      index >= 0 ? all.map((item) => (item.id === resource.id ? resource : item)) : [resource, ...all];
    write(KEYS.resources, next);
  },

  async deleteResource(id) {
    write(KEYS.resources, resources().filter((resource) => resource.id !== id));
  },

  async getSettings(): Promise<SiteSettings> {
    seedOnce();
    return read<SiteSettings>(KEYS.settings, DEFAULT_SETTINGS);
  },

  async saveSettings(settings) {
    write(KEYS.settings, settings);
  },

  async listAudit(limit = 50) {
    return read<AuditEvent[]>(KEYS.audit, []).slice(0, limit);
  },

  async logAudit(event) {
    const all = read<AuditEvent[]>(KEYS.audit, []);
    write(KEYS.audit, [event, ...all].slice(0, 200));
  },
};
