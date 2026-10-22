import { useEffect } from 'react';
import { SITE } from '@/config/curriculum';

interface SeoProps {
  title: string;
  description: string;
  /** Path beginning with "/" — used for canonical and og:url. */
  path?: string;
  image?: string;
  noindex?: boolean;
  /** Only pass structured data that is factually accurate. */
  jsonLd?: Record<string, unknown>;
}

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
}

/**
 * Client-side metadata for a single-page app.
 * Public pages get unique titles, descriptions and canonical URLs; private
 * pages set noindex so student data can never be indexed.
 */
export function Seo({ title, description, path = '/', image = '/og-image.png', noindex, jsonLd }: SeoProps) {
  const fullTitle = title.includes(SITE.name) ? title : `${title} · ${SITE.name}`;
  const canonical = SITE.url ? `${SITE.url}${path === '/' ? '' : path}` : '';
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    document.title = fullTitle;
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    if (canonical) setMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    setMeta('meta[property="og:image"]', 'property', 'og:image', image);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    if (canonical) setLink('canonical', canonical);
    else document.head.querySelector('link[rel="canonical"]')?.remove();

    let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    robots.content = noindex ? 'noindex, nofollow' : 'index, follow';

    let script: HTMLScriptElement | null = null;
    if (jsonLdString) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = jsonLdString;
      document.head.appendChild(script);
    }
    return () => {
      if (script) script.remove();
    };
  }, [fullTitle, description, canonical, image, noindex, jsonLdString]);

  return null;
}
