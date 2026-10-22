import { Link } from 'react-router-dom';
import { BookOpen, HeartHandshake, Lightbulb, ShieldCheck, Target } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { seoFor } from '@/config/seoPages';
import { Section, SectionHeading } from '@/components/marketing/Section';
import { Button } from '@/components/ui/Button';
import { InlineAlert } from '@/components/ui/Feedback';

export default function AboutPage() {
  return (
    <>
      <Seo {...seoFor('/about')} />

      <Section className="!pb-8">
        <SectionHeading
          as="h1"
          eyebrow="About Ujyalo Learn"
          title="Learning should feel like light, not pressure"
          description="“Ujyalo” means bright or illuminated. Ujyalo Learn exists to make patient, personal help available to students who otherwise cannot afford private tuition."
        />
      </Section>

      <Section tone="surface" className="!py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
              Why this platform exists
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
              <p>
                Many students in Nepal learn in crowded classrooms with limited one-to-one time. Private tuition can cost
                more than a family can spare, especially across several subjects. Meanwhile, the questions students are
                embarrassed to ask in class are often exactly the ones that unlock understanding.
              </p>
              <p>
                Ujyalo Learn gives every student a patient tutor that never gets tired of explaining, never judges a “basic”
                question, and is available at 9 pm before an exam.
              </p>
              <p>
                It is not a replacement for teachers, textbooks or the official curriculum. It is an extra study companion:
                something that helps you understand, practise and keep going.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: HeartHandshake, title: 'Student-first', body: 'Designed for real students in real conditions — low-end phones, shared devices and busy days.' },
              { icon: Lightbulb, title: 'Understanding over answers', body: 'The tutor explains the reasoning so you can do it yourself next time.' },
              { icon: ShieldCheck, title: 'Honest by design', body: 'Clear labels on AI content, no invented statistics, and no promises the service cannot keep.' },
              { icon: Target, title: 'Affordable to run', body: 'A lightweight stack and fair-use limits keep the platform sustainable and free to start.' },
            ].map((item) => (
              <div key={item.title} className="card p-4">
                <item.icon className="h-5 w-5" style={{ color: 'var(--primary)' }} aria-hidden="true" />
                <h3 className="mt-2.5 text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  {item.title}
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
              What Ujyalo Learn is — and is not
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--success)' }}>
                  It is
                </p>
                <ul className="mt-2 space-y-1.5 text-[13px] text-soft">
                  {[
                    'An AI study companion for Grades 1–12',
                    'A place to practise and revise',
                    'A private record of your own learning',
                    'A tool that adapts to your grade and language',
                  ].map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--danger)' }}>
                  It is not
                </p>
                <ul className="mt-2 space-y-1.5 text-[13px] text-soft">
                  {[
                    'An official textbook or curriculum',
                    'A source of real exam papers',
                    'A replacement for your teacher',
                    'A guarantee of any grade or result',
                  ].map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4">
              <InlineAlert tone="info" title="No fabricated social proof">
                This page deliberately contains no invented testimonials, user counts, success rates, awards or
                partnerships. When real, verifiable information exists, it will be added here.
              </InlineAlert>
            </div>
          </div>

          <div className="card p-5">
            <p className="eyebrow">Founder & creator</p>
            <h2 className="mt-1 text-xl font-bold" style={{ color: 'var(--text)' }}>
              Riyaz Chalise
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Riyaz built Ujyalo Learn around a simple idea: a student’s confidence should not depend on whether their
              family can pay for extra tuition. The platform is an independent education project, designed and developed
              with a focus on privacy, honesty and making the most of limited devices and bandwidth.
            </p>
            <div className="mt-4 rounded-xl p-3 text-[12px] leading-relaxed" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
              Have feedback, a subject request, or found something incorrect? Reach out through the{' '}
              <Link to="/contact" className="underline">
                contact page
              </Link>
              .
            </div>
          </div>
        </div>
      </Section>

      <Section tone="surface" className="!py-12">
        <div className="grid items-center gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
              What we are working on next
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Honest, current priorities — not promises with dates.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-soft">
              {[
                'Improving quiz quality and answer validation across subjects',
                'More explanation languages, configurable by the owner',
                'Teacher and classroom tools for schools (planned tier)',
                'Deeper progress insights that avoid over-claiming mastery',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-5 text-center">
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Start with a question
            </p>
            <p className="mt-1 text-xs text-muted">Free to use. Private by default.</p>
            <Button asChild className="mt-4" fullWidth>
              <Link to="/signup">Start Learning Free</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
