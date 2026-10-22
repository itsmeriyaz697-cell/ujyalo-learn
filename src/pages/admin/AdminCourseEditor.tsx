import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, GripVertical, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InlineAlert } from '@/components/ui/Feedback';
import { useContent } from '@/features/content/ContentProvider';
import {
  LEVEL_LABEL,
  isValidSlug,
  slugify,
  type ContentStatus,
  type Course,
  type CourseLevel,
  type Lesson,
} from '@/features/content/types';
import { SUBJECTS } from '@/config/curriculum';
import { makeId } from '@/lib/utils';

const EMPTY: Course = {
  id: '',
  slug: '',
  title: '',
  summary: '',
  description: '',
  subjectId: '',
  gradeMin: 9,
  gradeMax: 10,
  level: 'see',
  status: 'draft',
  outcomes: [''],
  lessons: [],
  tags: [],
  createdAt: '',
  updatedAt: '',
  updatedBy: '',
};

const emptyLesson = (): Lesson => ({
  id: makeId('lesson'),
  title: '',
  summary: '',
  minutes: 20,
  action: 'tutor',
  prompt: '',
});

export default function AdminCourseEditor() {
  const { id = 'new' } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const { courses, saveCourse, role } = useContent();

  const existing = useMemo(() => courses.find((course) => course.id === id), [courses, id]);
  const [draft, setDraft] = useState<Course>(() => existing ?? { ...EMPTY, id: makeId('course') });
  const [tagsText, setTagsText] = useState((existing?.tags ?? []).join(', '));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'warning'; text: string } | null>(null);

  useEffect(() => {
    if (existing) {
      setDraft(existing);
      setTagsText(existing.tags.join(', '));
    }
  }, [existing]);

  const problems: string[] = [];
  if (draft.title.trim().length < 6) problems.push('Title needs at least 6 characters.');
  if (!isValidSlug(draft.slug)) problems.push('Slug must be lowercase words separated by hyphens (3–60 characters).');
  if (courses.some((course) => course.slug === draft.slug && course.id !== draft.id)) problems.push('Another course already uses this slug.');
  if (draft.summary.trim().length < 20) problems.push('Summary needs at least 20 characters.');
  if (draft.lessons.length === 0) problems.push('Add at least one session.');
  if (draft.gradeMin > draft.gradeMax) problems.push('Minimum grade is higher than the maximum.');

  const canPublish = problems.length === 0;
  const readOnly = role === 'student';

  const update = <K extends keyof Course>(key: K, value: Course[K]) => setDraft((prev) => ({ ...prev, [key]: value }));

  const updateLesson = (index: number, patch: Partial<Lesson>) =>
    setDraft((prev) => ({
      ...prev,
      lessons: prev.lessons.map((lesson, i) => (i === index ? { ...lesson, ...patch } : lesson)),
    }));

  const moveLesson = (index: number, delta: number) =>
    setDraft((prev) => {
      const next = [...prev.lessons];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, lessons: next };
    });

  async function submit(status: ContentStatus) {
    if (status === 'published' && !canPublish) {
      setMessage({ tone: 'warning', text: 'Fix the highlighted problems before publishing.' });
      return;
    }
    setSaving(true);
    const now = new Date().toISOString();
    try {
      await saveCourse({
        ...draft,
        status,
        slug: draft.slug || slugify(draft.title),
        tags: tagsText.split(',').map((tag) => tag.trim()).filter(Boolean),
        outcomes: draft.outcomes.map((item) => item.trim()).filter(Boolean),
        updatedAt: now,
        createdAt: draft.createdAt || now,
        updatedBy: role,
      });
      setMessage({ tone: 'success', text: status === 'published' ? 'Published. It is on the public site now.' : 'Saved as a draft.' });
      if (isNew) navigate('/admin/courses');
    } catch {
      setMessage({ tone: 'warning', text: 'Could not save. Check that you have an editor role and a connection.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <Link to="/admin/courses" className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--muted)' }}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Courses
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">{isNew ? 'New course' : 'Edit course'}</h1>
        <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: 'var(--surface-2)' }}>
          {draft.status}
        </span>
      </div>

      {message && (
        <div className="mt-4">
          <InlineAlert tone={message.tone}>{message.text}</InlineAlert>
        </div>
      )}

      <fieldset disabled={readOnly} className="mt-6 space-y-5">
        <div className="card space-y-4 p-5">
          <div>
            <label htmlFor="course-title" className="text-sm font-semibold">Title</label>
            <input
              id="course-title"
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
              <label htmlFor="course-slug" className="text-sm font-semibold">URL slug</label>
              <input
                id="course-slug"
                className="input mt-1.5"
                value={draft.slug}
                onChange={(event) => update('slug', slugify(event.target.value))}
              />
              <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                Public URL: /courses/{draft.slug || 'your-slug'}
              </p>
            </div>
            <div>
              <label htmlFor="course-subject" className="text-sm font-semibold">Subject</label>
              <select id="course-subject" className="input mt-1.5" value={draft.subjectId} onChange={(event) => update('subjectId', event.target.value)}>
                <option value="">No specific subject</option>
                {SUBJECTS.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="course-summary" className="text-sm font-semibold">Summary</label>
            <textarea
              id="course-summary"
              className="input mt-1.5 min-h-[70px]"
              value={draft.summary}
              onChange={(event) => update('summary', event.target.value)}
              maxLength={220}
            />
            <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{draft.summary.length}/220 · shown on cards and in search</p>
          </div>

          <div>
            <label htmlFor="course-description" className="text-sm font-semibold">Description</label>
            <textarea
              id="course-description"
              className="input mt-1.5 min-h-[110px]"
              value={draft.description}
              onChange={(event) => update('description', event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="course-min" className="text-sm font-semibold">Min grade</label>
              <input id="course-min" type="number" min={1} max={12} className="input mt-1.5" value={draft.gradeMin} onChange={(event) => update('gradeMin', Number(event.target.value))} />
            </div>
            <div>
              <label htmlFor="course-max" className="text-sm font-semibold">Max grade</label>
              <input id="course-max" type="number" min={1} max={12} className="input mt-1.5" value={draft.gradeMax} onChange={(event) => update('gradeMax', Number(event.target.value))} />
            </div>
            <div>
              <label htmlFor="course-level" className="text-sm font-semibold">Level</label>
              <select id="course-level" className="input mt-1.5" value={draft.level} onChange={(event) => update('level', event.target.value as CourseLevel)}>
                {Object.entries(LEVEL_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="course-tags" className="text-sm font-semibold">Tags</label>
            <input id="course-tags" className="input mt-1.5" placeholder="SEE, mathematics, exam skills" value={tagsText} onChange={(event) => setTagsText(event.target.value)} />
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Outcomes</h2>
            <Button size="sm" variant="ghost" onClick={() => update('outcomes', [...draft.outcomes, ''])}>
              <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Add
            </Button>
          </div>
          <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>Write them as “You can …”. Two is plenty.</p>
          <div className="mt-3 space-y-2">
            {draft.outcomes.map((outcome, index) => (
              <div key={index} className="flex gap-2">
                <input
                  className="input"
                  value={outcome}
                  aria-label={`Outcome ${index + 1}`}
                  onChange={(event) =>
                    update('outcomes', draft.outcomes.map((item, i) => (i === index ? event.target.value : item)))
                  }
                />
                <button
                  type="button"
                  className="btn-icon"
                  aria-label={`Remove outcome ${index + 1}`}
                  onClick={() => update('outcomes', draft.outcomes.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Sessions</h2>
            <Button size="sm" variant="secondary" onClick={() => update('lessons', [...draft.lessons, emptyLesson()])}>
              <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Add session
            </Button>
          </div>

          {draft.lessons.length === 0 && (
            <p className="mt-3 rounded-xl p-4 text-sm" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
              No sessions yet. A course needs at least one before it can be published.
            </p>
          )}

          <div className="mt-3 space-y-3">
            {draft.lessons.map((lesson, index) => (
              <div key={lesson.id} className="rounded-xl border p-3" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 shrink-0" style={{ color: 'var(--muted)' }} aria-hidden="true" />
                  <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Session {index + 1}</span>
                  <div className="ml-auto flex items-center gap-1">
                    <button type="button" className="btn-icon" aria-label="Move up" onClick={() => moveLesson(index, -1)} disabled={index === 0}>
                      ↑
                    </button>
                    <button type="button" className="btn-icon" aria-label="Move down" onClick={() => moveLesson(index, 1)} disabled={index === draft.lessons.length - 1}>
                      ↓
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      aria-label={`Remove session ${index + 1}`}
                      onClick={() => update('lessons', draft.lessons.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px_110px]">
                  <input
                    className="input"
                    placeholder="Session title"
                    aria-label={`Session ${index + 1} title`}
                    value={lesson.title}
                    onChange={(event) => updateLesson(index, { title: event.target.value })}
                  />
                  <select
                    className="input"
                    aria-label={`Session ${index + 1} activity`}
                    value={lesson.action}
                    onChange={(event) => updateLesson(index, { action: event.target.value as Lesson['action'] })}
                  >
                    <option value="tutor">Open tutor</option>
                    <option value="quiz">Take quiz</option>
                    <option value="flashcards">Flashcards</option>
                    <option value="notes">Write note</option>
                    <option value="reading">Reading</option>
                  </select>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    className="input"
                    aria-label={`Session ${index + 1} minutes`}
                    value={lesson.minutes}
                    onChange={(event) => updateLesson(index, { minutes: Number(event.target.value) })}
                  />
                </div>
                <input
                  className="input mt-2"
                  placeholder="One line describing what the student does"
                  aria-label={`Session ${index + 1} summary`}
                  value={lesson.summary}
                  onChange={(event) => updateLesson(index, { summary: event.target.value })}
                />
                {(lesson.action === 'tutor' || lesson.prompt) && (
                  <textarea
                    className="input mt-2 min-h-[60px]"
                    placeholder="Prompt sent to the tutor (optional)"
                    aria-label={`Session ${index + 1} tutor prompt`}
                    value={lesson.prompt ?? ''}
                    onChange={(event) => updateLesson(index, { prompt: event.target.value })}
                  />
                )}
                {lesson.action === 'reading' && (
                  <textarea
                    className="input mt-2 min-h-[80px]"
                    placeholder="Short original text shown on the course page"
                    aria-label={`Session ${index + 1} reading text`}
                    value={lesson.body ?? ''}
                    onChange={(event) => updateLesson(index, { body: event.target.value })}
                  />
                )}
              </div>
            ))}
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
          <Button onClick={() => submit('published')} loading={saving} disabled={!canPublish}>
            <Save className="mr-1.5 h-4 w-4" aria-hidden="true" /> Publish
          </Button>
          <Button variant="secondary" onClick={() => submit('draft')} loading={saving}>
            Save draft
          </Button>
          {!isNew && draft.status !== 'archived' && (
            <Button variant="ghost" onClick={() => submit('archived')}>
              Archive
            </Button>
          )}
        </div>
      </fieldset>
    </div>
  );
}
