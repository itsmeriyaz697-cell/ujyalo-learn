import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookMarked, FileText, Library, Search, X } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { seoFor } from '@/config/seoPages';
import { Section } from '@/components/marketing/Section';
import { Button } from '@/components/ui/Button';
import { InlineAlert } from '@/components/ui/Feedback';
import { useContent } from '@/features/content/ContentProvider';
import { RESOURCE_TYPE_LABEL, type ResourceType } from '@/features/content/types';
import { SUBJECTS, getSubject } from '@/config/curriculum';

const TYPES: (ResourceType | 'all')[] = ['all', 'guide', 'notes', 'practice', 'formula', 'syllabus'];

export default function ResourcesPage() {
  const { publishedResources: resources, loading, error } = useContent();
  const [query, setQuery] = useState('');
  const [type, setType] = useState<ResourceType | 'all'>('all');
  const [subject, setSubject] = useState('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((resource) => {
      if (type !== 'all' && resource.type !== type) return false;
      if (subject !== 'all' && resource.subjectId !== subject) return false;
      if (!q) return true;
      return `${resource.title} ${resource.description} ${resource.tags.join(' ')}`.toLowerCase().includes(q);
    });
  }, [resources, query, type, subject]);

  return (
    <>
      <Seo {...seoFor('/resources')} />

      <Section className="!pb-6">
        <div className="max-w-3xl">
          <p className="eyebrow">Resources</p>
          <h1 className="section-title mt-2">Guides written to be used, not skimmed</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-soft sm:text-base">
            Short, original notes on studying, revision and exam technique. Everything here is written by Ujyalo Learn
            and clearly attributed — we do not host textbooks we do not have the rights to.
          </p>
        </div>

        <div className="mt-7 flex flex-wrap gap-1.5" role="tablist" aria-label="Resource type">
          {TYPES.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={type === item}
              onClick={() => setType(item)}
              className="chip"
              style={
                type === item
                  ? { background: 'var(--primary)', color: '#fff', borderColor: 'transparent' }
                  : undefined
              }
            >
              {item === 'all' ? 'All resources' : RESOURCE_TYPE_LABEL[item]}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <label className="relative block">
            <span className="sr-only">Search resources</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: 'var(--muted)' }}
              aria-hidden="true"
            />
            <input
              className="input pl-9"
              placeholder="Search resources"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="sr-only">Subject</span>
            <select className="input" value={subject} onChange={(event) => setSubject(event.target.value)}>
              <option value="all">All subjects</option>
              {SUBJECTS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Section>

      <Section tone="surface" className="!pt-2">
        {error && (
          <div className="mb-6">
            <InlineAlert tone="warning">{error}</InlineAlert>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {[0, 1, 2].map((key) => (
              <div key={key} className="card h-44 animate-pulse" style={{ background: 'var(--surface-2)' }} />
            ))}
            <span className="sr-only">Loading resources…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card mx-auto max-w-xl p-8 text-center">
            <Library className="mx-auto h-8 w-8" style={{ color: 'var(--muted)' }} aria-hidden="true" />
            <h2 className="mt-3 text-lg font-semibold">Nothing here yet</h2>
            <p className="mt-2 text-sm text-soft">
              No resource matches that search. Clear the filters, or ask the tutor and save the answer as a note.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery('');
                  setType('all');
                  setSubject('all');
                }}
              >
                <X className="mr-1 h-4 w-4" aria-hidden="true" /> Clear filters
              </Button>
              <Button asChild>
                <Link to="/app/tutor">Ask the tutor</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((resource) => {
              const subjectMeta = getSubject(resource.subjectId ?? '');
              return (
                <Link key={resource.id} to={`/resources/${resource.slug}`} className="card card-hover flex flex-col p-5">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                      aria-hidden="true"
                    >
                      <FileText className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                      {RESOURCE_TYPE_LABEL[resource.type]}
                    </span>
                  </div>
                  <h2 className="mt-3 text-[16px] font-bold leading-snug">{resource.title}</h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-soft">{resource.description}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: 'var(--muted)' }}>
                    {subjectMeta && <span>{subjectMeta.name}</span>}
                    {resource.grade && <span>Grade {resource.grade}</span>}
                    <span className="inline-flex items-center gap-1">
                      <BookMarked className="h-3 w-3" aria-hidden="true" /> {resource.source}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Section>

      <Section className="!pt-10">
        <div className="card p-6">
          <h2 className="text-lg font-bold">Publishing policy</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-soft">
            Every resource shows who wrote it and under what licence. Ujyalo Learn does not upload scanned textbooks,
            copyrighted question papers, or material it cannot attribute. If you believe something here is misattributed,
            tell us and it will be reviewed.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link to="/content-policy">Read the content policy</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/contact">Report a problem</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
