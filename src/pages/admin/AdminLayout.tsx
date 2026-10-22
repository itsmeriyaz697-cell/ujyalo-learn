import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Gauge,
  Info,
  ScrollText,
  Search,
  Settings,
  ShieldAlert,
} from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { PageLoader } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthProvider';
import { useContent } from '@/features/content/ContentProvider';
import { ROLE_LABEL, canManageContent } from '@/features/content/store';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/admin', label: 'Overview', icon: Gauge, end: true },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen, end: false },
  { to: '/admin/resources', label: 'Resources', icon: FileText, end: false },
  { to: '/admin/seo', label: 'SEO', icon: Search, end: false },
  { to: '/admin/audit', label: 'Audit log', icon: ScrollText, end: false },
  { to: '/admin/settings', label: 'Settings', icon: Settings, end: false },
];

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const { role, roleLoading, mode } = useContent();
  const location = useLocation();

  if (loading || roleLoading) return <PageLoader label="Checking your permissions…" />;

  // The UI gate is convenience only: Firestore rules refuse writes from
  // accounts without a role document, whatever the browser shows.
  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (!canManageContent(role)) {
    return (
      <div className="container-page py-16">
        <Seo title="Admin access — Ujyalo Learn" description="Restricted area." path="/admin" noindex />
        <div className="card mx-auto max-w-lg p-7 text-center">
          <ShieldAlert className="mx-auto h-9 w-9" style={{ color: 'var(--warning, #B45309)' }} aria-hidden="true" />
          <h1 className="mt-3 text-xl font-bold">This account has no admin role</h1>
          <p className="mt-2 text-sm text-soft">
            Signed in as <strong>{user.email}</strong>. Ask the owner to grant a role — roles are stored server-side and
            checked by the database rules, not by this page.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button asChild variant="secondary">
              <Link to="/app">Back to the app</Link>
            </Button>
            <Button asChild>
              <Link to="/">Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg)' }}>
      <Seo title="Admin — Ujyalo Learn" description="Content administration." path="/admin" noindex />

      <header className="sticky top-0 z-30 border-b backdrop-blur" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface) 88%, transparent)' }}>
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/app" className="btn-icon" aria-label="Back to the student app">
              <ArrowLeft className="h-[18px] w-[18px]" />
            </Link>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">Ujyalo Learn admin</p>
              <p className="truncate text-xs" style={{ color: 'var(--muted)' }}>
                {user.email} · {ROLE_LABEL[role]}
              </p>
            </div>
          </div>
          <Link to="/" className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
            View site
          </Link>
        </div>

        <div className="container-page flex gap-1 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive ? 'text-white' : 'hover:bg-[var(--surface-2)]',
                )
              }
              style={({ isActive }: { isActive: boolean }) =>
                isActive ? { background: 'var(--primary)' } : { color: 'var(--text-soft)' }
              }
            >
              <tab.icon className="h-3.5 w-3.5" aria-hidden="true" />
              {tab.label}
            </NavLink>
          ))}
        </div>
      </header>

      {mode === 'local' && (
        <div className="border-b px-4 py-2 text-center text-xs" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text-soft)' }}>
          <Info className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
          Demo workspace — Firebase is not configured, so this content is stored in <strong>this browser only</strong> and
          is not published to any server.
        </div>
      )}

      <main className="container-page py-8">
        <Outlet />
      </main>
    </div>
  );
}
