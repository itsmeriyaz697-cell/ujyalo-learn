import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BrainCircuit,
  Calculator,
  CalendarCheck,
  ClipboardList,
  FileText,
  Languages,
  Layers,
  PencilLine,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Section, SectionHeading, FeatureCard } from '@/components/marketing/Section';
import { Button } from '@/components/ui/Button';
import { TUTOR_MODES } from '@/config/curriculum';

export default function FeaturesPage() {
  return (
    <>
      <Seo
        title="Features"
        description="AI tutoring with seven modes, practice quizzes, notes and flashcards, a study planner, and progress tracking built on your real activity."
        path="/features"
      />

      <Section className="!pb-8">
        <SectionHeading
          as="h1"
          eyebrow="Features"
          title="A study toolkit that works together"
          description="Every tool is connected: an explanation becomes a note, a note becomes a flashcard, and a quiz becomes evidence of progress."
        />
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Button asChild>
            <Link to="/signup">
              Start Learning Free <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/subjects">See subjects</Link>
          </Button>
        </div>
      </Section>

      <Section tone="surface" className="!py-12">
        <SectionHeading eyebrow="AI tutor" title="Ask anything, then go deeper" />
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<BrainCircuit className="h-5 w-5" />}
            title="Conversations that remember context"
            description="Follow-up questions stay in context, so you can say “explain that again more simply” without repeating yourself."
          />
          <FeatureCard
            icon={<Languages className="h-5 w-5" />}
            title="English, Nepali and beyond"
            description="Learn in the language you think in. Nepali explanations keep key technical terms in English where that helps."
          />
          <FeatureCard
            icon={<FileText className="h-5 w-5" />}
            title="Markdown & maths rendering"
            description="Headings, lists, tables and properly rendered equations make working easier to read and copy into your notebook."
          />
          <FeatureCard
            icon={<PencilLine className="h-5 w-5" />}
            title="Save and revisit"
            description="Copy an answer, regenerate it, or save it straight to your notes so you can revise it before an exam."
          />
          <FeatureCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Honest by default"
            description="The tutor says when it is unsure, never claims to have checked your syllabus, and labels AI content clearly."
          />
          <FeatureCard
            icon={<ClipboardList className="h-5 w-5" />}
            title="Practice on demand"
            description="Finish an explanation with a quick check question, or switch to Quiz Me mode for an interactive session."
          />
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Seven tutoring modes — each changes how the tutor responds
          </h3>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {TUTOR_MODES.map((mode) => (
              <div key={mode.id} className="card p-3.5">
                <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                  {mode.label}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{mode.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Practice & revision" title="Turn understanding into marks" />
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<ClipboardList className="h-5 w-5" />}
            title="AI quiz generator"
            description="Pick a subject, topic, difficulty and question type. Submit, score, then read an explanation for every answer."
          />
          <FeatureCard
            icon={<Layers className="h-5 w-5" />}
            title="Flashcards"
            description="Generate cards from a topic or your own notes, then practise with simple reveal-and-check cards."
          />
          <FeatureCard
            icon={<CalendarCheck className="h-5 w-5" />}
            title="Study planner"
            description="Set goals and exam dates, add tasks, reschedule what you missed and see what is coming next."
          />
          <FeatureCard
            icon={<TrendingUp className="h-5 w-5" />}
            title="Progress insights"
            description="Scores over time and subject patterns, with a clear reminder that these are estimates — not mastery."
          />
        </div>
      </Section>

      <Section tone="surface">
        <SectionHeading eyebrow="Study tools" title="Four focused helpers" />
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <FeatureCard
            icon={<FileText className="h-5 w-5" />}
            title="Revision summary"
            description="Key concepts, definitions, formulas, examples, common mistakes and practice questions in one clean sheet."
          />
          <FeatureCard
            icon={<Calculator className="h-5 w-5" />}
            title="Formula helper"
            description="Understand what a formula means, what each variable and unit is, and see a worked example."
          />
          <FeatureCard
            icon={<PencilLine className="h-5 w-5" />}
            title="Writing assistant"
            description="Get grammar, spelling and clarity improvements — with each change explained so you learn the rule."
          />
          <FeatureCard
            icon={<Sparkles className="h-5 w-5" />}
            title="Question explainer"
            description="Paste a question you are stuck on and get a grade-appropriate walkthrough of how to approach it."
          />
        </div>
      </Section>

      <Section>
        <div className="card flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
              Ready to try it with your own question?
            </h2>
            <p className="mt-1 text-sm text-muted">Free to start. Your first explanation is a minute away.</p>
          </div>
          <Button asChild size="lg">
            <Link to="/signup">
              Start Learning Free <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
