import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarClock,
  Code2,
  FlaskConical,
  Globe2,
  Languages,
  Sigma,
  Timer,
} from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { seoFor } from '@/config/seoPages';
import { Faq } from '@/components/marketing/Section';
import { WorkedExample } from '@/components/marketing/WorkedExample';
import { DailyQuestion } from '@/components/marketing/DailyQuestion';
import { StartLearningButton } from '@/components/StartLearningButton';
import { SITE } from '@/config/curriculum';
import { useContent } from '@/features/content/ContentProvider';
import { useAuth } from '@/features/auth/AuthProvider';
import { OPPORTUNITIES, isExpired } from '@/features/opportunities/data';

const FAQ_ITEMS = [
  {
    question: 'Is Ujyalo Learn free?',
    answer:
      'Yes. Lessons, the practice library, the daily question and the opportunities directory are free and open without an account. A fair-use limit applies to AI study help so the bill stays payable. Nothing on this site takes payment today.',
  },
  {
    question: 'Which grades and subjects are covered?',
    answer:
      'Grades 1 to 12, including SEE preparation. Mathematics, Science, English, Nepali, Social Studies, Computer Science, Optional Mathematics, Health and Physical Education, and Economics.',
  },
  {
    question: 'Where do the opportunity listings come from?',
    answer:
      'Each listing names the provider, links to the official application page and carries the date it was last checked. We do not list anything we could not verify, and expired listings are labelled rather than deleted.',
  },
  {
    question: 'Is this an official curriculum or exam service?',
    answer:
      'No. Ujyalo Learn is independent of any board or school. Explanations and practice questions are written for study, not as official exam material. Check anything important against your textbook or teacher.',
  },
  {
    question: 'Who can see my work?',
    answer:
      'Only your account, enforced by database rules rather than by a promise. You can delete a single item or everything at once from Settings. Details are in the privacy policy.',
  },
];

/** The six subjects a visitor can actually start with, each with its own shape. */
const SUBJECT_CARDS = [
  {
    id: 'mathematics',
    name: 'Mathematics',
    icon: Sigma,
    line: 'Arithmetic to calculus — worked step by step, never just the answer.',
    grades: 'Grades 1–12',
    to: '/subjects#mathematics',
  },
  {
    id: 'science',
    name: 'Science',
    icon: FlaskConical,
    line: 'Physics, chemistry and biology explained with things you can see.',
    grades: 'Grades 1–12',
    to: '/subjects#science',
  },
  {
    id: 'english',
    name: 'English',
    icon: BookOpen,
    line: 'Grammar, comprehension and writing you can defend in an exam.',
    grades: 'Grades 1–12',
    to: '/subjects#english',
  },
  {
    id: 'nepali',
    name: 'Nepali',
    icon: Languages,
    line: 'व्याकरण, पठन र लेखन — explained in the language you study in.',
    grades: 'Grades 1–12',
    to: '/subjects#nepali',
  },
  {
    id: 'social-studies',
    name: 'Social Studies',
    icon: Globe2,
    line: 'Nepal, its neighbours and the systems that shape both.',
    grades: 'Grades 6–12',
    to: '/subjects#social-studies',
  },
  {
    id: 'computer-science',
    name: 'Computer Science',
    icon: Code2,
    line: 'How computers think — from variables to loops to simple programs.',
    grades: 'Grades 6–12',
    to: '/subjects#computer-science',
  },
];

