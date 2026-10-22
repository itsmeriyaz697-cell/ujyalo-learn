import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckCircle2, FileText, Plus, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useContent } from '@/features/content/ContentProvider';

const formatWhen = (iso: string) => {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (Number.isNaN(minutes)) return '—';
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export default function AdminDashboard() {
  const { courses, resources, audit, reloadAudit, role, mode } = useContent();

  useEffect(() => {
    void reloadAudit();
  }, [reloadAudit]);

  const stats = [
    { label: 'Published courses', value: courses.filter((course) => course.status === 'published').length },
    { label: 'Draft courses', value: courses.filter((course) => course.status === 'draft').length },
    { label: 'Published resources', value: resources.filter((item) => item.status === 'published').length },
    { label: 'Draft resources', value: resources.filter((item) => item.status === 'draft').length },
  ];

  const recent = audit.slice(0, 6);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-soft">
            Publishing state for the public library. No student data is shown here.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/admin/courses/new">
              <Plus className="mr-1 h-4 w-4" aria-hidden="true" /> New course
            </Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link to="/admin/resources/new">
              <Plus className="mr-1 h-4 w-4" aria-hidden="true" /> New resource
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5">
            <p className="text-3xl font-extrabold tracking-tight">{stat.value}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Recent activity</h2>
            <Link to="/admin/audit" className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--primary)' }}>
              Audit log <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="mt-4 rounded-xl p-5 text-sm" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
              <ScrollText className="mb-2 h-5 w-5" aria-hidden="true" />
              Nothing recorded yet. Publishing a course or resource adds an entry here.
            </div>
          ) : (
            <ul className="mt-4 divide-y" style={{ borderColor: 'var(--border)' }}>
              {recent.map((event) => (
                <li key={event.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{event.summary}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      {event.action} · {event.actorEmail || event.actorId}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs" style={{ color: 'var(--muted)' }}>
                    {formatWhen(event.at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="text-base font-bold">Publishing checklist</h2>
            <ul className="mt-3 space-y-2 text-sm text-soft">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--success)' }} aria-hidden="true" />
                Every resource needs a source and a licence before it can be published.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--success)' }} aria-hidden="true" />
                Course slugs are validated and become public URLs.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--success)' }} aria-hidden="true" />
                Drafts never appear on the public site or in the sitemap.
              </li>
            </ul>
          </div>

          <div className="card p-5">
            <h2 className="text-base font-bold">Your role</h2>
            <p className="mt-1 text-sm text-soft">
              <strong>{role}</strong> — {role === 'editor' ? 'content only, no settings or roles' : 'content, settings and audit history'}
              {mode === 'firebase' ? ', enforced by Firestore rules.' : ' (demo workspace).'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link to="/admin/courses" className="card card-hover flex items-center gap-3 p-5">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
            <BookOpen className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold">Manage courses</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{courses.length} total</p>
          </div>
        </Link>
        <Link to="/admin/resources" className="card card-hover flex items-center gap-3 p-5">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
            <FileText className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold">Manage resources</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{resources.length} total</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
