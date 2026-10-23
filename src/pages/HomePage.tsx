import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  Combine,
  GraduationCap,
  Languages,
  Layers,
  Lock,
  NotebookPen,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { seoFor } from '@/config/seoPages';
import { Section, SectionHeading, FeatureCard, Faq } from '@/components/marketing/Section';
import { HeroVisual } from '@/components/marketing/HeroVisual';
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

/** Honest product facts — no user counts, testimonials or success rates. */
const STATS = [
  { icon: BookOpen, value: '9', label: 'Subjects covered' },
  { icon: GraduationCap, value: '1–12', label: 'Grades supported' },
  { icon: Sparkles, value: '7', label: 'Tutoring modes' },
  { icon: ShieldCheck, value: 'Free', label: 'Core plan to start' },
];

const STRIP = [
  { icon: BrainCircuit, title: 'AI Tutor', body: 'Ask anything. Grade-aware answers.', tint: 'var(--primary)' },
  { icon: ScrollText, title: 'SEE Preparation', body: 'Revision, practice and exam technique.', tint: '#0F9D58' },
  { icon: CircleHelp, title: 'Practice Quizzes', body: 'Four question types with explanations.', tint: '#7C4DFF' },
  { icon: TrendingUp, title: 'Track Progress', body: 'Scores over time, from real attempts.', tint: '#F08A24' },
  { icon: NotebookPen, title: 'Notes & Flashcards', body: 'Save, search and revise what you learn.', tint: '#E0457B' },
  { icon: Timer, title: 'Study Planner', body: 'Goals, tasks and realistic daily plans.', tint: '#0E9AA7' },
];

const WHY = [
  {
    icon: ScrollText,
    title: 'SEE focused',
    body: 'Revision-style practice for the Secondary Education Examination, with common mistakes called out.',
  },
  {
    icon: BrainCircuit,
    title: 'AI study buddy',
    body: 'A patient tutor that asks questions back and adapts to your grade instead of dumping an answer.',
  },
  {
    icon: Timer,
    title: 'Learn at your pace',
    body: 'Short sessions, no timers. Continue exactly where you left off, on any device.',
  },
  {
    icon: Combine,
    title: 'One place, not five',
    body: 'Tutor, quizzes, notes, flashcards, planner and progress share the same account.',
  },
  {
    icon: ShieldCheck,
    title: 'Safe & private',
    body: 'Owner-only database rules. No public profiles, no leaderboards, no data selling.',
  },
  {
    icon: Users,
    title: 'Built for Nepal',
    body: 'Nepali and English, the national curriculum, SEE and other curricula — made for students here.',
  },
];

const STEPS = [
  {
    title: 'Tell us how you learn',
    body: 'Pick your grade, curriculum, subjects, language and goals. The tutor uses these settings for every explanation.',
  },
  {
    title: 'Ask, practise, understand',
    body: 'Ask a question in English or Nepali, generate a quiz, or turn a note into flashcards. Switch modes when you need a different angle.',
  },
  {
    title: 'See real progress',
    body: 'Your dashboard and progress page use your actual quiz attempts and activity — not guesses — to show what is improving.',
  },
];

