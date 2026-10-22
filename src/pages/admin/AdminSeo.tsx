import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, RotateCcw, Search, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InlineAlert } from '@/components/ui/Feedback';
import { useContent } from '@/features/content/ContentProvider';
import { canManageContent } from '@/features/content/store';
import { isSafeSeoValue, type SeoOverride } from '@/features/content/types';
import { SEO_PAGES } from '@/config/seoPages';

/**
 * Editorial control over page metadata.
 *
 * Defaults come from shared/seo-pages.json (baked into the prerendered HTML).
 * An override is stored in Firestore and applied at runtime, so an editor can
 * fix a weak title without a deploy. Overrides are plain text — markup is
 * rejected in the form and again by the rules' length/type checks.
 */
export default function AdminSeo() {
  const { seoOverrides, saveSeoOverride, role } = useContent();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<SeoOverride>>({});
  const [notice, setNotice] = useState<{ tone: 'success' | 'warning'; text: string } | null>(null);

  const pages = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SEO_PAGES.filter((page) => !q || page.path.includes(q) || page.title.toLowerCase().includes(q));
  }, [query]);

  if (!canManageContent(role)) {
    return (
      <div className="card max-w-lg p-6">
        <ShieldAlert className="h-7 w-7" style={{ color: 'var(--warning, #B45309)' }} aria-hidden="true" />
        <h1 className="mt-3 text-lg font-bold">SEO settings are restricted</h1>
        <p className="mt-2 text-sm text-soft">Your role cannot change page metadata.</p>
      </div>
    );
  }

  function startEdit(path: string, defaults: { title: string; description: string }) {
    const existing = seoOverrides[path];
    setEditing(path);
    setDraft({
      path,
      title: existing?.title ?? defaults.title,
      description: existing?.description ?? defaults.description,
      ogImage: existing?.ogImage ?? '',
      noindex: existing?.noindex ?? false,
    });
    setNotice(null);
  }

  async function save() {
    if (!draft.path) return;
    if (!isSafeSeoValue(draft.title ?? '') || !isSafeSeoValue(draft.description ?? '')) {
      setNotice({ tone: 'warning', text: 'Titles and descriptions must be plain text without < or >, and under 320 characters.' });
      return;
    }
    if (draft.ogImage && !/^https:\/\//i.test(draft.ogImage)) {
      setNotice({ tone: 'warning', text: 'The social image must be an https:// URL.' });
      return;
    }
    try {
      await saveSeoOverride({
        path: draft.path,
        title: (draft.title ?? '').trim(),
        description: (draft.description ?? '').trim(),
        ogImage: (draft.ogImage ?? '').trim(),
        noindex: Boolean(draft.noindex),
        updatedAt: new Date().toISOString(),
        updatedBy: role,
      });
      setNotice({ tone: 'success', text: 'Saved. The running app uses this immediately.' });
      setEditing(null);
    } catch {
      setNotice({ tone: 'warning', text: 'Could not save. Check your role and connection.' });
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">SEO</h1>
      <p className="mt-1 max-w-2xl text-sm text-soft">
        Titles and descriptions for the public pages. Defaults ship in the build; overrides saved here take effect at
        runtime. Static HTML is regenerated on the next deploy, so a crawler sees the default until then.
      </p>

      {notice && (
        <div className="mt-4">
          <InlineAlert tone={notice.tone}>{notice.text}</InlineAlert>
        </div>
      )}

      <div className="mt-5 max-w-md">
        <label className="relative block">
          <span className="sr-only">Filter pages</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted)' }} aria-hidden="true" />
          <input className="input pl-9" placeholder="Filter by path or title" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </div>

      <div className="mt-5 space-y-2">
        {pages.map((page) => {
          const override = seoOverrides[page.path];
          const isEditing = editing === page.path;
          return (
            <div key={page.path} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="text-xs" style={{ color: 'var(--muted)' }}>{page.path}</code>
                    {override && (
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                        overridden
                      </span>
                    )}
                    {override?.noindex && (
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: 'var(--surface-3)' }}>
                        noindex
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-semibold">{override?.title || page.title}</p>
                  <p className="mt-0.5 text-sm text-soft">{override?.description || page.description}</p>
                  <p className="mt-1 text-[11px]" style={{ color: 'var(--muted)' }}>
                    {(override?.title || page.title).length} char title ·{' '}
                    {(override?.description || page.description).length} char description
                    {(override?.title || page.title).length > 60 ? ' · title may be truncated in search' : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <a href={page.path} target="_blank" rel="noreferrer" className="btn-icon" aria-label={`Open ${page.path}`}>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <Button size="sm" variant="secondary" onClick={() => startEdit(page.path, page)}>
                    {override ? 'Edit override' : 'Override'}
                  </Button>
                </div>
              </div>

              {isEditing && (
                <div className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <label htmlFor={`seo-title-${page.path}`} className="text-sm font-semibold">Title</label>
                    <input
                      id={`seo-title-${page.path}`}
                      className="input mt-1.5"
                      value={draft.title ?? ''}
                      onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                      maxLength={160}
                    />
                  </div>
                  <div>
                    <label htmlFor={`seo-desc-${page.path}`} className="text-sm font-semibold">Meta description</label>
                    <textarea
                      id={`seo-desc-${page.path}`}
                      className="input mt-1.5 min-h-[70px]"
                      value={draft.description ?? ''}
                      onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                      maxLength={320}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <div>
                      <label htmlFor={`seo-image-${page.path}`} className="text-sm font-semibold">Social image (https)</label>
                      <input
                        id={`seo-image-${page.path}`}
                        className="input mt-1.5"
                        placeholder="Leave empty to use /og-image.png"
                        value={draft.ogImage ?? ''}
                        onChange={(event) => setDraft({ ...draft, ogImage: event.target.value })}
                      />
                    </div>
                    <label className="flex items-end gap-2 pb-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(draft.noindex)}
                        onChange={(event) => setDraft({ ...draft, noindex: event.target.checked })}
                      />
                      Hide from search
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={save}>Save</Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(null);
                        void saveSeoOverride({
                          path: page.path,
                          title: '',
                          description: '',
                          ogImage: '',
                          noindex: false,
                          updatedAt: new Date().toISOString(),
                          updatedBy: role,
                        });
                      }}
                    >
                      <RotateCcw className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Reset to default
                    </Button>
                  </div>
                  <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                    Plain text only. Markup is rejected — metadata fields cannot be used to inject scripts.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs" style={{ color: 'var(--muted)' }}>
        Course and guide pages derive their metadata from their own title and summary — edit those in{' '}
        <Link to="/admin/courses" className="underline">Courses</Link> or{' '}
        <Link to="/admin/resources" className="underline">Resources</Link>.
      </p>
    </div>
  );
}
