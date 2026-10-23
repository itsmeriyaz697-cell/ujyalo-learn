import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Languages, ShieldCheck, Sparkles, Timer } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { seoFor } from '@/config/seoPages';
import { Section, SectionHeading } from '@/components/marketing/Section';
import { Button } from '@/components/ui/Button';
import { InlineAlert } from '@/components/ui/Feedback';
import { TUTOR_MODES } from '@/config/curriculum';
import { useAiHealth } from '@/hooks/useAiHealth';
import { StartLearningButton } from '@/components/StartLearningButton';

/**
 * Public introduction to the tutor.
 *
 * The tutor itself lives behind auth at /app/tutor. This page is the honest
 * front door: it explains the modes, shows a sample exchange as an
 * illustration (labelled as one), and says plainly when the deployment has no
 * provider configured.
 */
export default function AiTutorPage() {
  const { health } = useAiHealth();

  return (
    <>
      <Seo {...seoFor('/ai-tutor')} />

      <Section className="!pb-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <div>
            <p className="eyebrow">AI tutor</p>
            <h1 className="section-title mt-2">A patient tutor that shows its working</h1>
            <p className="mt-4 text-[15px] leading-relaxed text-soft sm:text-base">
              Ask a question in English or Nepali and get an explanation written for your grade — then a question back
              to check that it landed. Seven modes change how it answers: simpler, step by step, exam-focused, Socratic,
              quick, or in Nepali.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/app/tutor">
                  Open the tutor <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <StartLearningButton variant="secondary">Create a free account</StartLearningButton>
            </div>

            {health && !health.configured && (
              <div className="mt-5">
                <InlineAlert tone="warning">
                  This deployment has no AI provider configured yet, so the tutor will say so instead of answering. The
                  rest of the site — courses, guides, quizzes and notes — works without it.
                </InlineAlert>
              </div>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                <Bot className="h-4 w-4" aria-hidden="true" /> Ujyalo AI Tutor
              </span>
              <span className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                Illustration
              </span>
            </div>
            <div className="space-y-3 p-4 text-sm">
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm px-3.5 py-2" style={{ background: 'var(--primary)', color: 'var(--primary-contrast)' }}>
                Why does a negative times a negative give a positive?
              </p>
              <div className="max-w-[92%] rounded-2xl rounded-bl-sm px-3.5 py-2" style={{ background: 'var(--surface-2)' }}>
                <p style={{ color: 'var(--text-soft)' }}>
                  Think of subtraction as turning around. Multiplying by −1 flips your direction on the number line.
                  Flip twice and you face the way you started — that is a positive result.
                </p>
                <p className="mt-2" style={{ color: 'var(--text-soft)' }}>
                  Quick check: what is (−3) × (−4)?
                </p>
              </div>
            </div>
            <p className="border-t px-4 py-2.5 text-[11px]" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
              A sample exchange, not a live answer. Real answers are labelled AI-generated and can be wrong.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="surface">
        <SectionHeading
          eyebrow="Seven modes"
          title="One tutor, seven ways to answer"
          description="Switch modes per conversation. The system prompt genuinely changes the shape of the answer, not just the wording."
        />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TUTOR_MODES.map((mode) => (
            <div key={mode.id} className="card p-4">
              <h3 className="text-[15px] font-semibold">{mode.label}</h3>
              <p className="mt-1 text-sm leading-relaxed text-soft">{mode.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Languages, title: 'English or Nepali', body: 'Ask in either; request Nepali answers at any time.' },
            { icon: Timer, title: 'Fast and streamed', body: 'Answers appear as they are written, so you can start reading sooner.' },
            { icon: ShieldCheck, title: 'Private by default', body: 'Conversations belong to your account only. Admins cannot read them.' },
            { icon: Sparkles, title: 'Honest about limits', body: 'Every answer carries an AI-generated label and a check-it reminder.' },
          ].map((item) => (
            <div key={item.title} className="card p-5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }} aria-hidden="true">
                <item.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-[15px] font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-soft">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="card mt-8 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">See the tools it connects to</h2>
            <p className="mt-1 text-sm text-soft">Quizzes, notes, flashcards and the planner all use the same account.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link to="/features">All features</Link>
            </Button>
            <Button asChild>
              <Link to="/courses">Browse courses</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
