import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { seoFor } from '@/config/seoPages';
import { Faq } from '@/components/marketing/Section';
import { WorkedExample } from '@/components/marketing/WorkedExample';
import { StartLearningButton } from '@/components/StartLearningButton';
import { SITE, SUBJECTS, TUTOR_MODES } from '@/config/curriculum';
import { GRADE_LEVELS } from '@/lib/grades';

const FAQ_ITEMS = [
  {
    question: 'Is Ujyalo Learn free?',
    answer:
      'Yes. The tutor, quizzes, notes, flashcards, planner and progress page are free, with a fair-use limit on AI requests so the bill stays payable. Paid plans are planned for later. Nothing on this site takes payment today.',
  },
  {
    question: 'Which grades and subjects does it cover?',
    answer:
      'Grades 1 to 12, including SEE preparation. Mathematics, Science, English, Nepali, Social Studies, Computer Science, Optional Mathematics, Health and Physical Education, and Economics. The tutor matches its language and depth to the grade you pick.',
  },
  {
    question: 'Can it explain in Nepali?',
    answer:
      'Yes. Choose Nepali during setup, or pick the Nepali Explanation mode for a single answer. You can also just ask in Nepali.',
  },
  {
    question: 'Is this an official curriculum or exam service?',
    answer:
      'No. Ujyalo Learn is independent of any board or school. Explanations are AI-generated, not textbook or exam material. Check anything important against your book or teacher.',
  },
  {
    question: 'Will it just do my homework?',
    answer:
      'It will show the steps and say why each one is needed, so you can repeat the method yourself. If you ask for a bare answer it will still explain the reasoning.',
  },
  {
    question: 'Who can see my notes and conversations?',
    answer:
      'Only your account, enforced by database rules rather than by a promise. You can delete a single item or everything at once from Settings. Details are in the Privacy Policy.',
  },
  {
    question: 'Does it work on a cheap phone?',
    answer:
      'Pages load only when needed, animations respect reduced-motion settings, and the layout works from 360px up. Saved notes and your planner can be read offline once the app is cached. The tutor needs a connection.',
  },
];

/**
 * What the product genuinely does. One line each, because a list of six icon
 * cards in a 2×3 grid is the shape every generated landing page has.
 */
const TOOLS = [
  {
    name: 'AI tutor',
    body: 'Ask in English or Nepali. The answer is pitched at your grade and shows the steps, not just the result.',
    to: '/ai-tutor',
    link: 'Open the tutor',
  },
  {
    name: 'Quizzes with explanations',
    body: 'Four question types. Every question is explained after you answer it, including the ones you got right.',
    to: '/global-quiz',
    link: 'Try a quiz',
  },
  {
    name: 'Notes, flashcards and a planner',
    body: 'Save an explanation, turn it into cards, and let the planner carry what is left to tomorrow.',
    to: '/features',
    link: 'See how they fit together',
  },
];

const PROMISES = [
  {
    title: 'Your work is yours',
    body: 'Conversations, notes and quiz history are readable by your account only. That is a database rule, not a setting we can toggle off.',
  },
  {
    title: 'The AI is labelled',
    body: 'Every generated answer says so and warns that it can be wrong. Nothing here pretends to be an official marking scheme.',
  },
  {
    title: 'No invented numbers',
    body: 'This site does not publish user counts, testimonials or pass rates, because we have none worth showing yet.',
  },
];

