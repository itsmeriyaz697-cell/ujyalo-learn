import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckCircle2, HelpCircle } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Section } from '@/components/marketing/Section';
import { StartLearningButton } from '@/components/StartLearningButton';
import { seoFor } from '@/config/seoPages';
import guide from '../../shared/getting-started.json';

interface GuideStep {
  title: string;
  body: string;
}
interface GuideSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  steps?: GuideStep[];
  items?: { question: string; answer: string }[];
}

const sections = guide.sections as GuideSection[];

/**
 * The page for someone who has never used an AI tutor and does not know where
 * to press. It is linked from the home page, the footer and Help, and its
 * content lives in shared/getting-started.json so the prerendered HTML a
 * crawler reads is the same text a visitor reads.
 */
export default function GettingStartedPage() {
  return (
    <>
      <Seo {...seoFor('/getting-started')} />

      <Section className="!pb-8">
        <div className="container-page max-w-3xl">
          <span className="badge badge-brand">
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            New here? Start with this page
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: 'var(--text)' }}>
            How to use Ujyalo Learn
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed sm:text-base" style={{ color: 'var(--text-soft)' }}>
            {guide.intro}
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <StartLearningButton>Start learning free</StartLearningButton>
            <Link to="/help" className="btn btn-secondary">
              Ask a question
            </Link>
          </div>
        </div>
      </Section>

      <Section className="!pt-2">
        <div className="container-page max-w-3xl space-y-10">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
                {section.heading}
              </h2>

              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                  {paragraph}
                </p>
              ))}

              {section.bullets && (
                <ul className="mt-3 space-y-2">
                  {section.bullets.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[15px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0" style={{ color: 'var(--success)' }} aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {section.steps && (
                <ol className="mt-4 space-y-3">
                  {section.steps.map((step, index) => (
                    <li key={step.title} className="card flex gap-3 p-4">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                        style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                        aria-hidden="true"
                      >
                        {index + 1}
                      </span>
                      <span>
                        <strong className="block" style={{ color: 'var(--text)' }}>
                          {step.title}
                        </strong>
                        <span className="mt-1 block text-sm leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                          {step.body}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}

              {section.items && (
                <div className="mt-4 space-y-3">
                  {section.items.map((item) => (
                    <div key={item.question} className="card p-4">
                      <h3 className="flex items-start gap-2 text-sm font-bold" style={{ color: 'var(--text)' }}>
                        <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} aria-hidden="true" />
                        {item.question}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                        {item.answer}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}

          <div className="card p-5" style={{ background: 'var(--primary-soft)' }}>
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
              Ready to try it?
            </h2>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-soft)' }}>
              One press, no form. You can add an email later and keep everything you have done.
            </p>
            <StartLearningButton className="mt-4" iconRight={<ArrowRight className="h-4 w-4" aria-hidden="true" />}>
              Start learning free
            </StartLearningButton>
          </div>
        </div>
      </Section>
    </>
  );
}
