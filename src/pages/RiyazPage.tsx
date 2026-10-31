import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookOpen, Github, Mail, Telescope } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { seoFor } from '@/config/seoPages';
import { PageContent } from '@/components/marketing/PageContent';
import { Section } from '@/components/marketing/Section';

/**
 * The founder page.
 *
 * Deliberately short and checkable. Every claim here is something a reader can
 * verify in two clicks — the site, the source repository, the contact page —
 * because the usual alternative on a personal page is a wall of unverifiable
 * adjectives. There is no age-based marketing, no testimonial and no number
 * that cannot be pointed at.
 */
const FACTS = [
  { label: 'Age', value: '14' },
  { label: 'Where', value: 'Nepal' },
  { label: 'Team', value: 'One person' },
  { label: 'Building since', value: '2026' },
];

export default function RiyazPage() {
  return (
    <>
      <Seo {...seoFor('/riyaz')} image="/riyaz-buildzen.jpg" />

      <Section className="!pb-10">
        <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <div>
            <p className="eyebrow">Built in Nepal</p>
            <h1 className="section-title mt-2">
              I’m Riyaz Chalise — fourteen, from Nepal, building things that help students learn.
            </h1>
            <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-soft">
              Ujyalo Learn is the main one. It is a free study site for students in Nepal — Grades 1–12 and SEE — with a
              tutor that will explain the same idea as many times as you need, practice questions with the answer
              explained, and study tools that survive a cheap phone and a weak connection.
            </p>
            <p className="mt-3 max-w-xl text-[15.5px] leading-relaxed text-soft">
              I am not a company and I am not a teacher. I am a student who got tired of watching classmates give up on
              a topic because the explanation they needed cost money.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to="/app" className="btn btn-primary">
                Try the site
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link to="/about" className="btn btn-secondary">
                About Ujyalo Learn
              </Link>
            </div>
          </div>

          <figure className="mx-auto w-full max-w-sm lg:mx-0">
            <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border)' }}>
              <img
                src="/riyaz-buildzen.jpg"
                alt="A blue and black banner reading BUILDZEN with the name RIYAZ, drawn over a mountain silhouette. The eyes are covered by a blue bar."
                width={900}
                height={900}
                className="block h-auto w-full"
                loading="eager"
                decoding="async"
              />
            </div>
            <figcaption className="mt-3 text-[12.5px] leading-relaxed text-muted">
              BUILDZEN, the banner I made for my own work. The bar across the eyes is deliberate — this page can be
              found by anyone, and my face does not need to be part of that.
            </figcaption>
          </figure>
        </div>
      </Section>

      <Section tone="surface" className="!py-8">
        <dl className="grid grid-cols-2 gap-y-6 sm:grid-cols-4">
          {FACTS.map((fact) => (
            <div key={fact.label} className="px-1">
              <dt className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                {fact.label}
              </dt>
              <dd className="mt-1 text-lg font-bold" style={{ color: 'var(--text)' }}>
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* The long-form body lives in shared/page-content.json so the crawler and
          the reader get the same words from one source. */}
      <PageContent path="/riyaz" />

      <Section tone="surface" className="!py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: BookOpen,
              title: 'The site I build',
              body: 'Courses, practice questions and study tools for every grade from 1 to 12, free to start.',
              to: '/subjects',
              label: 'Browse subjects',
              external: false,
            },
            {
              icon: Github,
              title: 'The source code',
              body: 'The repository is public. If something is broken, it is visible there before it is fixed here.',
              to: 'https://github.com/itsmeriyaz697-cell/ujyalo-learn',
              label: 'Open on GitHub',
              external: true,
            },
            {
              icon: Mail,
              title: 'Corrections',
              body: 'Wrong content, a broken page, or a fact that needs a source — the contact page reaches me.',
              to: '/contact',
              label: 'Contact',
              external: false,
            },
          ].map((item) => (
            <div key={item.title} className="card flex flex-col p-5">
              <item.icon className="h-5 w-5" style={{ color: 'var(--primary)' }} aria-hidden="true" />
              <h2 className="mt-3 text-base font-bold" style={{ color: 'var(--text)' }}>
                {item.title}
              </h2>
              <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-muted">{item.body}</p>
              {item.external ? (
                <a
                  href={item.to}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline"
                  style={{ color: 'var(--primary)' }}
                >
                  {item.label}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              ) : (
                <Link
                  to={item.to}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline"
                  style={{ color: 'var(--primary)' }}
                >
                  {item.label}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section className="!pt-10">
        <div
          className="flex flex-col items-start gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ background: 'var(--sage)' }}
        >
          <div className="flex items-start gap-3">
            <Telescope className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--on-sage-muted)' }} aria-hidden="true" />
            <p className="text-[14px] leading-relaxed" style={{ color: 'var(--on-sage-muted)' }}>
              This page describes a person, not a product. If you came looking for what Ujyalo Learn does, the{' '}
              <Link to="/about" className="font-semibold underline">
                about page
              </Link>{' '}
              is the honest summary.
            </p>
          </div>
          <Link to="/about" className="btn btn-primary shrink-0">
            Read about Ujyalo Learn
          </Link>
        </div>
      </Section>
    </>
  );
}