export function HomePage() {
  return (
    <>
      <Seo {...seoFor('/')} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="container-page relative pb-14 pt-12 sm:pb-20 sm:pt-16">
          <div className="grid items-start gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div className="min-w-0">
              <p className="rule-gold text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                Nepal · Grades 1–12 · Free to start
              </p>

              <h1
                className="mt-4 max-w-[15ch] text-[2.6rem] font-semibold leading-[1.02] sm:text-[3.4rem] lg:text-[3.75rem]"
                style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
              >
                Ujyalo Learn — your personal AI tutor
              </h1>

              <p className="mt-6 max-w-[46ch] text-[16px] leading-relaxed sm:text-[17px]" style={{ color: 'var(--text-soft)' }}>
                Ujyalo Learn is a free study companion for school in Nepal. Ask a question and get an explanation you
                can follow. Practise it with a quiz, keep what matters in notes, and come back tomorrow to what is
                left.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <StartLearningButton size="lg" iconRight={<ArrowRight className="h-4 w-4" aria-hidden="true" />}>
                  Start studying
                </StartLearningButton>
                <Link
                  to="/global-quiz"
                  className="inline-flex items-center gap-1.5 text-sm font-medium underline decoration-1 underline-offset-4"
                  style={{ color: 'var(--text-soft)' }}
                >
                  Or try a quiz without an account
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              <p className="mt-8 max-w-[52ch] border-t pt-5 text-[13px] leading-relaxed" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
                No card, no email needed to look around. You only sign in when you want your streak, notes and scores
                to follow you to another device.
              </p>
            </div>

            <WorkedExample />
          </div>
        </div>
      </section>

      {/* ── What is in it ────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <p className="rule-gold eyebrow">What is inside</p>
              <h2 className="section-title mt-1 max-w-[18ch]">Three tools, and they share what they learn.</h2>
              <p className="mt-4 max-w-[40ch] text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                Ask something, then practise it, then keep it. Each part uses what the others already know about
                your grade and subjects, so you are not reintroducing yourself five times.
              </p>
            </div>

            <ul className="border-t" style={{ borderColor: 'var(--border)' }}>
              {TOOLS.map((tool) => (
                <li key={tool.name} className="border-b py-6" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                    <h3 className="text-[17px] font-semibold" style={{ color: 'var(--text)' }}>
                      {tool.name}
                    </h3>
                    <Link
                      to={tool.to}
                      className="inline-flex items-center gap-1 text-[13px] font-medium hover:underline"
                      style={{ color: 'var(--primary)' }}
                    >
                      {tool.link}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                  <p className="mt-2 max-w-[52ch] text-[14px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                    {tool.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Subjects, set as a list rather than as tiles ─────────────────── */}
      <section className="border-y py-14 sm:py-20" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <p className="rule-gold eyebrow">Subjects</p>
              <h2 className="section-title mt-1 max-w-[16ch]">The subjects you actually sit exams in.</h2>
              <p className="mt-4 max-w-[38ch] text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                Nine subjects, written for the Nepali curriculum and the SEE. Other curricula are available at setup,
                and the school can add its own later.
              </p>
              <Link
                to="/subjects"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                Browse subjects and grades
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div>
              <ul className="grid grid-cols-1 gap-x-8 gap-y-0 sm:grid-cols-2">
                {SUBJECTS.slice(0, 8).map((subject, index) => (
                  <li key={subject.id} className="border-b py-3" style={{ borderColor: 'var(--border)' }}>
                    <Link to={`/subjects?subject=${subject.id}`} className="group flex items-baseline gap-3">
                      <span className="w-5 shrink-0 text-[11px] tabular-nums" style={{ color: 'var(--muted)' }}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[14.5px] font-medium group-hover:underline" style={{ color: 'var(--text)' }}>
                        {subject.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[13px]" style={{ color: 'var(--muted)' }}>
                <span>Grades</span>
                {GRADE_LEVELS.map((grade) => (
                  <Link key={grade} to="/subjects" className="hover:underline" style={{ color: 'var(--text-soft)' }}>
                    {grade}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── A note from the person who built it ──────────────────────────── */}
      <section className="py-14 sm:py-20">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div className="max-w-[58ch]">
              <p className="rule-gold eyebrow">Why this exists</p>
              <h2 className="section-title mt-1">Made by one student, for other students.</h2>
              <div className="mt-5 space-y-4 text-[15px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                <p>
                  I built Ujyalo Learn because getting a straight answer to “why is this step here?” was the hardest
                  part of studying for me. Textbooks explain once, in one way. A teacher has forty other students.
                  Video lessons go too fast to ask a question back.
                </p>
                <p>
                  So this is the tool I wanted: it answers, shows its working, and then checks that the explanation
                  landed. It is not finished, and some of it is still rough. Where something is missing, the site
                  says so instead of covering it with a claim.
                </p>
                <p>
                  {SITE.founder ? `Built by ${SITE.founder}, ` : ''}a student in Kathmandu. If a lesson is wrong or
                  confusing,{' '}
                  <Link to="/contact" className="font-medium underline" style={{ color: 'var(--primary)' }}>
                    tell me
                  </Link>{' '}
                  and it gets fixed.
                </p>
              </div>
              <p
                className="mt-6 text-[19px]"
                style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
              >
                {SITE.founder}, Kathmandu
              </p>
            </div>

            <div className="lg:pt-10">
              <ul className="border-t" style={{ borderColor: 'var(--border)' }}>
                {PROMISES.map((promise) => (
                  <li key={promise.title} className="border-b py-5" style={{ borderColor: 'var(--border)' }}>
                    <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
                      {promise.title}
                    </h3>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                      {promise.body}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[12.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                Read the <Link className="underline" to="/privacy">Privacy Policy</Link>, the{' '}
                <Link className="underline" to="/content-policy">content policy</Link>, or{' '}
                <Link className="underline" to="/about">more about the project</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tutoring modes: a single quiet line of links ─────────────────── */}
      <section className="border-y py-10" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="container-page flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
            Answer styles
          </span>
          {TUTOR_MODES.map((mode, index) => (
            <span key={mode.id} className="inline-flex items-center gap-3">
              <Link to={`/app/tutor?mode=${mode.id}`} className="text-[13.5px] hover:underline" style={{ color: 'var(--text-soft)' }}>
                {mode.label}
              </Link>
              {index < TUTOR_MODES.length - 1 && (
                <span aria-hidden="true" style={{ color: 'var(--border-strong)' }}>
                  /
                </span>
              )}
            </span>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
            <div>
              <p className="rule-gold eyebrow">Questions</p>
              <h2 className="section-title mt-1">Asked before signing up.</h2>
              <p className="mt-4 text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                Still stuck?{' '}
                <Link className="underline" to="/help">Read the help guide</Link> or{' '}
                <Link className="underline" to="/contact">send a message</Link>.
              </p>
            </div>
            <Faq items={FAQ_ITEMS} />
          </div>
        </div>
      </section>

      {/* ── Closing ──────────────────────────────────────────────────────── */}
      <section className="border-t py-14 sm:py-16" style={{ borderColor: 'var(--border)' }}>
        <div className="container-page">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="section-title max-w-[22ch]">Start with the question you are stuck on.</h2>
              <p className="mt-3 max-w-[46ch] text-[14.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                It takes about a minute to set your grade and subjects. Leave whenever you like; nothing is saved
                until you make an account.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StartLearningButton size="lg" iconRight={<ArrowRight className="h-4 w-4" aria-hidden="true" />}>
                Start studying
              </StartLearningButton>
              <Link to="/signup" className="text-sm font-medium underline underline-offset-4" style={{ color: 'var(--text-soft)' }}>
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
