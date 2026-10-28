import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  BrainCircuit,
  ChevronDown,
  ClipboardList,
  CloudOff,
  GraduationCap,
  LayoutDashboard,
  Layers,
  LogIn,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Sparkles,
  Mountain,
  TrendingUp,
  UserRoundPlus,
  Wrench,
  X,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from './PublicLayout';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthProvider';
import { GuestBanner } from '@/features/auth/GuestBanner';
import { SetupNudge } from '@/features/auth/SetupNudge';
import { useContent } from '@/features/content/ContentProvider';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { storageModeText } from '@/services/data';
import { gradeLabel } from '@shared/labels';
import { cn, initials } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/everest', label: 'Everest AI', icon: Mountain },
  { to: '/app/tutor', label: 'AI Tutor', icon: BrainCircuit },
  { to: '/app/quizzes', label: 'Quizzes', icon: ClipboardList },
  { to: '/app/notes', label: 'Notes', icon: BookOpen },
  { to: '/app/flashcards', label: 'Flashcards', icon: Layers },
  { to: '/app/planner', label: 'Study planner', icon: GraduationCap },
  { to: '/app/progress', label: 'Progress', icon: TrendingUp },
  { to: '/app/tools', label: 'Study tools', icon: Wrench },
];

const MOBILE_NAV: NavItem[] = [
  { to: '/app', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/app/everest', label: 'Everest', icon: Mountain },
  { to: '/app/tutor', label: 'Tutor', icon: Sparkles },
  { to: '/app/quizzes', label: 'Quiz', icon: ClipboardList },
  { to: '/app/notes', label: 'Notes', icon: BookOpen },
  { to: '/app/planner', label: 'Plan', icon: GraduationCap },
];

export function AppLayout() {
  const { user, profile, mode, signOut, isBrowserGuest } = useAuth();
  const { role } = useContent();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setUserMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!userMenu) return;
    const onClick = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) setUserMenu(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [userMenu]);

  const name = profile?.displayName || user?.displayName || 'Student';
  const grade = profile?.preferences.grade;

  const linkClass = (isActive: boolean) =>
    cn(
      'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
      isActive ? 'nav-link-active' : 'hover:bg-[color:var(--surface-2)]',
    );

  return (
    <div className="app-shell flex">
      <a href="#app-main" className="skip-link">
        Skip to content
      </a>

      <aside
        className="sticky top-0 hidden h-[100dvh] w-64 shrink-0 flex-col border-r px-3 py-4 lg:flex"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <Link to="/" className="px-2 py-1" aria-label="Ujyalo Learn home">
          <Logo size={34} />
        </Link>
        <nav aria-label="Learning" className="mt-5 flex-1 space-y-0.5 overflow-y-auto scroll-thin">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => linkClass(isActive)}
              style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-soft)' })}
            >
              <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-2 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
          {role !== 'student' && (
            <NavLink
              to="/admin"
              className={({ isActive }) => linkClass(isActive)}
              style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-soft)' })}
            >
              <ShieldCheck className="h-[18px] w-[18px]" aria-hidden="true" />
              Admin
            </NavLink>
          )}
          <NavLink to="/app/settings" className={({ isActive }) => linkClass(isActive)} style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-soft)' })}>
            <Settings className="h-[18px] w-[18px]" aria-hidden="true" />
            Settings
          </NavLink>
          <p className="mt-2 rounded-xl px-3 py-2 text-[11px] leading-relaxed" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
            {mode === 'local' ? 'Local demo mode — data stays in this browser.' : 'Private to your account.'}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <GuestBanner />
        <SetupNudge />
        <header
          className="sticky top-0 z-40 border-b backdrop-blur"
          style={{ background: 'color-mix(in srgb, var(--bg) 90%, transparent)', borderColor: 'var(--border)' }}
        >
          <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                className="btn-icon lg:hidden"
                onClick={() => setMenuOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={menuOpen}
              >
                <Menu className="h-5 w-5" />
              </button>
              <Link to="/app" className="lg:hidden" aria-label="Ujyalo Learn dashboard">
                <Logo size={28} withText={false} />
              </Link>
              <div className="hidden min-w-0 lg:block">
                <p className="truncate text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  {name}
                </p>
                <p className="truncate text-[11px] text-muted">
                  {grade ? gradeLabel(grade) : 'Student'} · {storageModeText()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {!online && (
                <span className="badge badge-gold mr-1 hidden sm:inline-flex" title="AI features need a connection">
                  <CloudOff className="h-3 w-3" /> Offline
                </span>
              )}
              <ThemeToggle />
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenu((value) => !value)}
                  className="flex items-center gap-1.5 rounded-xl p-1.5 hover:bg-[color:var(--surface-2)]"
                  aria-haspopup="menu"
                  aria-expanded={userMenu}
                  aria-label="Account menu"
                >
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                    style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                  >
                    {initials(name)}
                  </span>
                  <ChevronDown className="hidden h-4 w-4 text-muted sm:block" aria-hidden="true" />
                </button>
                {userMenu && (
                  <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 w-56 rounded-xl border p-1.5 shadow-lift"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-semibold" style={{ color: 'var(--text)' }}>
                        {name}
                      </p>
                      <p className="truncate text-xs text-muted">{user?.email ?? 'No account yet'}</p>
                      {isBrowserGuest ? (
                        <p className="mt-1 text-[11px] text-muted">Guest · saved in this browser</p>
                      ) : mode === 'local' ? (
                        <p className="mt-1 text-[11px] text-muted">Demo account (this browser)</p>
                      ) : null}
                    </div>
                    <div className="my-1 h-px" style={{ background: 'var(--border)' }} />

                    {/* Voluntary, never a wall: the reason is stated before the ask. */}
                    {isBrowserGuest && (
                      <>
                        <Link
                          to={`/signup?next=${encodeURIComponent(location.pathname)}`}
                          role="menuitem"
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-[color:var(--surface-2)]"
                          style={{ color: 'var(--primary)' }}
                        >
                          <UserRoundPlus className="h-4 w-4" /> Create an account
                        </Link>
                        <Link
                          to={`/login?next=${encodeURIComponent(location.pathname)}`}
                          role="menuitem"
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[color:var(--surface-2)]"
                        >
                          <LogIn className="h-4 w-4" /> Log in
                        </Link>
                        <div className="my-1 h-px" style={{ background: 'var(--border)' }} />
                      </>
                    )}
                    <Link
                      to="/app/settings"
                      role="menuitem"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[color:var(--surface-2)]"
                    >
                      <Settings className="h-4 w-4" /> Settings & preferences
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[color:var(--surface-2)]"
                      onClick={async () => {
                        await signOut();
                        navigate('/');
                      }}
                    >
                      <LogOut className="h-4 w-4" /> {isBrowserGuest ? 'Leave guest session' : 'Log out'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main id="app-main" className="mx-auto w-full max-w-6xl flex-1 px-3 pb-24 pt-4 sm:px-5 sm:pt-6 lg:pb-10">
          <Outlet />
        </main>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[rgba(4,10,24,0.5)]" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <div
            className="absolute inset-y-0 left-0 w-[82%] max-w-xs overflow-y-auto p-4 shadow-lift"
            style={{ background: 'var(--surface)' }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex items-center justify-between">
              <Logo size={30} />
              <button type="button" className="btn-icon" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav aria-label="Learning" className="mt-4 space-y-0.5">
              {[...NAV, { to: '/app/settings', label: 'Settings', icon: Settings }].map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => linkClass(isActive)}
                  style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-soft)' })}
                >
                  <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-4 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
              <Button
                variant="secondary"
                fullWidth
                icon={<LogOut className="h-4 w-4" />}
                onClick={async () => {
                  await signOut();
                  navigate('/');
                }}
              >
                Log out
              </Button>
            </div>
          </div>
        </div>
      )}

      <nav
        aria-label="Quick navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <ul className="grid grid-cols-5">
          {MOBILE_NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className="flex flex-col items-center gap-0.5 px-1 py-2 text-[11px] font-medium"
                style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--muted)' })}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
