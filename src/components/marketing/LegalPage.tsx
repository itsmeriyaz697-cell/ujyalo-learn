import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '@/components/seo/Seo';

export interface LegalSection {
  heading: string;
  body: ReactNode;
}

export function LegalPage({
  title,
  description,
  path,
  updated,
  intro,
  sections,
}: {
  title: string;
  description: string;
  path: string;
  updated: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <>
      <Seo title={title} description={description} path={path} />
      <div className="container-page max-w-3xl py-12 sm:py-16">
        <p className="eyebrow">Ujyalo Learn</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted">Last updated: {updated}</p>
        <div className="prose-ujyalo mt-6 text-[15px]">{intro}</div>

        <nav aria-label="On this page" className="card mt-8 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">On this page</p>
          <ol className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
            {sections.map((section, index) => (
              <li key={section.heading}>
                <a className="text-soft hover:underline" href={`#section-${index + 1}`}>
                  {index + 1}. {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-8 space-y-8">
          {sections.map((section, index) => (
            <section key={section.heading} id={`section-${index + 1}`} aria-labelledby={`heading-${index + 1}`}>
              <h2 id={`heading-${index + 1}`} className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                {index + 1}. {section.heading}
              </h2>
              <div className="prose-ujyalo mt-2 text-[15px]">{section.body}</div>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-xl border p-4 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <p className="text-muted">
            Questions about this page? Visit the <Link className="underline" to="/contact">Contact page</Link> or read our{' '}
            <Link className="underline" to="/privacy">Privacy Policy</Link> and{' '}
            <Link className="underline" to="/terms">Terms of Service</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
