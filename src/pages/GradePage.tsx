import { Link, useParams } from 'react-router-dom';
import { ArrowRight, BookOpen, GraduationCap } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Section } from '@/components/marketing/Section';
import { Button } from '@/components/ui/Button';
import { useContent } from '@/features/content/ContentProvider';
import { SUBJECTS } from '@/config/curriculum';
import NotFoundPage from './NotFoundPage';

/**
 * Grade landing pages.
 *
 * These are real pages with real content, not thin keyword pages: each one
 * lists the subjects for that grade and every published course that spans it,
 * plus the tools a student at that grade actually uses.
 */
export default function GradePage() {
  const { grade = '' } = useParams();
  const value = Number(grade);

  if (!Number.isInteger(value) || value < 1 || value > 12) return <NotFoundPage />;

  const { publishedCourses: courses, loading } = useContent();
  const relevant = courses.filter((course) => course.gradeMin <= value && course.gradeMax >= value);

  const stage =
    value <= 5 ? 'primary' : value <= 8 ? 'lower secondary' : value <= 10 ? 'secondary' : 'higher secondary';

  return (
    <>
      <Seo
        title={`Grade ${value} — subjects, courses and study tools | Ujyalo Learn`}
        description={`What to study in Grade ${value} in Nepal: subject list, published Ujyalo Learn courses that cover Grade ${value}, and the study tools that help at this stage.`}
        path={`/grades/${value}`}
      />

      <Section className="!pb-8">
        <p className="eyebrow">Grade {value}</p>
        <h1 className="section-title mt-2">Grade {value} study hub</h1>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-soft sm:text-base">
          Grade {value} is {stage} level in the Nepali school system. Below are the subjects typically taught at this
          stage, the courses that cover it, and the tools students use most. If your school follows a different subject
          combination, the tutor can work with whatever syllabus you bring it.
        </p>
      </Section>

      <Section tone="surface" className="!py-10">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Subjects at this level</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {SUBJECTS.map((subject) => (
            <Link key={subject.id} to={`/subjects?subject=${subject.id}`} className="chip">
              {subject.name}
            </Link>
          ))}
        </div>
        <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
          Subject availability changes by school and board. Ujyalo Learn supports all of these; your school decides
          which are compulsory.
        </p>
      </Section>

      <Section>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Courses covering Grade {value}</h2>
        {loading ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2" aria-busy="true">
            {[0, 1].map((key) => (
              <div key={key} className="card h-40 animate-pulse" style={{ background: 'var(--surface-2)' }} />
            ))}
          </div>
        ) : relevant.length === 0 ? (
          <div className="card mt-4 max-w-xl p-6">
            <GraduationCap className="h-7 w-7" style={{ color: 'var(--muted)' }} aria-hidden="true" />
            <h3 className="mt-3 text-base font-semibold">No published course for Grade {value} yet</h3>
            <p className="mt-2 text-sm text-soft">
              The library is still growing. You can still use the tutor with any topic — it works from your grade and
              subjects, not from the course list.
            </p>
            <div className="mt-4">
              <Button asChild size="sm">
                <Link to="/app/tutor">Open the tutor</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {relevant.map((course) => (
              <Link key={course.id} to={`/courses/${course.slug}`} className="card card-hover p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                  <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                  Grades {course.gradeMin}–{course.gradeMax}
                </div>
                <h3 className="mt-2 text-[16px] font-bold leading-snug">{course.title}</h3>
                <p className="mt-2 text-sm text-soft">{course.summary}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                  Open course <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link to="/courses">All courses</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/resources">Study guides</Link>
          </Button>
          {value > 1 && (
            <Button asChild variant="ghost">
              <Link to={`/grades/${value - 1}`}>Grade {value - 1}</Link>
            </Button>
          )}
          {value < 12 && (
            <Button asChild variant="ghost">
              <Link to={`/grades/${value + 1}`}>Grade {value + 1}</Link>
            </Button>
          )}
        </div>
      </Section>
    </>
  );
}
