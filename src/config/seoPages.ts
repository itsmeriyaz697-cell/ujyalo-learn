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
  if (!page) {
    throw new Error(`No SEO metadata registered for "${path}". Add it to shared/seo-pages.json.`);
  }
  return { title: page.title, description: page.description, path: page.path };
}
