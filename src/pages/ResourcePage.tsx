import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, CalendarDays, FileText, ShieldCheck } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Section } from '@/components/marketing/Section';
import { Button } from '@/components/ui/Button';
import { contentStore, useContent } from '@/features/content/ContentProvider';
import { RESOURCE_TYPE_LABEL, type Resource } from '@/features/content/types';
import { getSubject } from '@/config/curriculum';
import NotFoundPage from './NotFoundPage';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export default function ResourcePage() {
  const { slug = '' } = useParams();
  const { publishedResources: resources, loading } = useContent();
  const [resource, setResource] = useState<Resource | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fromContext = resources.find((item) => item.slug === slug);
      if (fromContext) {
        if (!cancelled) {
          setResource(fromContext);
          setState('ready');
        }
        return;
      }
      setState('loading');
      const found = await contentStore.getResource(slug);
      if (cancelled) return;
      setResource(found);
      setState(found ? 'ready' : 'missing');
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, resources]);

  if (state === 'missing' && !loading) return <NotFoundPage />;
  if (state === 'loading' || !resource) {
    return (
      <Section>
        <div className="card h-72 animate-pulse" style={{ background: 'var(--surface-2)' }} aria-busy="true">
          <span className="sr-only">Loading resource…</span>
        </div>
      </Section>
    );
  }

  const subject = getSubject(resource.subjectId ?? '');

  return (
    <>
      <Seo
        title={`${resource.title} — Ujyalo Learn`}
        description={resource.description}
        path={`/resources/${resource.slug}`}
      />

      <Section className="!pb-6">
        <Link to="/resources" className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--muted)' }}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All resources
        </Link>

        <article className="mt-5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
            <span className="inline-flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              {RESOURCE_TYPE_LABEL[resource.type]}
            </span>
            {subject && <span>· {subject.name}</span>}
            {resource.grade && <span>· Grade {resource.grade}</span>}
          </div>

          <h1 className="section-title mt-2">{resource.title}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-soft">{resource.description}</p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--muted)' }}>
            <span>{resource.source}</span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3" aria-hidden="true" /> Updated {formatDate(resource.updatedAt)}
            </span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" /> {resource.license}
            </span>
          </div>

          <div className="prose-ujyalo mt-7 space-y-4 text-[15px]">
            {resource.body.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          {resource.fileUrl ? (
            <div className="mt-7">
              <Button asChild variant="secondary">
                <a href={resource.fileUrl} target="_blank" rel="noreferrer noopener">
                  Open the attached file <ArrowUpRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </a>
              </Button>
            </div>
          ) : (
            <p className="mt-6 text-xs" style={{ color: 'var(--muted)' }}>
              This resource is written directly on this page — there is no download, so nothing can be out of date
              compared with the text above.
            </p>
          )}
        </article>
      </Section>

      <Section tone="surface" className="!pt-10">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card p-5">
            <h2 className="text-base font-bold">Put it into practice</h2>
            <p className="mt-2 text-sm text-soft">Open the tutor with a question about this topic, or turn it into cards.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link to="/app/tutor">Ask the tutor</Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link to="/app/flashcards">Make flashcards</Link>
              </Button>
            </div>
          </div>
          <div className="card p-5">
            <h2 className="text-base font-bold">Something wrong?</h2>
            <p className="mt-2 text-sm text-soft">
              If a fact here is incorrect or attribution is missing, tell us and it will be reviewed and corrected.
            </p>
            <div className="mt-4">
              <Button asChild size="sm" variant="secondary">
                <Link to="/contact">Report an issue</Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
