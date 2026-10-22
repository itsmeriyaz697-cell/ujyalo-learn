import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Languages,
  Layers,
  Lock,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Section, SectionHeading, FeatureCard, Faq } from '@/components/marketing/Section';
import { TutorPreview } from '@/components/marketing/TutorPreview';
import { Button } from '@/components/ui/Button';
import { SITE, SUBJECTS, TUTOR_MODES } from '@/config/curriculum';
import { GRADE_LEVELS } from '@/lib/grades';

const FAQ_ITEMS = [
  {
    question: 'Is Ujyalo Learn free to use?',
    answer:
      'Yes. The core experience — AI tutoring, quizzes, notes, flashcards, the study planner and progress tracking — is free, with fair-use limits on AI requests so the service stays affordable to run. Optional paid plans are planned for later; nothing on this site takes payment today.',
  },
  {
    question: 'Which grades and subjects are supported?',
    answer:
      'The platform is designed for Grades 1–12, including SEE preparation in Nepal. Subjects include Mathematics, Science, English, Nepali, Social Studies, Computer Science, Optional Mathematics, Health & Physical Education and Economics. The tutor adapts its language and depth to the grade you select.',
  },
  {
    question: 'Can the tutor explain things in Nepali?',
    answer:
      'Yes. You can choose Nepali as your preferred language during setup, or pick the “Nepali Explanation” mode for a single answer. You can also ask questions in Nepali at any time.',
  },
  {
    question: 'Is this an official curriculum or exam service?',
    answer:
      'No. Ujyalo Learn is an independent learning tool. Explanations are AI-generated and are not official curriculum material, textbooks, or exam papers. Always check important facts against your textbook, teacher, or the official curriculum for your school.',
  },
  {
    question: 'Will the AI do my homework for me?',
    answer:
      'The tutor is built to guide you through the reasoning rather than just hand over answers. If you ask for a full worked solution, it will show the steps and explain why each one is needed, so you can learn the method and reproduce it yourself.',
  },
  {
    question: 'What happens to my conversations and notes?',
    answer:
      'They belong to you and are protected by database rules so that only your account can read them. You can delete individual items or your whole account and data at any time from Settings. Read the Privacy Policy for details.',
  },
  {
    question: 'Does it work on a low-end phone or slow connection?',
    answer:
      'The app is built to stay light: pages load on demand, animations respect reduced-motion settings, and the interface works on small screens. The AI tutor needs an internet connection, but reading saved notes and viewing your planner can work offline once the app is cached.',
  },
];

const STEPS = [
  {
    icon: UserRound,
    title: 'Tell us how you learn',
    body: 'Pick your grade, curriculum, subjects, language and goals. The tutor uses these settings to pitch every explanation at the right level.',
  },
  {
    icon: BrainCircuit,
    title: 'Ask, practise, understand',
    body: 'Ask any question in English or Nepali, generate quizzes, or turn your notes into flashcards. Choose a tutoring mode when you want a different approach.',
  },
  {
    icon: TrendingUp,
    title: 'See real progress',
    body: 'Your dashboard and progress page use your actual quiz scores and activity — not guesses — to show what is improving and what needs another look.',
  },
];

