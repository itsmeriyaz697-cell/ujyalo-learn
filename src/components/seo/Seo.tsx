import { useEffect, useSyncExternalStore } from 'react';
import { SITE } from '@/config/curriculum';
import {
  getSeoOverride,
  seoOverridesVersion,
  subscribeSeoOverrides,
} from '@/features/content/seoOverrides';

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
  // Re-render when an editor saves an override in the admin panel.
  useSyncExternalStore(subscribeSeoOverrides, seoOverridesVersion, seoOverridesVersion);
  const override = getSeoOverride(path);

  const effectiveTitle = override?.title || title;
  const effectiveDescription = override?.description || description;
  const effectiveImage = override?.ogImage || image;
  const effectiveNoindex = noindex || Boolean(override?.noindex);

  const fullTitle = effectiveTitle.includes(SITE.name) ? effectiveTitle : `${effectiveTitle} · ${SITE.name}`;
  const canonical = SITE.url ? `${SITE.url}${path === '/' ? '' : path}` : '';
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    document.title = fullTitle;
    setMeta('meta[name="description"]', 'name', 'description', effectiveDescription);
    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMeta('meta[property="og:description"]', 'property', 'og:description', effectiveDescription);
    if (canonical) setMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    setMeta('meta[property="og:image"]', 'property', 'og:image', effectiveImage);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', effectiveDescription);
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', effectiveImage);
    if (canonical) setLink('canonical', canonical);
    else document.head.querySelector('link[rel="canonical"]')?.remove();

    let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    robots.content = effectiveNoindex ? 'noindex, nofollow' : 'index, follow';

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
  }, [fullTitle, effectiveDescription, canonical, effectiveImage, effectiveNoindex, jsonLdString]);

  return null;
}
