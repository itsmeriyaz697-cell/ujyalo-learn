import data from '../../shared/seo-pages.json';

/**
 * Single source of truth for the metadata of every indexable public page.
 *
 * The same JSON is read by `scripts/generate-seo.mjs`, which prerenders static
 * HTML for each route — so what a crawler sees and what the running app sets
 * in <head> can never drift apart.
 */
export interface SeoPage {
  path: string;
  title: string;
  description: string;
  priority: string;
  changefreq: string;
}

export const SEO_PAGES: SeoPage[] = data.pages as SeoPage[];

/** Metadata for a route, ready to spread into <Seo {...seoFor('/features')} />. */
export function seoFor(path: string): { title: string; description: string; path: string } {
  const page = SEO_PAGES.find((item) => item.path === path);
  if (page) return { title: page.title, description: page.description, path: page.path };

  // Grade hubs are generated from one pattern rather than twelve literals.
  const grade = /^\/grades\/(\d{1,2})$/.exec(path);
  if (grade) {
    const value = Number(grade[1]);
    if (value >= 1 && value <= 12) {
      return {
        title: `Grade ${value} — subjects, courses and study tools | Ujyalo Learn`,
        description: `What to study in Grade ${value} in Nepal: the subject list, published Ujyalo Learn courses that cover Grade ${value}, and the study tools that help at this stage.`,
        path,
      };
    }
  }

  throw new Error(`No SEO metadata registered for "${path}". Add it to shared/seo-pages.json.`);
}

/** Every indexable path, including the twelve grade hubs. */
export function indexablePaths(): string[] {
  return [...SEO_PAGES.map((page) => page.path), ...Array.from({ length: 12 }, (_, i) => `/grades/${i + 1}`)];
}
