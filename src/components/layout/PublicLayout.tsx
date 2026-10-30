import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowUpRight, Menu, Moon, Sun, X } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { SiteSearch } from '@/components/layout/SiteSearch';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/features/auth/AuthProvider';
import { cn } from '@/lib/utils';

/**
 * The five items the product is actually organised around. Everything else
 * (SEE preparation, the AI tutor, pricing, help) lives in the footer or inside
 * the page it belongs to, because a header with nine links is a directory,
 * not a product.
 */
const NAV = [
  { to: '/resources', label: 'Explore' },
  { to: '/subjects', label: 'Subjects' },
  { to: '/global-quiz', label: 'Practice' },
  { to: '/opportunities', label: 'Opportunities' },
  { to: '/about', label: 'About' },
];

const FOOTER_LEARN = [
  { to: '/subjects', label: 'Subjects' },
  { to: '/resources', label: 'Learning library' },
  { to: '/global-quiz', label: 'Practice & quizzes' },
  { to: '/see-preparation', label: 'SEE preparation' },
  { to: '/opportunities', label: 'Opportunities' },
  { to: '/app/tutor', label: 'AI study helper' },
  { to: '/courses', label: 'Courses' },
  { to: '/pricing', label: 'What is free' },
];

const FOOTER_COMPANY = [
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/faq', label: 'FAQ' },
  { to: '/help', label: 'Help centre' },
  { to: '/privacy', label: 'Privacy policy' },
  { to: '/terms', label: 'Terms' },
  { to: '/accessibility', label: 'Accessibility' },
  { to: '/content-policy', label: 'Content policy' },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const nextLabel = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  return (
    <button type="button" className={cn('btn-icon', className)} onClick={toggleTheme} aria-label={nextLabel} title={nextLabel}>
      {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}

export function PublicLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, isBrowserGuest } = useAuth();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header
        className="sticky top-0 z-40 border-b backdrop-blur"
        style={{ background: 'color-mix(in srgb, var(--bg) 90%, transparent)', borderColor: 'var(--border)' }}
      >
        <div className="container-page flex h-16 items-center justify-between gap-3">
          <Link to="/" aria-label="Ujyalo Learn home" className="shrink-0 rounded-md">
            <Logo size={36} />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <SiteSearch />
            <ThemeToggle />
            {user ? (
              <>
                {/* A visitor who already used the app without an account still
                    needs a visible way back to a real one. */}
                {isBrowserGuest && (
                  <Button asChild variant="ghost" size="sm" className="hidden whitespace-nowrap sm:inline-flex">
                    <Link to="/login">Log in</Link>
                  </Button>
                )}
                <Button asChild variant="primary" size="sm" className="hidden sm:inline-flex">
                  <Link to="/app">Open dashboard</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden whitespace-nowrap sm:inline-flex">
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild variant="primary" size="sm" className="hidden whitespace-nowrap sm:inline-flex">
                  <Link to="/signup">Sign up</Link>
                </Button>
              </>
            )}
            <button
              type="button"
              className="btn-icon lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <nav id="mobile-nav" aria-label="Mobile" className="border-t px-4 pb-4 pt-2 lg:hidden" style={{ borderColor: 'var(--border)' }}>
            <ul className="flex flex-col">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) => cn('nav-link block w-full py-2.5', isActive && 'nav-link-active')}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {user ? (
                <Button asChild fullWidth className="col-span-2">
                  <Link to="/app">Open dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="secondary" fullWidth>
                    <Link to="/login">Log in</Link>
                  </Button>
                  <Button asChild fullWidth>
                    <Link to="/signup">Sign up</Link>
                  </Button>
                </>
              )}
            </div>
            <p className="mt-3 text-xs text-muted">
              Looking for exam practice?{' '}
              <Link to="/see-preparation" className="underline" style={{ color: 'var(--text)' }}>
                SEE preparation
              </Link>
            </p>
          </nav>
        )}
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-16 border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Logo size={36} showTagline />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Free lessons, practice questions, timed mock exams and a directory of verified educational
              opportunities — for students in Nepal, Grades 1–12. No account needed to start.
            </p>
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-muted">
              Practice answers are written for study, not as official exam material. Anything important should be
              checked against your textbook or teacher.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Learn
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {FOOTER_LEARN.map((item) => (
                <li key={item.to}>
                  <Link className="text-muted hover:underline" to={item.to}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Ujyalo Learn
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {FOOTER_COMPANY.map((item) => (
                <li key={item.to}>
                  <Link className="text-muted hover:underline" to={item.to}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <a
              className="mt-3 inline-flex items-center gap-1 text-sm text-muted hover:underline"
              href="https://github.com/itsmeriyaz697-cell/ujyalo-learn"
              target="_blank"
              rel="noreferrer noopener"
            >
              Source code
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className="border-t px-4 py-5" style={{ borderColor: 'var(--border)' }}>
          <div className="container-page flex flex-col items-start justify-between gap-2 px-0 text-xs text-muted sm:flex-row sm:items-center">
            <p>
              © {new Date().getFullYear()} Ujyalo Learn — Built by{' '}
              <strong style={{ color: 'var(--text-soft)' }}>Riyaz Chalise</strong> in Nepal.
            </p>
            <p>Grades 1–12 · Free to start</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
