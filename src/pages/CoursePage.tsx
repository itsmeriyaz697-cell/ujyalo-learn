import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Layers,
  NotebookPen,
  Sparkles,
  Target,
} from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Section } from '@/components/marketing/Section';
import { Button } from '@/components/ui/Button';
import { useContent, contentStore } from '@/features/content/ContentProvider';
import { LEVEL_LABEL, type Course, type Lesson } from '@/features/content/types';
import { SITE, getSubject } from '@/config/curriculum';
import NotFoundPage from './NotFoundPage';

const ACTION_META: Record<Lesson['action'], { label: string; icon: typeof Sparkles }> = {
  tutor: { label: 'Open the tutor', icon: Sparkles },
  quiz: { label: 'Take a quiz', icon: Target },
  flashcards: { label: 'Build flashcards', icon: Layers },
  notes: { label: 'Write a note', icon: NotebookPen },
  reading: { label: 'Read the guide', icon: BookOpen },
};

function lessonHref(course: Course, lesson: Lesson): string {
  const subject = course.subjectId ? `&subject=${course.subjectId}` : '';
  switch (lesson.action) {
    case 'tutor':
      return `/app/tutor?mode=step-by-step${subject}${lesson.prompt ? `&prompt=${encodeURIComponent(lesson.prompt)}` : ''}`;
    case 'quiz':
      return `/app/quizzes?subject=${course.subjectId || 'science'}&topic=${encodeURIComponent(lesson.title)}`;
    case 'flashcards':
      return `/app/flashcards?topic=${encodeURIComponent(lesson.title)}`;
    case 'notes':
      return '/app/notes';
    default:
      return '#lesson-guide';
  }
}

export default function CoursePage() {
  const { slug = '' } = useParams();
  const { publishedCourses: courses, loading } = useContent();
  const [course, setCourse] = useState<Course | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fromContext = courses.find((item) => item.slug === slug);
      if (fromContext) {
        if (!cancelled) {
          setCourse(fromContext);
          setState('ready');
        }
        return;
      }
      setState('loading');
      const found = await contentStore.getCourse(slug);
      if (cancelled) return;
      setCourse(found);
      setState(found ? 'ready' : 'missing');
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, courses]);

  if (state === 'missing' && !loading) return <NotFoundPage />;

  if (state === 'loading' || !course) {
    return (
      <Section>
        <div className="card h-72 animate-pulse" style={{ background: 'var(--surface-2)' }} aria-busy="true">
          <span className="sr-only">Loading course…</span>
        </div>
      </Section>
    );
  }

  const subject = getSubject(course.subjectId);
  const minutes = course.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
  const readingLessons = course.lessons.filter((lesson) => lesson.action === 'reading' && lesson.body);

  return (
    <>
      <Seo title={`${course.title} — Ujyalo Learn`} description={course.summary} path={`/courses/${course.slug}`} />

      <Section className="!pb-8">
        <Breadcrumbs
          items={[
            { href: '/', label: 'Home' },
            { href: '/courses', label: 'Courses' },
            { label: course.title },
          ]}
        />

        <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              <span>{LEVEL_LABEL[course.level]}</span>
              {subject && <span>· {subject.name}</span>}
              <span>
                · Grades {course.gradeMin}–{course.gradeMax}
              </span>
            </div>
            <h1 className="section-title mt-2">{course.title}</h1>
            <p className="mt-4 text-[15px] leading-relaxed text-soft sm:text-base">{course.description}</p>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm" style={{ color: 'var(--muted)' }}>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" aria-hidden="true" /> about {minutes} minutes
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" aria-hidden="true" /> {course.lessons.length} sessions
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild>
                <Link to={lessonHref(course, course.lessons[0])}>
                  Start session 1 <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to={`/subjects?subject=${course.subjectId}`}>Related subject</Link>
              </Button>
            </div>

            <div className="card mt-8 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                What you should be able to do
              </h2>
              <ul className="mt-3 grid gap-2">
                {course.outcomes.map((outcome) => (
                  <li key={outcome} className="flex gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--success)' }} aria-hidden="true" />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                Sessions
              </h2>
              <ol className="mt-3 space-y-3">
                {course.lessons.map((lesson, index) => {
                  const meta = ACTION_META[lesson.action];
                  const Icon = meta.icon;
                  return (
                    <li key={lesson.id} className="flex gap-3">
                      <span
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                        style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                        aria-hidden="true"
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-snug">{lesson.title}</p>
                        <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
                          <Icon className="mr-1 inline h-3 w-3" aria-hidden="true" />
                          {meta.label} · {lesson.minutes} min
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="mt-4 rounded-2xl p-4 text-xs leading-relaxed" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
              These sessions are a study plan written by {SITE.name}, not official curriculum material. Examinations are
              set by your school and the National Examination Board.
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="surface">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Work through the sessions</h2>
        <p className="mt-2 max-w-2xl text-sm text-soft">
          Each session opens a tool with the topic filled in. Answer in your own words — everything you produce is saved
          to your account so the next session can build on it.
        </p>

        <ol className="mt-6 space-y-3">
          {course.lessons.map((lesson, index) => {
            const meta = ACTION_META[lesson.action];
            const Icon = meta.icon;
            return (
              <li key={lesson.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <span
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                      aria-hidden="true"
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-semibold">
                        {index + 1}. {lesson.title}
                      </h3>
                      <p className="mt-1 text-sm text-soft">{lesson.summary}</p>
                      {lesson.body && (
                        <p id="lesson-guide" className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                          {lesson.body}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="hidden text-xs sm:inline" style={{ color: 'var(--muted)' }}>
                      {lesson.minutes} min
                    </span>
                    {lesson.action === 'reading' ? (
                      <span className="chip">Read above</span>
                    ) : (
                      <Button asChild size="sm" variant="secondary">
                        <Link to={lessonHref(course, lesson)}>
                          {meta.label} <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {readingLessons.length > 0 && (
          <p className="mt-4 text-xs" style={{ color: 'var(--muted)' }}>
            Reading sessions are short original notes written for this course. They are not a replacement for your
            textbook.
          </p>
        )}
      </Section>

      <Section className="!pt-10">
        <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Want a different subject?</h2>
            <p className="mt-1 text-sm text-soft">Browse everything, or ask the tutor to build a plan for your exam.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link to="/courses">All courses</Link>
            </Button>
            <Button asChild>
              <Link to="/app/tutor?mode=exam-prep">Plan with the tutor</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
