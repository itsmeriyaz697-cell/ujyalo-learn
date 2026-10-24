import { Section } from '@/components/marketing/Section';
import { pageContentFor, type ContentSection } from '@/lib/pageContent';

/**
 * The long-form body copy for a marketing page.
 *
 * The text lives in shared/page-content.json and is rendered twice: here, for
 * students, and by scripts/generate-seo.mjs, for crawlers. Rendering the same
 * source in both places is deliberate. When the prerendered HTML and the
 * mounted page disagree, one of them is lying to either the reader or the
 * search engine — and that is how sites end up with content that ranks but
 * does not answer anything.
 */
export function ContentSections({ sections, tone }: { sections: ContentSection[]; tone?: 'default' | 'surface' }) {
  if (!sections.length) return null;

  return (
    <Section tone={tone} className="!py-12">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-x-12">
        {sections.map((section, index) => (
          <div key={section.heading} className={index === 0 ? 'lg:col-span-2' : undefined}>
            <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              {section.heading}
            </h2>
            <div className="mt-3 space-y-3">
              {section.body.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="text-[14.5px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                  {paragraph}
                </p>
              ))}
            </div>
            {section.bullets?.length ? (
              <ul className="mt-3 space-y-1.5">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="text-[14px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </Section>
  );
}

export function PageContent({ path, tone }: { path: string; tone?: 'default' | 'surface' }) {
  return <ContentSections sections={pageContentFor(path)} tone={tone} />;
}
