import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, CheckCircle2, FileQuestion, GraduationCap, Timer } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { seoFor } from '@/config/seoPages';
import { Section, SectionHeading } from '@/components/marketing/Section';
import { Button } from '@/components/ui/Button';
import { useContent } from '@/features/content/ContentProvider';
import { InlineAlert } from '@/components/ui/Feedback';
import { PageContent } from '@/components/marketing/PageContent';

const WHAT_HELPS = [
  {
    icon: Timer,
    title: 'Practise under time',
    body: 'Generate a timed set on one topic, sit it without notes, then mark it. Speed comes from repetition, not from reading faster.',
  },
  {
    icon: FileQuestion,
    title: 'Turn mistakes into material',
    body: 'Every wrong answer can become a note or a flashcard. The mistake log is the most valuable document you own by the week before the exam.',
  },
  {
    icon: CalendarCheck,
    title: 'Plan the last four weeks',
    body: 'A week for auditing, a week for repairing weak topics, a week for timed practice and a final week for consolidation. Rest is part of the plan.',
  },
  {
    icon: GraduationCap,
    title: 'Understand, then memorise',
    body: 'A definition you can explain sticks longer than one you can only recite. The tutor walks the reasoning before it states the answer.',
  },
];

export default function SeePrepPage() {
  const { publishedCourses: courses } = useContent();
  const seeCourses = courses.filter((course) => course.level === 'see');

  return (
    <>
      <Seo {...seoFor('/see-preparation')} />

      <Section className="!pb-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div>
            <p className="eyebrow">SEE preparation</p>
            <h1 className="section-title mt-2">Prepare for SEE without panic-cramming</h1>
            <p className="mt-4 text-[15px] leading-relaxed text-soft sm:text-base">
              SEE rewards method as much as memory. Ujyalo Learn gives you a tutor that explains reasoning, quizzes that
              mark themselves, and a mistake log that turns every wrong answer into something to revise.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/app/tutor?mode=exam-prep">
                  Start an exam plan <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/courses">See SEE courses</Link>
              </Button>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              What we do and do not publish
            </h2>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--success)' }} aria-hidden="true" />
                <span>Original study guides, revision plans and practice questions generated for your topic.</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--success)' }} aria-hidden="true" />
                <span>Explanations in English or Nepali, at your grade level.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--warning, #B45309)' }} aria-hidden="true" />
                <span className="text-soft">
                  We do <strong>not</strong> host official past papers or model questions. Those come from the National
                  Examination Board and your school.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </Section>

      <Section tone="surface">
        <SectionHeading
          eyebrow="What actually works"
          title="Four habits that move marks"
          description="None of these are shortcuts. They are the parts of exam preparation students most often skip."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {WHAT_HELPS.map((item) => (
            <div key={item.title} className="card p-5">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                aria-hidden="true"
              >
                <item.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-[15px] font-semibold">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-soft">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">SEE courses</h2>
        {seeCourses.length === 0 ? (
          <div className="mt-4">
            <InlineAlert tone="info">
              No SEE-specific course is published yet, but the library does cover SEE topics. Start from the
              subject guides below, or ask the study helper any question.
            </InlineAlert>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {seeCourses.map((course) => (
              <Link key={course.id} to={`/courses/${course.slug}`} className="card card-hover p-5">
                <h3 className="text-[16px] font-bold leading-snug">{course.title}</h3>
                <p className="mt-2 text-sm text-soft">{course.summary}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                  Open course <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <PageContent path="/see-preparation" />
      <Section className="!pt-4">
        <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Not sure where to start?</h2>
            <p className="mt-1 text-sm text-soft">Ask the tutor to diagnose your weakest topics first.</p>
          </div>
          <Button asChild>
            <Link to="/app/tutor?mode=socratic">Start with questions</Link>
          </Button>
        </div>
      </Section>

      {/* Sources. A page that tells students what the SEE exams cover should
          say where that comes from and when it was checked. These are the two
          bodies that publish the syllabus and the exam notices; both links were
          opened and confirmed on the date shown. We link to them rather than
          restating them, because a restated syllabus goes stale and a link to
          the authority does not. */}
      <Section tone="surface">
        <SectionHeading
          eyebrow="Sources"
          title="Where the syllabus information comes from"
          description="Ujyalo Learn is independent of both bodies. We summarise and link, we do not replace their documents."
        />
        <ul className="mt-6 grid gap-3">
          <li>
            <a
              href="https://moecdc.gov.np/"
              target="_blank"
              rel="noreferrer noopener"
              className="card card-hover flex items-start gap-3 p-4"
            >
              <FileQuestion className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" style={{ color: 'var(--accent-text)' }} />
              <span>
                <span className="block font-semibold">Curriculum Development Centre (CDC)</span>
                <span className="mt-1 block text-sm text-soft">
                  Publishes the national curriculum and the subject specification grids that set the marks and
                  question types for each subject.
                </span>
                <span className="mt-1 block text-xs" style={{ color: 'var(--muted)' }}>
                  moecdc.gov.np · link opened and checked 30 October 2026
                </span>
              </span>
            </a>
          </li>
          <li>
            <a
              href="https://neb.gov.np/"
              target="_blank"
              rel="noreferrer noopener"
              className="card card-hover flex items-start gap-3 p-4"
            >
              <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" style={{ color: 'var(--accent-text)' }} />
              <span>
                <span className="block font-semibold">National Examination Board (NEB)</span>
                <span className="mt-1 block text-sm text-soft">
                  The body that runs the SEE and publishes the exam routine, model questions and results notices.
                  Always take dates and rules from here rather than from a third party.
                </span>
                <span className="mt-1 block text-xs" style={{ color: 'var(--muted)' }}>
                  neb.gov.np · link opened and checked 30 October 2026
                </span>
              </span>
            </a>
          </li>
        </ul>
        <p className="mt-4 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
          Practice questions on this site are written for study and are not official exam questions. Where a page
          states a rule or a date, the NEB notice is the authority, not us.
        </p>
      </Section>
    </>
  );
}
