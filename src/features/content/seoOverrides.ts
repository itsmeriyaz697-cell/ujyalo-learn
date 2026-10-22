import type { SeoOverride } from './types';

/**
 * Runtime registry of editorial SEO overrides.
 *
 * The `Seo` component is rendered in dozens of places, some of them outside
 * any provider subtree, so the overrides are kept in a tiny module store rather
 * than a React context. `ContentProvider` is the only writer.
 */
let registry: Record<string, SeoOverride> = {};
let version = 0;
const listeners = new Set<() => void>();

export function setSeoOverrides(next: Record<string, SeoOverride>) {
  registry = next;
  version += 1;
  listeners.forEach((listener) => listener());
}

export function getSeoOverride(path: string): SeoOverride | undefined {
  return registry[path];
}

export function subscribeSeoOverrides(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function seoOverridesVersion(): number {
  return version;
}
