import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Info, Sparkles, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from './AuthProvider';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { mode } = useAuth();

  return (
    <div className="container-page grid min-h-[calc(100dvh-4rem)] items-center gap-10 py-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
      <div className="hidden lg:block">
        <Logo size={44} />
        <h2 className="mt-8 text-3xl font-extrabold leading-tight tracking-tight">
          Learn with a tutor that
          <br />
          <span style={{ color: 'var(--primary)' }}>meets you where you are.</span>
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
          Ujyalo Learn is built for students who want to understand — not just copy. Ask questions, practise with quizzes
          and keep everything you learn in one place.
        </p>
        <ul className="mt-7 space-y-4">
          {[
            { icon: Sparkles, title: 'Explanations at your level', body: 'Grade-aware answers in English or Nepali.' },
            { icon: GraduationCap, title: 'Practice that teaches', body: 'Quizzes with an explanation for every answer.' },
            { icon: ShieldCheck, title: 'Private by default', body: 'Your notes and conversations belong to you.' },
          ].map((item) => (
            <li key={item.title} className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                <item.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  {item.title}
                </span>
                <span className="block text-[13px] text-muted">{item.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 flex justify-center lg:hidden">
          <Link to="/" aria-label="Ujyalo Learn home">
            <Logo size={40} />
          </Link>
        </div>

        <div className="card p-6 sm:p-7">
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>

          {mode === 'local' && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[12px] leading-relaxed" style={{ borderColor: 'color-mix(in srgb, var(--accent) 45%, transparent)', background: 'var(--accent-soft)', color: 'var(--accent-text)' }}>
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <p>
                <strong>Demo mode.</strong> Firebase is not configured, so accounts stay in this browser only and are not
                secure. The site owner can enable real accounts by following the setup guide in <code>README.md</code>.
              </p>
            </div>
          )}

          <div className="mt-5">{children}</div>
        </div>

        {footer && <div className="mt-4 text-center text-sm text-muted">{footer}</div>}
      </div>
    </div>
  );
}
