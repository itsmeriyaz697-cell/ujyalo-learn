import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Section } from '@/components/marketing/Section';
import { useContent } from '@/features/content/ContentProvider';
import { RESOURCE_TYPE_LABEL } from '@/features/content/types';

interface Hit {
  title: string;
  description: string;
  href: string;
  kind: 'Course' | 'Resource' | 'Page';
}

const STATIC_PAGES: Hit[] = [
  { title: 'Grades', description: 'Grade-by-grade study hubs', href: '/grades/9', kind: 'Page' },
  { title: 'SEE preparation', description: 'How to prepare without cramming', href: '/see-preparation', kind: 'Page' },
  { title: 'Subjects', description: 'Every subject the tutor covers', href: '/subjects', kind: 'Page' },
  { title: 'Pricing', description: 'What is free and what is planned', href: '/pricing', kind: 'Page' },
  { title: 'FAQ', description: 'Straight answers to common questions', href: '/faq', kind: 'Page' },
  { title: 'Help', description: 'Getting started and troubleshooting', href: '/help', kind: 'Page' },
];

const score = (haystack: string, needle: string) => {
  const h = haystack.toLowerCase();
  if (h.startsWith(needle)) return 3;
  if (h.includes(needle)) return 2;
  const words = needle.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.every((word) => h.includes(word))) return 1;
  return 0;
};

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const { publishedCourses: courses, publishedResources: resources } = useContent();

  const hits = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    const pool: Hit[] = [
      ...courses.map((course) => ({
        title: course.title,
        description: course.summary,
        href: `/courses/${course.slug}`,
        kind: 'Course' as const,
      })),
      ...resources.map((resource) => ({
        title: resource.title,
        description: resource.description,
        href: `/resources/${resource.slug}`,
        kind: 'Resource' as const,
      })),
      ...STATIC_PAGES,
    ];

    return pool
      .map((hit) => ({ hit, points: score(`${hit.title} ${hit.description} ${hit.kind}`, needle) }))
      .filter((entry) => entry.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 30)
      .map((entry) => entry.hit);
  }, [query, courses, resources]);

  return (
    <>
      <Seo
        title="Search — Ujyalo Learn"
        description="Search Ujyalo Learn courses, study guides and pages."
        path="/search"
        noindex
      />

      <Section className="!pb-8">
        <p className="eyebrow">Search</p>
        <h1 className="section-title mt-2">Find a course or guide</h1>

        <form
          className="mt-6 max-w-2xl"
          onSubmit={(event) => {
            event.preventDefault();
            const next = new URLSearchParams();
            if (query.trim()) next.set('q', query.trim());
            setParams(next, { replace: true });
          }}
          role="search"
        >
          <label className="relative block">
            <span className="sr-only">Search courses and resources</span>
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: 'var(--muted)' }}
              aria-hidden="true"
            />
            <input
              className="input pl-9"
              placeholder="Try “fractions”, “SEE”, “study plan”"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
            />
          </label>
        </form>

        {query.trim() && (
          <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }} aria-live="polite">
            {hits.length} result{hits.length === 1 ? '' : 's'} for “{query.trim()}”
          </p>
        )}
      </Section>

      <Section tone="surface" className="!pt-8">
        {!query.trim() ? (
          <p className="text-sm text-soft">Type a topic to search the library. Searches are not stored on our servers.</p>
        ) : hits.length === 0 ? (
          <div className="card max-w-xl p-6">
            <h2 className="text-base font-semibold">Nothing matched</h2>
            <p className="mt-2 text-sm text-soft">
              Try a broader word, or ask the tutor directly — it does not need a matching course to help.
            </p>
            <div className="mt-4">
              <Link to="/app/tutor" className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                Ask the tutor instead →
              </Link>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {hits.map((hit) => (
              <li key={`${hit.kind}-${hit.href}`}>
                <Link to={hit.href} className="card card-hover block p-5">
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                    {hit.kind}
                    {hit.kind === 'Resource' ? ` · ${RESOURCE_TYPE_LABEL.guide}` : ''}
                  </span>
                  <h2 className="mt-1 text-[15px] font-semibold">{hit.title}</h2>
                  <p className="mt-1 text-sm text-soft">{hit.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