export function HomePage() {
  const { publishedCourses, publishedResources } = useContent();
  const { user } = useAuth();

  const featured = publishedCourses.slice(0, 3);
  const reading = publishedResources.slice(0, 3);
  const opportunities = OPPORTUNITIES.filter((item) => !isExpired(item)).slice(0, 3);

  return (
    <>
      <Seo {...seoFor('/')} />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="hero-grid">
        <div className="container-page grid items-center gap-10 py-14 sm:py-16 lg:grid-cols-12 lg:gap-12 lg:py-20">
          <div className="lg:col-span-6">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--accent-text)' }}>
              <span className="inline-block h-[2px] w-6" style={{ background: 'var(--accent)' }} aria-hidden="true" />
              Free study help · Grades 1–12 · SEE
            </p>
            <h1
              className="mt-5 text-[2.1rem] font-extrabold leading-[1.08] tracking-[-0.025em] sm:text-[2.9rem] lg:text-[3.15rem]"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
            >
              Your next big achievement starts with one lesson.
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed sm:text-base" style={{ color: 'var(--text-soft)' }}>
              Discover better ways to learn, practice with purpose and build the confidence to achieve more.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <StartLearningButton size="lg" iconRight={<ArrowRight className="h-4 w-4" aria-hidden="true" />}>
                Start learning
              </StartLearningButton>
              <Link
                to="/subjects"
                className="btn btn-secondary btn-lg"
                style={{ color: 'var(--text)' }}
              >
                Explore subjects
              </Link>
            </div>
            <ul className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs" style={{ color: 'var(--on-sage-muted)' }}>
              <li>Free to use</li>
              <li aria-hidden="true">·</li>
              <li>No account needed to browse</li>
              <li aria-hidden="true">·</li>
              <li>Built for a 360px screen</li>
            </ul>
          </div>

          <div className="lg:col-span-6">
            <WorkedExample />
          </div>
        </div>
      </section>

      {/* ── Subjects ───────────────────────────────────────────────────── */}
      <section className="container-page py-14 sm:py-16" aria-labelledby="subjects-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Start where you are</p>
            <h2 id="subjects-heading" className="section-title mt-2">
              Six subjects, one honest way of teaching them
            </h2>
          </div>
          <Link to="/subjects" className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--text)' }}>
            All subjects and grades
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <ul className="mt-8 grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-3" style={{ borderColor: 'var(--border)', background: 'var(--border)' }}>
          {SUBJECT_CARDS.map((subject) => {
            const Icon = subject.icon;
            return (
              <li key={subject.id} style={{ background: 'var(--surface)' }}>
                <Link
                  to={subject.to}
                  className="group flex h-full flex-col p-6 transition-colors hover:bg-[var(--surface-2)]"
                >
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5" style={{ color: 'var(--accent-text)' }} aria-hidden="true" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--muted)' }}>
                      {subject.grades}
                    </span>
                  </div>
                  <h3
                    className="mt-4 text-lg font-bold tracking-[-0.01em]"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
                  >
                    {subject.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                    {subject.line}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    Open
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── Continue learning / start here ─────────────────────────────── */}
      <section className="container-page pb-14 sm:pb-16" aria-labelledby="continue-heading">
        <div className="rounded-lg border p-6 sm:p-8" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">{user ? 'Continue learning' : 'New here?'}</p>
              <h2 id="continue-heading" className="section-title mt-2">
                {user ? 'Pick up where you left off' : 'Three ways to begin today'}
              </h2>
            </div>
            {user && (
              <Link to="/app" className="btn btn-secondary btn-sm">
                Open dashboard
              </Link>
            )}
          </div>

          {featured.length > 0 ? (
            <ul className="mt-6 grid gap-4 sm:grid-cols-3">
              {featured.map((course) => {
                const minutes = course.lessons.reduce((total, lesson) => total + lesson.minutes, 0);
                return (
                  <li key={course.id}>
                    <Link
                      to={`/courses/${course.slug}`}
                      className="group flex h-full flex-col rounded-md border p-4 transition-colors hover:bg-[var(--surface-2)]"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--accent-text)' }}>
                        {course.gradeMin === course.gradeMax
                          ? `Grade ${course.gradeMin}`
                          : `Grades ${course.gradeMin}–${course.gradeMax}`}
                      </span>
                      <span className="mt-2 font-semibold leading-snug" style={{ color: 'var(--text)' }}>
                        {course.title}
                      </span>
                      <span className="mt-2 flex-1 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                        {course.summary}
                      </span>
                      <span className="mt-3 inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
                        <Timer className="h-3.5 w-3.5" aria-hidden="true" />
                        about {Math.max(5, Math.round(minutes / 5) * 5)} minutes
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                { to: '/global-quiz', title: 'Try a practice set', body: 'Multiple choice, instant explanations, no account needed.', icon: Timer },
                { to: '/resources', title: 'Read a lesson', body: 'Short written guides with worked examples and practice.', icon: BookOpen },
                { to: '/see-preparation', title: 'Prepare for SEE', body: 'Topic practice and timed mocks for the Class 10 exams.', icon: CalendarClock },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="group flex h-full flex-col rounded-md border p-4 transition-colors hover:bg-[var(--surface-2)]"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <Icon className="h-4 w-4" style={{ color: 'var(--accent-text)' }} aria-hidden="true" />
                      <span className="mt-2 font-semibold" style={{ color: 'var(--text)' }}>
                        {item.title}
                      </span>
                      <span className="mt-1 flex-1 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                        {item.body}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* ── Daily question ─────────────────────────────────────────────── */}
      <section className="border-y" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
        <div className="container-page grid items-center gap-8 py-14 sm:py-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow">Free, every day</p>
            <h2 className="section-title mt-2">One question. Thirty seconds. A new habit.</h2>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-soft)' }}>
              A different question appears each morning at midnight Nepal time, with an explanation that shows the
              reasoning rather than just the answer. Answer it in your head, then check.
            </p>
            <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
              One answer per device per day. We do not publish a count of who got it right, because a number on a
              page is easy to invent and we would rather show you nothing than something made up.
            </p>
          </div>
          <div className="lg:col-span-7">
            <DailyQuestion />
          </div>
        </div>
      </section>

      {/* ── Featured reading ───────────────────────────────────────────── */}
      {reading.length > 0 && (
        <section className="container-page py-14 sm:py-16" aria-labelledby="reading-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">From the library</p>
              <h2 id="reading-heading" className="section-title mt-2">
                Read something useful
              </h2>
            </div>
            <Link to="/resources" className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--text)' }}>
              All resources
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <ul className="mt-8 divide-y border-y" style={{ borderColor: 'var(--border)' }}>
            {reading.map((resource) => (
              <li key={resource.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                <Link to={`/resources/${resource.slug}`} className="group flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:gap-6">
                  <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.14em] sm:w-28" style={{ color: 'var(--accent-text)' }}>
                    {resource.type}
                  </span>
                  <span className="flex-1">
                    <span className="block font-semibold leading-snug group-hover:underline" style={{ color: 'var(--text)' }}>
                      {resource.title}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                      {resource.description}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs" style={{ color: 'var(--muted)' }}>
                    {resource.grade ? `Grade ${resource.grade}` : 'All grades'} · {resource.source}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Opportunities ──────────────────────────────────────────────── */}
      <section className="border-t" style={{ borderColor: 'var(--border)', background: 'var(--sage)' }}>
        <div className="container-page py-14 sm:py-16" aria-labelledby="opportunities-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="eyebrow" style={{ color: 'var(--on-sage-muted)' }}>
                Opportunities
              </p>
              <h2 id="opportunities-heading" className="section-title mt-2">
                Scholarships, competitions and free courses — checked, not copied
              </h2>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                Every listing names the organisation running it, links to their official page, and shows the date we
                last checked it. If we cannot verify a deadline, we do not print one.
              </p>
            </div>
            <Link
              to="/opportunities"
              className="btn btn-secondary btn-sm"
              style={{ background: 'var(--surface)' }}
            >
              All opportunities
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {opportunities.length > 0 ? (
            <ul className="mt-8 grid gap-4 md:grid-cols-3">
              {opportunities.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.officialUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex h-full flex-col rounded-md border p-5 transition-colors hover:bg-[var(--surface)]"
                    style={{ borderColor: 'var(--border-strong)', background: 'color-mix(in srgb, var(--surface) 60%, transparent)' }}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--accent-text)' }}>
                      {item.category}
                    </span>
                    <span className="mt-2 font-semibold leading-snug" style={{ color: 'var(--text)' }}>
                      {item.title}
                    </span>
                    <span className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
                      {item.provider}
                    </span>
                    <span className="mt-auto pt-4 text-xs" style={{ color: 'var(--muted)' }}>
                      {item.deadline ? `Deadline: ${item.deadline}` : 'Rolling — no fixed deadline'} · checked{' '}
                      {item.lastVerified}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm" style={{ color: 'var(--text-soft)' }}>
              Listings are being verified before they are published. Nothing is shown here until it has been checked
              against the provider's own page.
            </p>
          )}
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section className="container-page py-14 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">Questions</p>
            <h2 className="section-title mt-2">The things people ask first</h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              More detail lives in the{' '}
              <Link to="/faq" className="underline" style={{ color: 'var(--text)' }}>
                full FAQ
              </Link>
              .
            </p>
          </div>
          <div className="lg:col-span-8">
            <Faq items={FAQ_ITEMS} />
          </div>
        </div>
      </section>

      {/* ── Closing ────────────────────────────────────────────────────── */}
      <section className="border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="container-page flex flex-col items-start justify-between gap-6 py-12 sm:flex-row sm:items-center">
          <div>
            <p
              className="text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
            >
              {SITE.tagline}
            </p>
            <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
              Free lessons, real practice and verified opportunities. {SITE.foundedIn === 'Nepal' ? 'Built in Nepal.' : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <StartLearningButton size="lg" iconRight={<ArrowRight className="h-4 w-4" aria-hidden="true" />}>
              Start learning
            </StartLearningButton>
            <Link to="/signup" className="btn btn-secondary btn-lg">
              Create an account
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
