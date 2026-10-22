import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Layers,
  NotebookPen,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { EmptyState, InlineAlert } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { PageHeading } from '@/components/app/PageHeading';
import { useAuth } from '@/features/auth/AuthProvider';
import { useData } from '@/features/data/DataProvider';
import { getSubject, SUBJECTS } from '@/config/curriculum';
import { notePreview, searchNotes } from '@/lib/notes';
import { formatRelative } from '@/lib/format';
import { makeId } from '@/lib/utils';
import type { Note } from '@/types/domain';

const EMPTY_DRAFT = {
  id: '',
  title: '',
  content: '',
  subjectId: '',
  topic: '',
  favorite: false,
};

export default function NotesPage() {
  const { user } = useAuth();
  const { notes, saveNote, removeNote } = useData();
  const { toast } = useToast();

  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'ai' | 'student'>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    let list = searchNotes(notes, query);
    if (subjectFilter !== 'all') list = list.filter((note) => (note.subjectId ?? 'none') === subjectFilter);
    if (sourceFilter !== 'all') list = list.filter((note) => note.source === sourceFilter);
    if (favoritesOnly) list = list.filter((note) => note.favorite);
    return list;
  }, [favoritesOnly, notes, query, sourceFilter, subjectFilter]);

  function openNew() {
    setDraft(EMPTY_DRAFT);
    setEditorOpen(true);
  }

  function openEdit(note: Note) {
    setDraft({
      id: note.id,
      title: note.title,
      content: note.content,
      subjectId: note.subjectId ?? '',
      topic: note.topic,
      favorite: note.favorite,
    });
    setEditorOpen(true);
  }

  async function save() {
    if (!user) return;
    if (!draft.title.trim() && !draft.content.trim()) {
      toast('Add a title or some content before saving.', 'error');
      return;
    }
    setSaving(true);
    try {
      const existing = notes.find((note) => note.id === draft.id);
      const now = new Date().toISOString();
      const note: Note = {
        id: draft.id || makeId('note'),
        ownerId: user.uid,
        title: (draft.title.trim() || notePreview(draft.content, 60) || 'Untitled note').slice(0, 160),
        content: draft.content,
        subjectId: draft.subjectId || null,
        topic: draft.topic.trim(),
        source: existing?.source ?? 'student',
        favorite: draft.favorite,
        tags: existing?.tags ?? [],
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      await saveNote(note);
      toast(existing ? 'Note updated' : 'Note created', 'success');
      setEditorOpen(false);
    } catch (error) {
      toast((error as Error).message || 'Could not save the note.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleFavorite(note: Note) {
    try {
      await saveNote({ ...note, favorite: !note.favorite, updatedAt: new Date().toISOString() });
    } catch {
      toast('Could not update the note.', 'error');
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removeNote(deleteTarget.id);
      toast('Note deleted', 'success');
      setDeleteTarget(null);
    } catch {
      toast('Could not delete the note.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  const aiCount = notes.filter((note) => note.source === 'ai').length;

  return (
    <>
      <Seo title="Notes" description="Your private notes and saved explanations." path="/app/notes" noindex />
      <PageHeading
        eyebrow="Revision centre"
        title="Notes"
        description="Saved AI explanations and your own notes — searchable, organised by subject, and private to your account."
        actions={
          <Button onClick={openNew} icon={<Plus className="h-4 w-4" />}>
            New note
          </Button>
        }
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted)' }} aria-hidden="true" />
          <input
            className="input pl-9"
            placeholder="Search notes, topics and tags…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search notes"
          />
        </div>
        <select className="input sm:!w-auto" value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)} aria-label="Filter by subject">
          <option value="all">All subjects</option>
          {SUBJECTS.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
          <option value="none">No subject</option>
        </select>
        <select
          className="input sm:!w-auto"
          value={sourceFilter}
          onChange={(event) => setSourceFilter(event.target.value as typeof sourceFilter)}
          aria-label="Filter by source"
        >
          <option value="all">All sources</option>
          <option value="ai">AI explanations</option>
          <option value="student">My notes</option>
        </select>
        <button
          type="button"
          onClick={() => setFavoritesOnly((value) => !value)}
          aria-pressed={favoritesOnly}
          className={`chip !justify-center ${favoritesOnly ? 'chip-active' : ''}`}
        >
          <Star className={`h-3.5 w-3.5 ${favoritesOnly ? 'fill-current' : ''}`} aria-hidden="true" /> Favourites
        </button>
      </div>

      <p className="mb-3 text-xs text-muted">
        {notes.length} note{notes.length === 1 ? '' : 's'} · {aiCount} saved from the tutor · {notes.filter((note) => note.source === 'student').length} written by you
      </p>

      {notes.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<NotebookPen className="h-6 w-6" />}
              title="Your notes library is empty"
              description="Save an explanation from the AI tutor, or write your first note. Everything stays private to your account."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild size="sm">
                    <Link to="/app/tutor">
                      <Sparkles className="h-4 w-4" /> Ask the tutor
                    </Link>
                  </Button>
                  <Button size="sm" variant="secondary" onClick={openNew}>
                    Write a note
                  </Button>
                </div>
              }
            />
          </CardBody>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Search className="h-6 w-6" />}
              title="No notes match your filters"
              description="Try a different search term or clear the filters."
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setQuery('');
                    setSubjectFilter('all');
                    setSourceFilter('all');
                    setFavoritesOnly(false);
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((note) => (
            <Card key={note.id} className="flex flex-col">
              <CardBody className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`badge ${note.source === 'ai' ? 'badge-brand' : 'badge-neutral'}`}>
                      {note.source === 'ai' ? 'AI explanation' : 'Your note'}
                    </span>
                    {note.subjectId && <span className="badge badge-neutral">{getSubject(note.subjectId)?.name ?? note.subjectId}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(note)}
                    className="btn-icon !h-8 !w-8"
                    aria-label={note.favorite ? `Remove ${note.title} from favourites` : `Add ${note.title} to favourites`}
                    aria-pressed={note.favorite}
                  >
                    <Star className="h-4 w-4" style={{ color: note.favorite ? 'var(--accent)' : 'var(--muted)', fill: note.favorite ? 'var(--accent)' : 'none' }} />
                  </button>
                </div>
                <h2 className="mt-2 line-clamp-2 text-[14px] font-semibold leading-snug" style={{ color: 'var(--text)' }}>
                  {note.title}
                </h2>
                <p className="mt-1.5 line-clamp-3 flex-1 text-[13px] leading-relaxed text-muted">{notePreview(note.content)}</p>
                {note.topic && <p className="mt-2 text-[11px] text-muted">Topic: {note.topic}</p>}
                <div className="mt-3 flex items-center justify-between border-t pt-2.5" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-[10px] text-muted">{formatRelative(note.updatedAt)}</span>
                  <div className="flex items-center gap-0.5">
                    <button type="button" className="btn-icon !h-8 !w-8" onClick={() => openEdit(note)} aria-label={`Edit ${note.title}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <Link
                      to={`/app/flashcards?note=${note.id}`}
                      className="btn-icon !h-8 !w-8"
                      aria-label={`Make flashcards from ${note.title}`}
                      title="Make flashcards from this note"
                    >
                      <Layers className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      type="button"
                      className="btn-icon !h-8 !w-8"
                      onClick={() => setDeleteTarget(note)}
                      aria-label={`Delete ${note.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-5">
        <InlineAlert tone="info" title="Notes are labelled by origin">
          AI explanations are marked “AI explanation”; anything you write is marked “Your note”. AI content can contain
          mistakes — verify it before relying on it for an exam.
        </InlineAlert>
      </div>

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={draft.id ? 'Edit note' : 'New note'}
        description={draft.id ? 'Update your note. Changes are saved to your account.' : 'Write anything you want to remember.'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditorOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving} icon={<BookOpen className="h-4 w-4" />}>
              Save note
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            placeholder="e.g. Photosynthesis key points"
            maxLength={160}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label="Subject" value={draft.subjectId} onChange={(event) => setDraft({ ...draft, subjectId: event.target.value })}>
              <option value="">No subject</option>
              {SUBJECTS.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </Select>
            <Input
              label="Topic"
              optional
              value={draft.topic}
              onChange={(event) => setDraft({ ...draft, topic: event.target.value })}
              placeholder="e.g. Chapter 4"
              maxLength={80}
            />
          </div>
          <Textarea
            label="Content"
            value={draft.content}
            onChange={(event) => setDraft({ ...draft, content: event.target.value })}
            rows={10}
            placeholder="Markdown is supported — headings, lists, **bold** and equations."
            maxLength={20000}
            hint={`${draft.content.length}/20000 characters`}
          />
          <label className="flex items-center gap-2 text-sm text-soft">
            <input
              type="checkbox"
              checked={draft.favorite}
              onChange={(event) => setDraft({ ...draft, favorite: event.target.checked })}
              className="h-4 w-4 rounded"
              style={{ accentColor: 'var(--primary)' }}
            />
            Mark as favourite
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this note?"
        description={`“${deleteTarget?.title ?? ''}” will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete note"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
