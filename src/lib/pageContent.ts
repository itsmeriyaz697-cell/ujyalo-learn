import content from '../../shared/page-content.json';

/**
 * Accessors for the shared marketing body copy.
 *
 * Kept in their own module so the component file exports only components —
 * a mixed module breaks React Fast Refresh, and the lint rule that says so is
 * right.
 */
export interface ContentSection {
  heading: string;
  body: string[];
  bullets?: string[];
}

interface PageContentEntry {
  path: string;
  sections: ContentSection[];
}

const PAGES = (content as { pages: PageContentEntry[] }).pages;
const GRADE_BANDS = (content as { gradeBands: Record<string, ContentSection> }).gradeBands;

export function pageContentFor(path: string): ContentSection[] {
  return PAGES.find((page) => page.path === path)?.sections ?? [];
}

export function gradeBandFor(grade: number): ContentSection[] {
  const key = grade <= 5 ? '1-5' : grade <= 8 ? '6-8' : grade <= 10 ? '9-10' : '11-12';
  const band = GRADE_BANDS[key];
  return band ? [band] : [];
}
