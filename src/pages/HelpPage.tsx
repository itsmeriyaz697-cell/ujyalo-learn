import { Link } from 'react-router-dom';
import { AlertTriangle, BookOpen, KeyRound, MessageSquareWarning, Settings2 } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { seoFor } from '@/config/seoPages';
import { Section, SectionHeading, Faq } from '@/components/marketing/Section';
import { Button } from '@/components/ui/Button';
import { InlineAlert } from '@/components/ui/Feedback';
import { PageContent } from '@/components/marketing/PageContent';

const FAQS = [
  {
    question: 'How do I ask the AI tutor a question?',
    answer:
      'Open AI Tutor from your dashboard, type your question and press Enter or the send button. Choose a tutoring mode (for example Step-by-Step or Nepali Explanation) before or during a conversation to change how answers are written.',
  },
  {
    question: 'Why did the tutor stop or show an error?',
    answer:
      'AI features need an internet connection and a configured AI provider. If the service is temporarily unavailable or you have reached a usage limit, you will see a clear message. Your conversations are still saved, and you can try again shortly.',
  },
  {
    question: 'How are quizzes scored?',
    answer:
      'Multiple-choice and true/false answers are matched exactly. Short answers and fill-in-the-blank answers accept sensible variants supplied with the question, ignore capitalisation and extra spacing, and treat equivalent numbers (1,200 vs 1200) as the same. You see the explanation for every question after submitting.',
  },
  {
    question: 'Are my notes and conversations private?',
    answer:
      'Yes. Data is stored per account and protected by database security rules so that only you can read it. Administrators do not browse student conversations by default. You can delete items individually or erase all your data in Settings.',
  },
  {
    question: 'Can I use the app offline?',
    answer:
      'The app shell and previously loaded pages may open offline once cached, but the AI tutor, quiz generation and cloud sync require a connection. AI answers are never promised offline.',
  },
  {
    question: 'How do I change my grade or subjects?',
    answer:
      'Go to Settings → Learning preferences. Changes apply to future explanations immediately. You can also change your preferred language and explanation style there.',
  },
  {
    question: 'I found a wrong or inappropriate answer. What should I do?',
    answer:
      'Please report it. Use the report link on the Contact page and include the topic and roughly when it happened — do not paste personal information. AI answers can be confidently wrong; always check important facts against your textbook or teacher.',
  },
  {
    question: 'How do I delete my account?',
    answer:
      'Settings → Account → Delete account. This deletes your profile and learning records, then removes the sign-in account. This action cannot be undone.',
  },
];

export default function HelpPage() {
  return (
    <>
      <Seo {...seoFor('/help')} />

      <Section className="!pb-6">
        <SectionHeading
          as="h1"
          eyebrow="Help centre"
          title="How can we help?"
          description="Quick answers about using Ujyalo Learn, plus what to do when something is not working."
        />
      </Section>

      <Section className="!py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BookOpen, title: 'Get started', body: 'Create an account, pick your grade and subjects, then ask your first question.', to: '/signup', cta: 'Create account' },
            { icon: Settings2, title: 'Preferences', body: 'Change grade, language, subjects and explanation style from Settings.', to: '/app/settings', cta: 'Open settings' },
            { icon: AlertTriangle, title: 'AI limits', body: 'Usage limits protect the service. Notes, planner and past quizzes keep working.', to: '/pricing', cta: 'See limits' },
            { icon: MessageSquareWarning, title: 'Report content', body: 'Tell us about an incorrect or inappropriate AI answer or quiz.', to: '/contact?topic=report', cta: 'Report a problem' },
          ].map((item) => (
            <div key={item.title} className="card p-5">
              <item.icon className="h-5 w-5" style={{ color: 'var(--primary)' }} aria-hidden="true" />
              <h2 className="mt-3 text-sm font-semibold" style={{ color: 'var(--text)' }}>
                {item.title}
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{item.body}</p>
              <Link to={item.to} className="mt-3 inline-block text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                {item.cta} →
              </Link>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="surface" className="!py-10">
        <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
        <div className="mt-6 max-w-3xl">
          <Faq items={FAQS} />
        </div>
      </Section>

      <PageContent path="/help" />
      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
              For the site owner: setup checklist
            </h2>
            <p className="mt-1 text-sm text-muted">
              Ujyalo Learn needs two external services to be fully live. Until they are configured, the app runs in a
              clearly-labelled local demo mode.
            </p>
            <ol className="mt-4 space-y-3 text-sm text-soft">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>1</span>
                <span>
                  <strong>Firebase</strong> — create a project, enable Email/Password and Google sign-in, add the web app
                  keys as <code>VITE_FIREBASE_*</code> environment variables, and deploy the included Firestore rules.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>2</span>
                <span>
                  <strong>AI provider</strong> — set <code>AI_API_KEY</code>, <code>AI_API_BASE_URL</code> and{' '}
                  <code>AI_MODEL</code> as server-side environment variables in Vercel (no <code>VITE_</code> prefix), then
                  confirm <code>/api/health</code> reports <code>configured: true</code>.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>3</span>
                <span>
                  <strong>Production domain</strong> — set <code>VITE_SITE_URL</code> so canonical URLs and the generated
                  sitemap use your real domain, then rebuild.
                </span>
              </li>
            </ol>
            <p className="mt-3 text-xs text-muted">
              The repository README contains exact steps for Firebase, AI providers, Firestore rules, indexes and Vercel
              deployment.
            </p>
          </div>

          <div className="space-y-3">
            <InlineAlert tone="warning" title="AI can be wrong">
              Explanations, quizzes and summaries are generated by an AI model. They are not official curriculum material
              and may contain errors. Check important facts before relying on them for exams.
            </InlineAlert>
            <InlineAlert tone="info" title="No AI key in the browser">
              The provider API key stays on the server. Students never need an API key to use the basic app.
            </InlineAlert>
            <div className="card p-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" style={{ color: 'var(--primary)' }} aria-hidden="true" />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  Still stuck?
                </h3>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                Send a message with your browser, device and what you were trying to do. Never send passwords, API keys or
                another student’s information.
              </p>
              <Button asChild variant="secondary" size="sm" className="mt-3">
                <Link to="/contact">Contact us</Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
