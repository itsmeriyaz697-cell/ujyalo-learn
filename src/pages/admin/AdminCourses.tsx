import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit3, ExternalLink, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InlineAlert } from '@/components/ui/Feedback';
import { useContent } from '@/features/content/ContentProvider';
import { LEVEL_LABEL, type ContentStatus } from '@/features/content/types';
import { getSubject } from '@/config/curriculum';

const STATUS_STYLE: Record<ContentStatus, { bg: string; fg: string }> = {
  published: { bg: 'color-mix(in srgb, var(--success) 16%, transparent)', fg: 'var(--success)' },
  draft: { bg: 'var(--surface-2)', fg: 'var(--text-soft)' },
  archived: { bg: 'color-mix(in srgb, var(--warning, #B45309) 16%, transparent)', fg: 'var(--warning, #B45309)' },
};

export default function AdminCourses() {
  const { courses, deleteCourse } = useContent();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ContentStatus | 'all'>('all');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((course) => {
      if (status !== 'all' && course.status !== status) return false;
      if (!q) return true;
      return `${course.title} ${course.tags.join(' ')}`.toLowerCase().includes(q);
    });
  }, [courses, query, status]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Courses</h1>
          <p className="mt-1 text-sm text-soft">Learning paths shown on /courses. Only published courses are public.</p>
        </div>
        <Button asChild size="sm">
          <Link to="/admin/courses/new">
            <Plus className="mr-1 h-4 w-4" aria-hidden="true" /> New course
          </Link>
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">Search courses</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted)' }} aria-hidden="true" />
          <input className="input pl-9" placeholder="Search by title or tag" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <select className="input max-w-[180px]" value={status} onChange={(event) => setStatus(event.target.value as ContentStatus | 'all')} aria-label="Filter by status">
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {error && (
        <div className="mt-4">
          <InlineAlert tone="warning">{error}</InlineAlert>
        </div>
      )}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              <th className="py-2 pr-3 font-semibold">Title</th>
              <th className="py-2 pr-3 font-semibold">Subject</th>
              <th className="py-2 pr-3 font-semibold">Grades</th>
              <th className="py-2 pr-3 font-semibold">Level</th>
              <th className="py-2 pr-3 font-semibold">Status</th>
              <th className="py-2 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((course) => (
              <tr key={course.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="py-3 pr-3">
                  <Link to={`/admin/courses/${course.id}`} className="font-medium hover:underline">
                    {course.title}
                  </Link>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    /courses/{course.slug}
                  </p>
                </td>
                <td className="py-3 pr-3">{getSubject(course.subjectId)?.name ?? '—'}</td>
                <td className="py-3 pr-3">
                  {course.gradeMin}–{course.gradeMax}
                </td>
                <td className="py-3 pr-3">{LEVEL_LABEL[course.level]}</td>
                <td className="py-3 pr-3">
                  <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: STATUS_STYLE[course.status].bg, color: STATUS_STYLE[course.status].fg }}>
                    {course.status}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    {course.status === 'published' && (
                      <a href={`/courses/${course.slug}`} target="_blank" rel="noreferrer" className="btn-icon" aria-label={`Open public page for ${course.title}`}>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <Link to={`/admin/courses/${course.id}`} className="btn-icon" aria-label={`Edit ${course.title}`}>
                      <Edit3 className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      className="btn-icon"
                      aria-label={`Delete ${course.title}`}
                      onClick={() => setPendingDelete(course.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
                  No courses match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-course">
          <div className="absolute inset-0" style={{ background: 'rgba(3, 10, 26, 0.55)' }} onClick={() => setPendingDelete(null)} />
          <div className="card relative w-full max-w-md p-6">
            <h2 id="delete-course" className="text-lg font-bold">
              Delete this course?
            </h2>
            <p className="mt-2 text-sm text-soft">
              It disappears from the public site immediately. This cannot be undone from the app.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPendingDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  try {
                    await deleteCourse(pendingDelete);
                    setError(null);
                  } catch {
                    setError('The course could not be deleted. Check your role and try again.');
                  } finally {
                    setPendingDelete(null);
                  }
                }}
              >
                Delete course
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
