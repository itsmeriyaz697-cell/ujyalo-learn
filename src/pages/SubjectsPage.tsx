import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, GraduationCap, Info } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { seoFor } from '@/config/seoPages';
import { Section, SectionHeading } from '@/components/marketing/Section';
import { CURRICULA, SUBJECTS, subjectsForGrade } from '@/config/curriculum';
import { cn } from '@/lib/utils';
import { StartLearningButton } from '@/components/StartLearningButton';

export default function SubjectsPage() {
  const [grade, setGrade] = useState(10);
  const [curriculum, setCurriculum] = useState('nepal-national');
  const subjects = useMemo(() => subjectsForGrade(grade), [grade]);

  return (
    <>
      <Seo {...seoFor('/subjects')} />

      <Section className="!pb-8">
        <SectionHeading
          as="h1"
          eyebrow="Subjects & grades"
          title="Find what you are studying"
          description="Choose a grade to see the subjects available. The tutor adapts its explanations to the grade and curriculum you select."
        />

        <div className="mt-7 flex flex-wrap gap-1.5" role="group" aria-label="Filter by grade">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setGrade(value)}
              aria-pressed={grade === value}
              className={cn('chip', grade === value && 'chip-active')}
            >
              Grade {value}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setGrade(10)}
            aria-pressed={false}
            className="chip"
            title="SEE candidates follow the Grade 10 subject set"
          >
            SEE preparation
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label htmlFor="curriculum" className="text-xs font-semibold uppercase tracking-wide text-muted">
            Curriculum context
          </label>
          <select
            id="curriculum"
            className="input !w-auto !min-h-9 !py-1.5 !text-[13px]"
            value={curriculum}
            onChange={(event) => setCurriculum(event.target.value)}
          >
            {CURRICULA.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted">
          Curriculum context changes how the tutor frames explanations (for example, SEE-style revision). Ujyalo Learn does
          not reproduce official textbooks, past papers, or syllabus documents.
        </p>
      </Section>

      <Section tone="surface" className="!py-12">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" style={{ color: 'var(--primary)' }} aria-hidden="true" />
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
            Grade {grade} subjects
          </h2>
          <span className="badge badge-neutral">{subjects.length} available</span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <div key={subject.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: 'color-mix(in srgb, ' + subject.color + ' 14%, transparent)', color: subject.color }}
                  aria-hidden="true"
                >
                  <BookOpen className="h-5 w-5" />
                </span>
                {subject.examRelevant && <span className="badge badge-gold">Exam relevant</span>}
              </div>
              <h3 className="mt-3 text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
                {subject.name}
              </h3>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">{subject.description}</p>
              <p className="mt-3 text-[11px] text-muted">
                Grades {subject.minGrade}–{subject.maxGrade}
              </p>
              <Link
                to={`/app/tutor?subject=${subject.id}`}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold"
                style={{ color: 'var(--primary)' }}
              >
                Ask the tutor <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ))}
        </div>

        {subjects.length === 0 && (
          <div className="card mt-4 p-6 text-sm text-muted">
            No subjects are configured for this grade yet. The owner can adjust supported subjects in{' '}
            <code>src/config/curriculum.ts</code>.
          </div>
        )}

        <div className="mt-6 flex items-start gap-2.5 rounded-xl border p-4 text-xs leading-relaxed text-muted" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Subject lists are configurable and not an official curriculum directory. Explanations are AI-generated and
            should be checked against reliable learning materials for your school.
          </p>
        </div>
      </Section>

      <Section>
        <div className="card flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
              Studying Grade {grade}? Pick your subjects in your profile.
            </h2>
            <p className="mt-1 text-sm text-muted">Your tutor uses these settings to tailor every answer.</p>
          </div>
          <StartLearningButton size="lg">Create free account</StartLearningButton>
        </div>
        <div className="sr-only">
          <h2>All configured subjects</h2>
          <ul>
            {SUBJECTS.map((s) => (
              <li key={s.id}>{s.name}</li>
            ))}
          </ul>
        </div>
      </Section>
    </>
  );
}