export function HomePage() {
  return (
    <>
      <Seo
        title="Ujyalo Learn — Your Personal AI Tutor, Anytime"
        description={SITE.description}
        path="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'EducationalOrganization',
          name: 'Ujyalo Learn',
          url: SITE.url,
          logo: `${SITE.url}/icons/icon-512.png`,
          description: SITE.description,
          founder: { '@type': 'Person', name: SITE.founder },
          areaServed: 'Nepal',
        }}
      />

      {/* Hero */}
      <section className="hero-grid relative overflow-hidden border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="container-page grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <span className="badge badge-brand">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> AI-powered learning for Grades 1–12
            </span>
            <h1 className="mt-4 text-[2.1rem] font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Your Personal AI Tutor,{' '}
              <span className="relative whitespace-nowrap" style={{ color: 'var(--primary)' }}>
                Anytime.
                <svg className="absolute -bottom-2 left-0 h-2.5 w-full" viewBox="0 0 200 10" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M2 7c40-5 92-6 196-3" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" fill="none" />
                </svg>
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted sm:text-base">
              Understand difficult concepts, practise questions, and prepare for exams with learning support designed
              around you. Patient explanations, real practice and a plan that fits your day.
            </p>
            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/signup">
                  Start Learning Free <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link to="/features">Explore Features</Link>
              </Button>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted">
              {['No credit card', 'English & Nepali', 'Private by default'].map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--success)' }} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:pl-4">
            <TutorPreview />
          </div>
        </div>
      </section>

      {/* Modes strip */}
      <div className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="container-page flex flex-wrap items-center justify-center gap-2 py-4">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted">Tutoring modes</span>
          {TUTOR_MODES.map((mode) => (
            <span key={mode.id} className="chip !py-1 !text-[12px]">
              {mode.label}
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <Section>
        <SectionHeading
          eyebrow="A complete study companion"
          title="Everything you need to actually understand the topic"
          description="Not just answers. Ujyalo Learn gives you explanation, practice and revision tools that work together — and keeps what you learn."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<BrainCircuit className="h-5 w-5" />}
            title="AI tutoring"
            description="Ask any question and get a patient explanation pitched to your grade, with worked steps and follow-up questions."
            meta="7 tutoring modes"
          />
          <FeatureCard
            icon={<ClipboardList className="h-5 w-5" />}
            title="Practice quizzes"
            description="Generate quizzes by topic and difficulty, answer them, then learn from an explanation for every question."
            meta="MCQ · True/False · Short answer · Fill in the blank"
          />
          <FeatureCard
            icon={<Layers className="h-5 w-5" />}
            title="Notes & flashcards"
            description="Save explanations, write your own notes, and turn revision material into flashcards you can flip through."
            meta="Searchable notes library"
          />
          <FeatureCard
            icon={<TrendingUp className="h-5 w-5" />}
            title="Progress tracking"
            description="See quiz scores over time, subject-by-subject patterns and a streak based on your real study activity."
            meta="Evidence-based, not guesswork"
          />
        </div>
      </Section>

      {/* How it works */}
      <Section tone="surface">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps to a study routine that sticks"
          description="Set up once, then keep learning. Everything you save stays in your account and builds up over time."
        />
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="card p-5">
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold"
                  style={{ background: 'var(--accent-soft)', color: 'color-mix(in srgb, var(--accent) 75%, black)' }}
                >
                  {index + 1}
                </span>
                <step.icon className="h-5 w-5" style={{ color: 'var(--primary)' }} aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Subjects */}
      <Section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Subjects & grades"
            title="Built around what you actually study"
            description="Choose from school subjects across Grades 1–12 and examination preparation levels. Subjects are configurable, so the platform can grow with your curriculum."
          />
          <Button asChild variant="secondary">
            <Link to="/subjects">
              Explore subjects <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SUBJECTS.slice(0, 6).map((subject) => (
            <Link
              key={subject.id}
              to="/subjects"
              className="card card-hover flex items-start gap-3 p-4"
            >
              <span
                className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: 'var(--primary-soft)', color: subject.color }}
                aria-hidden="true"
              >
                <BookOpen className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  {subject.name}
                </span>
                <span className="mt-0.5 block text-[13px] leading-snug text-muted">{subject.description}</span>
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <GraduationCap className="h-4 w-4" style={{ color: 'var(--muted)' }} aria-hidden="true" />
          {GRADE_LEVELS.map((grade) => (
            <span key={grade} className="chip !py-1 !text-[12px]">
              {grade}
            </span>
          ))}
        </div>
      </Section>

      {/* Personalisation */}
      <Section tone="surface">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Personalised by design"
              title="One platform, adjusted to how you learn"
              description="The same question can be answered in a very different way for a Grade 4 student and a SEE candidate. Ujyalo Learn adapts using settings you control."
            />
            <ul className="mt-6 space-y-3">
              {[
                { icon: GraduationCap, title: 'Grade-aware depth', body: 'Vocabulary, examples and detail match your selected grade level.' },
                { icon: Languages, title: 'Your language', body: 'Learn in English or Nepali, with more languages configurable by the owner.' },
                { icon: ClipboardList, title: 'Your curriculum context', body: 'Nepal National Curriculum, SEE preparation, CBSE, Cambridge and more.' },
                { icon: Sparkles, title: 'Your preferred style', body: 'Simple, step-by-step, exam-focused, concise, or story-based explanations.' },
              ].map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span
                    className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                    aria-hidden="true"
                  >
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
                      {item.title}
                    </span>
                    <span className="block text-[13px] leading-relaxed text-muted">{item.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Same question · different learner</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border p-3.5" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                <p className="text-[11px] font-semibold" style={{ color: 'var(--primary)' }}>
                  GRADE 5 · SIMPLE
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-soft">
                  “Think of fractions like slices of a momo. If you cut one momo into 4 equal pieces and eat 1, you have
                  eaten ¼ — one piece out of four.”
                </p>
              </div>
              <div className="rounded-xl border p-3.5" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                <p className="text-[11px] font-semibold" style={{ color: 'var(--primary)' }}>
                  GRADE 10 · EXAM FOCUSED
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-soft">
                  “A fraction a/b represents a parts of a whole divided into b equal parts. Watch for the common mistake of
                  adding denominators: ½ + ⅓ ≠ 2/5 — you must use a common denominator first.”
                </p>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted">
              Illustrative examples of how responses differ — not real student conversations.
            </p>
          </div>
        </div>
      </Section>

      {/* Trust */}
      <Section>
        <SectionHeading
          eyebrow="Privacy & responsible AI"
          title="Learning support you can trust"
          description="Ujyalo Learn is built for school students, so privacy and honesty are defaults rather than add-ons."
          align="center"
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Lock, title: 'Private by default', body: 'Your conversations, notes and quiz history are visible only to your account under database security rules.' },
            { icon: ShieldCheck, title: 'Minimal data', body: 'We ask for an email address and learning preferences — not your address, phone number or school ID.' },
            { icon: CheckCircle2, title: 'Honest about AI', body: 'Every AI answer can be wrong. The tutor says when it is unsure and never claims to have checked your syllabus.' },
            { icon: BookOpen, title: 'You stay in control', body: 'Delete any note, conversation, quiz or your entire account and data whenever you choose.' },
          ].map((item) => (
            <div key={item.title} className="card p-5">
              <item.icon className="h-5 w-5" style={{ color: 'var(--primary)' }} aria-hidden="true" />
              <h3 className="mt-3 text-sm font-semibold" style={{ color: 'var(--text)' }}>
                {item.title}
              </h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-xs text-muted">
          Read the <Link className="underline" to="/privacy">Privacy Policy</Link> and{' '}
          <Link className="underline" to="/terms">Terms of Service</Link>.
        </p>
      </Section>

      {/* FAQ */}
      <Section tone="surface">
        <SectionHeading eyebrow="Questions" title="Frequently asked questions" align="center" />
        <div className="mx-auto mt-8 max-w-3xl">
          <Faq items={FAQ_ITEMS} />
        </div>
      </Section>

      {/* CTA */}
      <Section>
        <div
          className="relative overflow-hidden rounded-3xl px-6 py-10 text-center sm:px-12"
          style={{ background: 'linear-gradient(135deg, #15245F 0%, #1F36AB 60%, #2947D6 100%)' }}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full" style={{ background: 'rgba(247,183,51,0.18)' }} aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} aria-hidden="true" />
          <h2 className="relative text-2xl font-bold tracking-tight text-white sm:text-3xl">Start with one question.</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#C9D5EE]">
            Create a free account, choose your grade and subjects, and ask your first question in under a minute.
          </p>
          <div className="relative mt-6 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <Button asChild variant="accent" size="lg">
              <Link to="/signup">Start Learning Free</Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="!text-white hover:!bg-white/10">
              <Link to="/help">See how it works</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
