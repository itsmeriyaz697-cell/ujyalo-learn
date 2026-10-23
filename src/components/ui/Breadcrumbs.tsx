import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export type Crumb = { href?: string; label: string };

/**
 * Visible breadcrumb trail.
 *
 * Mirrors the BreadcrumbList JSON-LD and the prerendered trail in
 * scripts/generate-seo.mjs — if you change the shape of one, change all three,
 * otherwise search results and the page disagree.
 *
 * The last item is the current page: plain text, marked aria-current, never a link.
 */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  if (items.length < 2) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs" style={{ color: 'var(--muted)' }}>
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="h-3 w-3 shrink-0 opacity-60" aria-hidden="true" />
              )}
              {last || !item.href ? (
                <span aria-current={last ? 'page' : undefined} style={{ color: last ? 'var(--text-soft)' : undefined }}>
                  {item.label}
                </span>
              ) : (
                <Link to={item.href} className="rounded transition-colors hover:underline">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
