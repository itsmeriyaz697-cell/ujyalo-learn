import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Filter, GraduationCap, Search, X } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { seoFor } from '@/config/seoPages';
import { Section, SectionHeading } from '@/components/marketing/Section';
import { Button } from '@/components/ui/Button';
import { InlineAlert } from '@/components/ui/Feedback';
import { useContent } from '@/features/content/ContentProvider';
import { LEVEL_LABEL, type Course } from '@/features/content/types';
import { SUBJECTS, getSubject } from '@/config/curriculum';

const GRADES = ['4-5', '6-8', '9-10', '11-12'] as const;
type GradeBand = (typeof GRADES)[number];

const inBand = (course: Course, band: GradeBand) => {
  const [min, max] = band.split('-').map(Number);
  return course.gradeMin <= max && course.gradeMax >= min;
};

const totalMinutes = (course: Course) => course.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);

export default function CoursesPage() {
  const { publishedCourses: courses, loading, error } = useContent();
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState<string>('all');
  const [band, setBand] = useState<GradeBand | 'all'>('all');
  const [level, setLevel] = useState<string>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((course) => {
      if (subject !== 'all' && course.subjectId !== subject) return false;
      if (band !== 'all' && !inBand(course, band)) return false;
      if (level !== 'all' && course.level !== level) return false;
      if (!q) return true;
      return `${course.title} ${course.summary} ${course.tags.join(' ')}`.toLowerCase().includes(q);
    });
  }, [courses, query, subject, band, level]);

  const activeFilters = [subject !== 'all', band !== 'all', level !== 'all', query.trim() !== ''].filter(Boolean).length;

  return (
    <>
      <Seo {...seoFor('/courses')} />

      <Section className="!pb-8">
        <div className="max-w-3xl">
          <p className="eyebrow">Courses</p>
          <h1 className="section-title mt-2">Learning paths, not just links</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-soft sm:text-base">
            Each course is a short sequence of sessions. Every session hands you to a tool — the tutor explains,
            a quiz checks you, flashcards keep it fresh — so the course follows what you actually got right.
          </p>
        </div>

        <div className="card mt-8 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="relative block">
              <span className="sr-only">Search courses</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted)' }} aria-hidden="true" />
              <input
                className="input pl-9"
                placeholder="Search courses"
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
            <label className="block">
              <span className="sr-only">Grade band</span>
              <select className="input" value={band} onChange={(event) => setBand(event.target.value as GradeBand | 'all')}>
                <option value="all">All grades</option>
                {GRADES.map((item) => (
                  <option key={item} value={item}>
                    Grades {item.replace('-', '–')}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="sr-only">Level</span>
              <select className="input" value={level} onChange={(event) => setLevel(event.target.value)}>
                <option value="all">All levels</option>
                {Object.entries(LEVEL_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
              <Filter className="h-3.5 w-3.5" aria-hidden="true" />
              {filtered.length} of {courses.length} courses
            </span>
            {activeFilters > 0 && (
              <button
                type="button"
                className="chip"
                onClick={() => {
                  setQuery('');
                  setSubject('all');
                  setBand('all');
                  setLevel('all');
                }}
              >
                <X className="h-3 w-3" aria-hidden="true" /> Clear filters
              </button>
            )}
          </div>
        </div>
      </Section>

      <Section tone="surface" className="!pt-2">
        {error && (
          <div className="mb-6">
            <InlineAlert tone="warning">{error}</InlineAlert>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-live="polite">
            {[0, 1, 2, 3, 4, 5].map((key) => (
              <div key={key} className="card h-56 animate-pulse p-5" style={{ background: 'var(--surface-2)' }} />
            ))}
            <span className="sr-only">Loading courses…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card mx-auto max-w-xl p-8 text-center">
            <GraduationCap className="mx-auto h-8 w-8" style={{ color: 'var(--muted)' }} aria-hidden="true" />
            <h2 className="mt-3 text-lg font-semibold">No course matches those filters</h2>
            <p className="mt-2 text-sm text-soft">
              Try clearing the filters, or open the tutor and ask for the topic directly — it does not need a course.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery('');
                  setSubject('all');
                  setBand('all');
                  setLevel('all');
                }}
              >
                Clear filters
              </Button>
              <Button asChild>
                <Link to="/app/tutor">Ask the tutor</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => {
              const subjectMeta = getSubject(course.subjectId);
              return (
                <Link key={course.id} to={`/courses/${course.slug}`} className="card card-hover flex flex-col p-5">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                      aria-hidden="true"
                    >
                      <BookOpen className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                      {LEVEL_LABEL[course.level]}
                    </span>
                  </div>
                  <h2 className="mt-3 text-[16px] font-bold leading-snug" style={{ color: 'var(--text)' }}>
                    {course.title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-soft">{course.summary}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: 'var(--muted)' }}>
                    {subjectMeta && <span>{subjectMeta.name}</span>}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" aria-hidden="true" /> {totalMinutes(course)} min
                    </span>
                    <span>
                      {course.lessons.length} session{course.lessons.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Section>

      <Section className="!pt-10">
        <SectionHeading
          align="center"
          eyebrow="Built to be honest"
          title="No invented chapters, no fake progress"
          description="Courses are written as study paths. Lessons open real tools and store your real answers, so improvement shown here is measured, not declared."
        />
        <div className="mx-auto mt-6 flex max-w-md justify-center">
          <Button asChild variant="secondary">
            <Link to="/resources">Browse the resource library</Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