export function HomePage() {
  return (
    <>
      <Seo {...seoFor('/')} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden border-b"
        style={{ borderColor: 'var(--border)' }}
        aria-labelledby="hero-title"
      >
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(70% 60% at 80% 0%, color-mix(in srgb, var(--primary) 14%, transparent), transparent 70%), radial-gradient(50% 50% at 0% 10%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 70%)',
          }}
        />
        <div className="container-page relative grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:py-20">
          <div className="min-w-0">
            <span className="badge badge-brand !normal-case !tracking-normal">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              AI-powered learning for Grades 1–12
            </span>

            <h1
              id="hero-title"
              className="mt-4 text-[2.35rem] font-extrabold leading-[1.05] tracking-tight sm:text-[3.2rem] lg:text-[3.6rem]"
              style={{ color: 'var(--text)' }}
            >
              Smart learning.
              <br />
              <span className="relative inline-block" style={{ color: 'var(--primary)' }}>
                Brighter future.
                <svg
                  className="absolute -bottom-1.5 left-0 h-2.5 w-full"
                  viewBox="0 0 240 10"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M2 7.5c48-4.5 110-6 236-3.2" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" fill="none" />
                </svg>
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-[15px] leading-relaxed sm:text-[17px]" style={{ color: 'var(--text-soft)' }}>
              Ujyalo Learn brings an AI tutor, practice quizzes, SEE preparation and a personal study plan together in
              one place. Understand the topic — don’t just copy the answer.
            </p>

            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/signup">
                  Start learning free
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link to="/features">Explore features</Link>
              </Button>
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px]" style={{ color: 'var(--muted)' }}>
              {['No credit card', 'English & Nepali', 'Private by default'].map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--success)' }} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <HeroVisual />
        </div>
      </section>

      {/* ── Capability strip ─────────────────────────────────────────────── */}
      <div className="container-page relative z-10 -mt-px">
        <ul
          className="grid gap-x-2 gap-y-4 rounded-2xl border p-3 shadow-sm sm:grid-cols-2 sm:p-4 lg:grid-cols-6"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {STRIP.map((item) => (
            <li key={item.title} className="flex items-start gap-2.5 px-1.5 py-1.5">
              <span
                className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `color-mix(in srgb, ${item.tint} 14%, transparent)`, color: item.tint }}
                aria-hidden="true"
              >
                <item.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-tight" style={{ color: 'var(--text)' }}>
                  {item.title}
                </span>
                <span className="mt-0.5 block text-[11.5px] leading-snug" style={{ color: 'var(--muted)' }}>
                  {item.body}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Product facts ────────────────────────────────────────────────── */}
      <div className="container-page mt-8">
        <div
          className="relative overflow-hidden rounded-2xl px-5 py-6 sm:px-8"
          style={{ background: 'linear-gradient(120deg, #15245F 0%, #2340A8 55%, #2947D6 100%)' }}
        >
          <div
            className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full"
            style={{ background: 'rgba(247,183,51,0.16)' }}
            aria-hidden="true"
          />
          <div className="relative grid items-center gap-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <span
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.12)', color: '#FFFFFF' }}
                  aria-hidden="true"
                >
                  <stat.icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-xl font-extrabold leading-none text-white">{stat.value}</span>
                  <span className="mt-1 block text-[11.5px]" style={{ color: '#C9D5EE' }}>
                    {stat.label}
                  </span>
                </span>
              </div>
            ))}
            <p
              className="text-[15px] font-semibold italic leading-snug lg:text-right"
              style={{ color: 'var(--accent)' }}
            >
              Together towards
              <br className="hidden lg:block" /> a brighter tomorrow.
            </p>
          </div>
          <p className="relative mt-4 text-[10.5px]" style={{ color: '#93A6CE' }}>
            These describe the product itself. Ujyalo Learn does not publish user counts or satisfaction scores.
          </p>
        </div>
      </div>

      {/* ── Why Ujyalo Learn ─────────────────────────────────────────────── */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-12">
          <div>
            <p className="eyebrow">Why Ujyalo Learn?</p>
            <h2 className="section-title mt-2">
              Everything you need,
              <br />
              <span style={{ color: 'var(--primary)' }}>in one place.</span>
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              Students in Nepal juggle textbooks, tuition notes, past papers and YouTube. Ujyalo Learn puts the help you
              actually need — explanation, practice and revision — in one account that remembers what you have done.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Button asChild>
                <Link to="/features">
                  Explore all features
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/subjects">See subjects & grades</Link>
              </Button>
            </div>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {WHY.map((item) => (
              <li key={item.title} className="card card-hover p-4">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                  aria-hidden="true"
                >
                  <item.icon className="h-4 w-4" />
                </span>
                <h3 className="mt-3 text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>
                  {item.title}
                </h3>
                <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Dashboard preview */}
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div
            className="card overflow-hidden p-0"
            aria-label="Illustration of the student dashboard"
          >
            <div className="flex items-center gap-2 border-b px-4 py-2.5" style={{ borderColor: 'var(--border)' }}>
              <span className="h-2 w-2 rounded-full" style={{ background: '#F26B5E' }} aria-hidden="true" />
              <span className="h-2 w-2 rounded-full" style={{ background: '#F7B733' }} aria-hidden="true" />
              <span className="h-2 w-2 rounded-full" style={{ background: '#41C48A' }} aria-hidden="true" />
              <span className="ml-2 text-[11px]" style={{ color: 'var(--muted)' }}>
                Dashboard · Grade 10
              </span>
            </div>
            <div className="grid gap-2 p-3 sm:grid-cols-3" style={{ background: 'var(--bg)' }}>
              {[
                { label: 'Streak', value: '4 days' },
                { label: 'Quiz average', value: '72%' },
                { label: 'Tasks today', value: '2 of 3' },
              ].map((tile) => (
                <div key={tile.label} className="rounded-lg border p-2.5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <p className="text-[9.5px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                    {tile.label}
                  </p>
                  <p className="mt-1 text-[15px] font-bold" style={{ color: 'var(--text)' }}>
                    {tile.value}
                  </p>
                </div>
              ))}
              <div className="rounded-lg border p-2.5 sm:col-span-2" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="text-[9.5px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                  Subject progress
                </p>
                <div className="mt-2 space-y-1.5">
                  {[
                    { name: 'Science', width: '78%' },
                    { name: 'Mathematics', width: '64%' },
                    { name: 'English', width: '86%' },
                  ].map((row) => (
                    <div key={row.name} className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[10px]" style={{ color: 'var(--muted)' }}>
                        {row.name}
                      </span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--surface-3)' }}>
                        <span className="block h-full rounded-full" style={{ width: row.width, background: 'var(--primary)' }} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border p-2.5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="text-[9.5px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                  Today
                </p>
                <p className="mt-1.5 text-[11px] leading-snug" style={{ color: 'var(--text-soft)' }}>
                  Revise trigonometry
                </p>
                <span className="badge badge-brand mt-2 !text-[9px]">30 min</span>
              </div>
            </div>
            <p className="border-t px-4 py-2 text-[10px]" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
              Interface illustration with sample data — not a real student record.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              Your personal learning dashboard
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              One screen shows your streak, quiz average, today’s plan, subject-by-subject progress and the notes you
              saved. Every number is calculated from records you created — nothing is estimated or invented.
            </p>
            <Button asChild variant="secondary" className="mt-4">
              <Link to="/signup">
                Get started free
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </Section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <Section tone="surface">
        <SectionHeading
          eyebrow="A complete study companion"
          title="Built to help you actually understand the topic"
          description="Not just answers. Explanation, practice and revision tools that work together — and keep what you learn."
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

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <Section>
        <SectionHeading
          eyebrow="How it works"
          title="Three steps to a study routine that sticks"
          description="Set up once, then keep learning. Everything you save stays in your account and builds up over time."
        />
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="card relative p-5">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-bold"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)' }}
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <h3 className="mt-3.5 text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
                {step.title}
              </h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── Subjects ─────────────────────────────────────────────────────── */}
      <Section tone="surface">
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
            <Link key={subject.id} to={`/subjects?subject=${subject.id}`} className="card card-hover flex items-start gap-3 p-4">
              <span
                className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: 'color-mix(in srgb, ' + subject.color + ' 14%, transparent)', color: subject.color }}
                aria-hidden="true"
              >
                <BookOpen className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  {subject.name}
                </span>
                <span className="mt-0.5 block text-[13px] leading-snug" style={{ color: 'var(--muted)' }}>
                  {subject.description}
                </span>
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <GraduationCap className="h-4 w-4" style={{ color: 'var(--muted)' }} aria-hidden="true" />
          {GRADE_LEVELS.map((grade) => (
            <Link key={grade} to="/subjects" className="chip !py-1 !text-[12px]">
              {grade}
            </Link>
          ))}
        </div>
      </Section>

      {/* ── Personalisation ──────────────────────────────────────────────── */}
      <Section>
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
                { icon: ScrollText, title: 'Your curriculum context', body: 'Nepal National Curriculum, SEE preparation, CBSE, Cambridge and more.' },
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
                    <span className="block text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                      {item.body}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              Same question · different learner
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border p-3.5" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                <p className="text-[11px] font-semibold" style={{ color: 'var(--primary)' }}>
                  GRADE 5 · SIMPLE
                </p>
                <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                  “Think of fractions like slices of a momo. If you cut one momo into 4 equal pieces and eat 1, you have
                  eaten ¼ — one piece out of four.”
                </p>
              </div>
              <div className="rounded-xl border p-3.5" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                <p className="text-[11px] font-semibold" style={{ color: 'var(--primary)' }}>
                  GRADE 10 · EXAM FOCUSED
                </p>
                <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                  “A fraction a/b represents a parts of a whole divided into b equal parts. Watch for the common mistake of
                  adding denominators: ½ + ⅓ ≠ 2/5 — you must use a common denominator first.”
                </p>
              </div>
            </div>
            <p className="mt-3 text-[11px]" style={{ color: 'var(--muted)' }}>
              Illustrative examples of how responses differ — not real student conversations.
            </p>
          </div>
        </div>

        {/* Modes */}
        <div className="mt-10 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
            Tutoring modes
          </span>
          {TUTOR_MODES.map((mode) => (
            <Link key={mode.id} to={`/app/tutor?mode=${mode.id}`} className="chip !py-1 !text-[12px]">
              {mode.label}
            </Link>
          ))}
        </div>
      </Section>

      {/* ── Trust ────────────────────────────────────────────────────────── */}
      <Section tone="surface">
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
              <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {item.body}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-xs" style={{ color: 'var(--muted)' }}>
          Read the <Link className="underline" to="/privacy">Privacy Policy</Link> and{' '}
          <Link className="underline" to="/terms">Terms of Service</Link>.
        </p>
      </Section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <Section>
        <SectionHeading eyebrow="Questions" title="Frequently asked questions" align="center" />
        <div className="mx-auto mt-8 max-w-3xl">
          <Faq items={FAQ_ITEMS} />
        </div>
        <p className="mt-6 text-center text-sm" style={{ color: 'var(--muted)' }}>
          Still stuck? <Link className="font-medium underline" to="/help">Read the help guide</Link> or{' '}
          <Link className="font-medium underline" to="/contact">contact us</Link>.
        </p>
      </Section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <Section>
        <div
          className="relative overflow-hidden rounded-3xl px-6 py-10 text-center sm:px-12"
          style={{ background: 'linear-gradient(135deg, #15245F 0%, #1F36AB 60%, #2947D6 100%)' }}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full" style={{ background: 'rgba(247,183,51,0.18)' }} aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} aria-hidden="true" />
          <h2 className="relative text-2xl font-bold tracking-tight text-white sm:text-3xl">Start with one question.</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-sm leading-relaxed" style={{ color: '#C9D5EE' }}>
            Create a free account, choose your grade and subjects, and ask your first question in under a minute.
          </p>
          <div className="relative mt-6 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <Button asChild variant="accent" size="lg">
              <Link to="/signup">Start learning free</Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="!text-white hover:!bg-white/10">
              <Link to="/help">See how it works</Link>
            </Button>
          </div>
          <p className="relative mt-4 text-[11px]" style={{ color: '#8FA3CC' }}>
            Free core plan · No card required · Founded by {SITE.founder}
          </p>
        </div>
      </Section>
    </>
  );
}
