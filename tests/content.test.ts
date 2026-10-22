import { describe, expect, it } from 'vitest';
import { isValidSlug, slugify, isPublic } from '../src/features/content/types';
import { canManageContent, canManageRoles, canManageSettings } from '../src/features/content/store';
import seedJson from '../shared/content-seed.json';
import type { Course, Resource } from '../src/features/content/types';

const seed = seedJson as { courses: Course[]; resources: Resource[] };

describe('slugs', () => {
  it('slugifies titles into URL-safe strings', () => {
    expect(slugify('SEE Mathematics — Core Skills')).toBe('see-mathematics-core-skills');
    expect(slugify('Fractions & Decimals (Grade 6)')).toBe('fractions-decimals-grade-6');
    expect(slugify('  multiple   spaces  ')).toBe('multiple-spaces');
  });

  it('strips characters that would break a URL', () => {
    expect(slugify('Nepali/Grammar?')).toBe('nepaligrammar');
    expect(slugify('a'.repeat(80))).toHaveLength(60);
  });

  it('rejects slugs that are not lowercase-hyphenated', () => {
    expect(isValidSlug('see-mathematics')).toBe(true);
    expect(isValidSlug('See-Mathematics')).toBe(false);
    expect(isValidSlug('see_mathematics')).toBe(false);
    expect(isValidSlug('-leading')).toBe(false);
    expect(isValidSlug('ab')).toBe(false);
    expect(isValidSlug('a'.repeat(61))).toBe(false);
  });
});

describe('role permissions', () => {
  it('lets editors manage content but not settings or roles', () => {
    expect(canManageContent('editor')).toBe(true);
    expect(canManageSettings('editor')).toBe(false);
    expect(canManageRoles('editor')).toBe(false);
  });

  it('only the owner can change roles', () => {
    expect(canManageRoles('owner')).toBe(true);
    expect(canManageRoles('admin')).toBe(false);
  });

  it('keeps students out of every admin capability', () => {
    expect(canManageContent('student')).toBe(false);
    expect(canManageSettings('student')).toBe(false);
    expect(canManageRoles('student')).toBe(false);
  });
});

describe('seed content integrity', () => {
  const courses = seed.courses;
  const resources = seed.resources;

  it('has unique slugs across courses and resources', () => {
    const courseSlugs = courses.map((course) => course.slug);
    const resourceSlugs = resources.map((resource) => resource.slug);
    expect(new Set(courseSlugs).size).toBe(courseSlugs.length);
    expect(new Set(resourceSlugs).size).toBe(resourceSlugs.length);
    courseSlugs.forEach((slug) => expect(isValidSlug(slug)).toBe(true));
    resourceSlugs.forEach((slug) => expect(isValidSlug(slug)).toBe(true));
  });

  it('only publishes content that carries its attribution', () => {
    const published = resources.filter(isPublic);
    expect(published.length).toBeGreaterThan(0);
    published.forEach((resource) => {
      expect(resource.source.trim().length).toBeGreaterThan(0);
      expect(resource.license.trim().length).toBeGreaterThan(0);
    });
  });

  it('never claims to be official, affiliated, or statistically popular', () => {
    const text = JSON.stringify(courses) + JSON.stringify(resources);
    // Affirmative claims are the problem. Mentions inside a negation
    // ("we do not publish official model questions") are honest and allowed.
    expect(text).not.toMatch(/(is|are)\s+(the\s+)?official/i);
    expect(text).not.toMatch(/official\s+(Ujyalo|platform|source)/i);
    expect(text).not.toMatch(/affiliat/i);
    expect(text).not.toMatch(/10,000|95%|trusted by (thousands|students)|top-rated/i);
  });

  it('gives every course at least one lesson and two outcomes', () => {
    courses.forEach((course) => {
      expect(course.lessons.length).toBeGreaterThan(0);
      expect(course.outcomes.length).toBeGreaterThanOrEqual(2);
      expect(course.gradeMin).toBeLessThanOrEqual(course.gradeMax);
    });
  });

  it('keeps reading lessons short enough to render on a phone', () => {
    courses.forEach((course) => {
      course.lessons
        .filter((lesson) => lesson.action === 'reading')
        .forEach((lesson) => expect((lesson.body ?? '').length).toBeLessThan(600));
    });
  });
});

describe('status handling', () => {
  it('treats only published content as public', () => {
    expect(isPublic({ status: 'published' })).toBe(true);
    expect(isPublic({ status: 'draft' })).toBe(false);
    expect(isPublic({ status: 'archived' })).toBe(false);
  });
});
