import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InlineAlert } from '@/components/ui/Feedback';
import { useContent } from '@/features/content/ContentProvider';
import {
  RESOURCE_TYPE_LABEL,
  isValidSlug,
  slugify,
  type ContentStatus,
  type Resource,
  type ResourceType,
} from '@/features/content/types';
import { SUBJECTS } from '@/config/curriculum';
import { makeId } from '@/lib/utils';

const EMPTY: Resource = {
  id: '',
  slug: '',
  title: '',
  description: '',
  type: 'guide',
  subjectId: null,
  grade: null,
  status: 'draft',
  body: [''],
  fileUrl: null,
  source: 'Ujyalo Learn',
  license: 'Ujyalo Learn original',
  tags: [],
  createdAt: '',
  updatedAt: '',
  updatedBy: '',
};

export default function AdminResourceEditor() {
  const { id = 'new' } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const { resources, saveResource, role } = useContent();

  const existing = useMemo(() => resources.find((item) => item.id === id), [resources, id]);
  const [draft, setDraft] = useState<Resource>(() => existing ?? { ...EMPTY, id: makeId('resource') });
  const [bodyText, setBodyText] = useState((existing?.body ?? ['']).join('\n\n'));
  const [tagsText, setTagsText] = useState((existing?.tags ?? []).join(', '));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'warning'; text: string } | null>(null);

  useEffect(() => {
    if (existing) {
      setDraft(existing);
      setBodyText(existing.body.join('\n\n'));
      setTagsText(existing.tags.join(', '));
    }
  }, [existing]);

  const problems: string[] = [];
  if (draft.title.trim().length < 6) problems.push('Title needs at least 6 characters.');
  if (!isValidSlug(draft.slug)) problems.push('Slug must be lowercase words separated by hyphens (3–60 characters).');
  if (resources.some((item) => item.slug === draft.slug && item.id !== draft.id)) problems.push('Another resource already uses this slug.');
  if (draft.description.trim().length < 20) problems.push('Description needs at least 20 characters.');
  if (!draft.source.trim()) problems.push('Source is required — no anonymous material.');
  if (!draft.license.trim()) problems.push('Licence is required before publishing.');
  if (bodyText.trim().length < 80 && !draft.fileUrl) problems.push('Add at least a short body, or link a file.');
  if (draft.fileUrl && !/^https:\/\//i.test(draft.fileUrl)) problems.push('File links must start with https://');

  const update = <K extends keyof Resource>(key: K, value: Resource[K]) => setDraft((prev) => ({ ...prev, [key]: value }));

  async function submit(status: ContentStatus) {
    if (status === 'published' && problems.length > 0) {
      setMessage({ tone: 'warning', text: 'Fix the problems below before publishing.' });
      return;
    }
    setSaving(true);
    const now = new Date().toISOString();
    try {
      await saveResource({
        ...draft,
        status,
        slug: draft.slug || slugify(draft.title),
        body: bodyText.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean),
        tags: tagsText.split(',').map((tag) => tag.trim()).filter(Boolean),
        updatedAt: now,
        createdAt: draft.createdAt || now,
        updatedBy: role,
      });
      setMessage({ tone: 'success', text: status === 'published' ? 'Published to the library.' : 'Saved as a draft.' });
      if (isNew) navigate('/admin/resources');
    } catch {
      setMessage({ tone: 'warning', text: 'Could not save. Check your role and connection.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <Link to="/admin/resources" className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--muted)' }}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Resources
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">{isNew ? 'New resource' : 'Edit resource'}</h1>
        <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: 'var(--surface-2)' }}>
          {draft.status}
        </span>
      </div>

      {message && (
        <div className="mt-4">
          <InlineAlert tone={message.tone}>{message.text}</InlineAlert>
        </div>
      )}

      <div className="mt-6 space-y-5">
        <div className="card space-y-4 p-5">
          <div>
            <label htmlFor="res-title" className="text-sm font-semibold">Title</label>
            <input
              id="res-title"
              className="input mt-1.5"
              value={draft.title}
              onChange={(event) => {
                const title = event.target.value;
                setDraft((prev) => ({ ...prev, title, slug: prev.slug || slugify(title) }));
              }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="res-slug" className="text-sm font-semibold">URL slug</label>
              <input id="res-slug" className="input mt-1.5" value={draft.slug} onChange={(event) => update('slug', slugify(event.target.value))} />
            </div>
            <div>
              <label htmlFor="res-type" className="text-sm font-semibold">Type</label>
              <select id="res-type" className="input mt-1.5" value={draft.type} onChange={(event) => update('type', event.target.value as ResourceType)}>
                {Object.entries(RESOURCE_TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="res-desc" className="text-sm font-semibold">Description</label>
            <textarea id="res-desc" className="input mt-1.5 min-h-[70px]" value={draft.description} onChange={(event) => update('description', event.target.value)} maxLength={240} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="res-subject" className="text-sm font-semibold">Subject</label>
              <select
                id="res-subject"
                className="input mt-1.5"
                value={draft.subjectId ?? ''}
                onChange={(event) => update('subjectId', event.target.value || null)}
              >
                <option value="">All subjects</option>
                {SUBJECTS.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="res-grade" className="text-sm font-semibold">Grade</label>
              <input
                id="res-grade"
                type="number"
                min={1}
                max={12}
                className="input mt-1.5"
                value={draft.grade ?? ''}
                onChange={(event) => update('grade', event.target.value ? Number(event.target.value) : null)}
                placeholder="Any"
              />
            </div>
          </div>

          <div>
            <label htmlFor="res-body" className="text-sm font-semibold">Body</label>
            <textarea
              id="res-body"
              className="input mt-1.5 min-h-[200px]"
              value={bodyText}
              onChange={(event) => setBodyText(event.target.value)}
              placeholder="Write the resource. Leave a blank line between paragraphs."
            />
            <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>Blank lines separate paragraphs. Plain text only — no HTML is rendered.</p>
          </div>

          <div>
            <label htmlFor="res-file" className="text-sm font-semibold">File link (optional)</label>
            <input
              id="res-file"
              className="input mt-1.5"
              value={draft.fileUrl ?? ''}
              onChange={(event) => update('fileUrl', event.target.value.trim() || null)}
              placeholder="https://…"
            />
            <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
              Only link files you host or are allowed to distribute. Uploads are disabled until Firebase Storage is configured.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="res-source" className="text-sm font-semibold">Source / author</label>
              <input id="res-source" className="input mt-1.5" value={draft.source} onChange={(event) => update('source', event.target.value)} />
            </div>
            <div>
              <label htmlFor="res-license" className="text-sm font-semibold">Licence</label>
              <input id="res-license" className="input mt-1.5" value={draft.license} onChange={(event) => update('license', event.target.value)} />
            </div>
          </div>

          <div>
            <label htmlFor="res-tags" className="text-sm font-semibold">Tags</label>
            <input id="res-tags" className="input mt-1.5" value={tagsText} onChange={(event) => setTagsText(event.target.value)} placeholder="study skills, SEE" />
          </div>
        </div>

        {problems.length > 0 && (
          <div className="rounded-xl border p-4 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
            <p className="font-semibold">Before publishing:</p>
            <ul className="mt-1.5 list-disc pl-5" style={{ color: 'var(--text-soft)' }}>
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pb-10">
          <Button onClick={() => submit('published')} loading={saving} disabled={problems.length > 0}>
            <Save className="mr-1.5 h-4 w-4" aria-hidden="true" /> Publish
          </Button>
          <Button variant="secondary" onClick={() => submit('draft')} loading={saving}>
            Save draft
          </Button>
          {!isNew && draft.status !== 'archived' && (
            <Button variant="ghost" onClick={() => submit('archived')}>Archive</Button>
          )}
        </div>
      </div>
    </div>
  );
}
