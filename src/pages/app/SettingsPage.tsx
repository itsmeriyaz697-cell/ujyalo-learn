import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  Database,
  Download,
  LogOut,
  Moon,
  Save,
  Server,
  Settings2,
  ShieldCheck,
  Sun,
  Trash2,
  UserRound,
} from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { InlineAlert } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { PageHeading } from '@/components/app/PageHeading';
import { useAuth } from '@/features/auth/AuthProvider';
import { useData } from '@/features/data/DataProvider';
import { useTheme } from '@/hooks/useTheme';
import { useAiHealth } from '@/hooks/useAiHealth';
import { dataStore } from '@/services/data';
import {
  COUNTRIES,
  CURRICULA,
  EXPLANATION_STYLES,
  GRADES,
  LANGUAGES,
  LEARNING_GOALS,
  subjectsForGrade,
} from '@/config/curriculum';
import { cn } from '@/lib/utils';
import type { StudentPreferences } from '@/types/domain';

export default function SettingsPage() {
  const { user, profile, mode, savePreferences, updateDisplayName, signOut, deleteAccount, missingFirebaseKeys, firebaseConfigured } = useAuth();
  const { conversations, notes, quizzes, attempts, decks, goals, tasks, activity, reload } = useData();
  const { theme, setTheme } = useTheme();
  const { health, refresh, loading: healthLoading } = useAiHealth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(profile?.displayName ?? user?.displayName ?? '');
  const [preferences, setPreferences] = useState<StudentPreferences>(() => ({
    grade: profile?.preferences.grade ?? '10',
    curriculum: profile?.preferences.curriculum ?? 'nepal-national',
    language: profile?.preferences.language ?? 'en',
    subjects: profile?.preferences.subjects ?? [],
    goals: profile?.preferences.goals ?? [],
    explanationStyle: profile?.preferences.explanationStyle ?? 'simple',
    dailyMinutes: profile?.preferences.dailyMinutes ?? 30,
    country: profile?.preferences.country ?? 'NP',
  }));
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [exporting, setExporting] = useState(false);

  const gradeLevel = GRADES.find((grade) => grade.value === preferences.grade)?.level ?? 10;
  const availableSubjects = useMemo(() => subjectsForGrade(gradeLevel), [gradeLevel]);

  function toggleSubject(id: string) {
    setPreferences((current) => ({
      ...current,
      subjects: current.subjects.includes(id) ? current.subjects.filter((item) => item !== id) : [...current.subjects, id],
    }));
  }

  function toggleGoal(id: string) {
    setPreferences((current) => ({
      ...current,
      goals: current.goals.includes(id) ? current.goals.filter((item) => item !== id) : [...current.goals, id],
    }));
  }

  async function saveAll() {
    if (!preferences.subjects.length) {
      toast('Choose at least one subject.', 'error');
      return;
    }
    setSaving(true);
    try {
      await savePreferences(preferences, name.trim() || undefined);
      if (name.trim() && name.trim() !== (profile?.displayName ?? '')) {
        await updateDisplayName(name.trim());
      }
      toast('Preferences saved', 'success');
      await reload();
    } catch (error) {
      toast((error as Error).message || 'Could not save your preferences.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    if (!user) return;
    setExporting(true);
    try {
      const messagesByConversation: Record<string, unknown> = {};
      for (const conversation of conversations) {
        const page = await dataStore.listMessages(user.uid, conversation.id, { limit: 100 });
        messagesByConversation[conversation.id] = page.messages;
      }
      const payload = {
        exportedAt: new Date().toISOString(),
        exportNote:
          'This is a copy of the data stored for your Ujyalo Learn account. It may contain AI-generated content that is not verified.',
        account: { email: user.email, displayName: profile?.displayName, uid: user.uid },
        preferences: profile?.preferences ?? null,
        conversations,
        messages: messagesByConversation,
        notes,
        quizzes,
        attempts,
        flashcardDecks: decks,
        goals,
        tasks,
        activity,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `ujyalo-learn-export-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast('Export downloaded', 'success');
    } catch (error) {
      toast((error as Error).message || 'Export failed.', 'error');
    } finally {
      setExporting(false);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteAccount();
      toast('Your account and data were deleted.', 'success');
      navigate('/', { replace: true });
    } catch (error) {
      toast(
        (error as Error).message ||
          'The account could not be deleted. If you signed in a while ago, log out and back in, then try again.',
        'error',
      );
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  return (
    <>
      <Seo title="Settings" description="Manage your preferences and account." path="/app/settings" noindex />
      <PageHeading
        eyebrow="Settings"
        title="Settings & preferences"
        description="Control how the tutor explains things, manage your account, and export or delete your data."
        actions={
          <Button onClick={saveAll} loading={saving} icon={<Save className="h-4 w-4" />}>
            Save changes
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Learning preferences" description="The tutor uses these in every conversation." icon={<Settings2 className="h-4 w-4" />} />
            <CardBody>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select
                    label="Grade / level"
                    value={preferences.grade}
                    onChange={(event) => setPreferences({ ...preferences, grade: event.target.value })}
                  >
                    {GRADES.map((grade) => (
                      <option key={grade.value} value={grade.value}>
                        {grade.label}
                      </option>
                    ))}
                  </Select>
                  <Select
                    label="Curriculum context"
                    value={preferences.curriculum}
                    onChange={(event) => setPreferences({ ...preferences, curriculum: event.target.value })}
                  >
                    {CURRICULA.map((curriculum) => (
                      <option key={curriculum.id} value={curriculum.id}>
                        {curriculum.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Select
                    label="Preferred language"
                    value={preferences.language}
                    onChange={(event) => setPreferences({ ...preferences, language: event.target.value })}
                  >
                    {LANGUAGES.map((language) => (
                      <option key={language.code} value={language.code}>
                        {language.label}
                      </option>
                    ))}
                  </Select>
                  <Select
                    label="Explanation style"
                    value={preferences.explanationStyle}
                    onChange={(event) => setPreferences({ ...preferences, explanationStyle: event.target.value })}
                  >
                    {EXPLANATION_STYLES.map((style) => (
                      <option key={style.id} value={style.id}>
                        {style.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Select
                    label="Country"
                    value={preferences.country}
                    onChange={(event) => setPreferences({ ...preferences, country: event.target.value })}
                  >
                    {COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </Select>
                  <Input
                    label="Daily study time (minutes)"
                    type="number"
                    min={10}
                    max={240}
                    step={5}
                    value={preferences.dailyMinutes}
                    onChange={(event) => setPreferences({ ...preferences, dailyMinutes: Number(event.target.value) })}
                    hint="Used by the study planner."
                  />
                </div>

                <div>
                  <p className="label">Subjects</p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableSubjects.map((subject) => {
                      const active = preferences.subjects.includes(subject.id);
                      return (
                        <button
                          key={subject.id}
                          type="button"
                          onClick={() => toggleSubject(subject.id)}
                          aria-pressed={active}
                          className={cn('chip', active && 'chip-active')}
                        >
                          {active && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                          {subject.name}
                        </button>
                      );
                    })}
                  </div>
                  {availableSubjects.length === 0 && <p className="text-xs text-muted">No subjects for this grade.</p>}
                </div>

                <div>
                  <p className="label">Learning goals</p>
                  <div className="flex flex-wrap gap-1.5">
                    {LEARNING_GOALS.map((goal) => {
                      const active = preferences.goals.includes(goal.id);
                      return (
                        <button
                          key={goal.id}
                          type="button"
                          onClick={() => toggleGoal(goal.id)}
                          aria-pressed={active}
                          className={cn('chip', active && 'chip-active')}
                        >
                          {goal.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Account" description="Your sign-in details." icon={<UserRound className="h-4 w-4" />} />
            <CardBody>
              <div className="space-y-3">
                <Input label="Display name" value={name} onChange={(event) => setName(event.target.value)} maxLength={60} />
                <div>
                  <p className="label">Email</p>
                  <p className="rounded-xl border px-3.5 py-2.5 text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-soft)' }}>
                    {user?.email ?? '—'}
                    {mode === 'firebase' && (
                      <span className="ml-2 badge" style={{ background: user?.emailVerified ? 'var(--success-soft)' : 'var(--accent-soft)', color: user?.emailVerified ? 'var(--success)' : 'var(--muted)' }}>
                        {user?.emailVerified ? 'Verified' : 'Not verified'}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={saveAll} loading={saving} icon={<Save className="h-4 w-4" />}>
                    Save name
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      await signOut();
                      navigate('/');
                    }}
                    icon={<LogOut className="h-4 w-4" />}
                  >
                    Log out
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Appearance" description="Your choice is remembered on this device." icon={theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} />
            <CardBody>
              <div className="flex gap-2">
                {(['light', 'dark'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setTheme(option)}
                    aria-pressed={theme === option}
                    className={cn('chip !px-4 !py-2', theme === option && 'chip-active')}
                  >
                    {option === 'light' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                    {option === 'light' ? 'Light' : 'Dark'}
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Service status" description="What this deployment is connected to." icon={<Server className="h-4 w-4" />} />
            <CardBody>
              <dl className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted">Accounts & storage</dt>
                  <dd className="text-right font-medium" style={{ color: 'var(--text)' }}>
                    {mode === 'firebase' ? 'Firebase (cloud)' : 'Local demo (this browser)'}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted">AI provider</dt>
                  <dd className="text-right font-medium" style={{ color: health?.configured ? 'var(--success)' : 'var(--danger)' }}>
                    {healthLoading ? 'Checking…' : health?.configured ? `${health.provider ?? 'configured'} · ${health.model ?? ''}` : 'Not configured'}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted">Usage limits (per instance)</dt>
                  <dd className="text-right text-xs" style={{ color: 'var(--text-soft)' }}>
                    {health?.limits ? `${health.limits.perMinute}/min · ${health.limits.perDay}/day` : '—'}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={refresh} loading={healthLoading} icon={<Server className="h-3.5 w-3.5" />}>
                  Recheck
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/help">Setup help</Link>
                </Button>
              </div>

              {!firebaseConfigured && (
                <div className="mt-4">
                  <InlineAlert tone="warning" title="Firebase not configured">
                    Real accounts and cloud sync need these missing values: {missingFirebaseKeys.join(', ')}. Until then,
                    everything stays in this browser and is not secure.
                  </InlineAlert>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Your data" description="Export or delete everything you have created." icon={<Database className="h-4 w-4" />} />
            <CardBody>
              <div className="space-y-3">
                <Button variant="secondary" fullWidth onClick={handleExport} loading={exporting} icon={<Download className="h-4 w-4" />}>
                  Export my data (JSON)
                </Button>
                <p className="text-[11px] leading-relaxed text-muted">
                  Export includes your profile, conversations, messages, notes, quizzes, attempts, flashcard decks, goals,
                  tasks and activity.
                </p>
                <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                  <Button variant="danger" fullWidth onClick={() => setDeleteOpen(true)} icon={<Trash2 className="h-4 w-4" />}>
                    Delete account and all data
                  </Button>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted">
                    This permanently deletes your profile, learning records and sign-in account. It cannot be undone.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--primary)' }} aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    Privacy
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    Read how your data is stored and processed in the Privacy Policy. For any data request, use the contact
                    page.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <Link to="/privacy" className="underline" style={{ color: 'var(--primary)' }}>
                      Privacy Policy
                    </Link>
                    <Link to="/terms" className="underline" style={{ color: 'var(--primary)' }}>
                      Terms
                    </Link>
                    <Link to="/contact" className="underline" style={{ color: 'var(--primary)' }}>
                      Contact
                    </Link>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Rendered on deleteOpen alone. Guarding on `deleteConfirmText !== 'DELETE'`
          hid the dialog the instant the word was typed, which put the confirm
          button out of reach — the account could not be deleted at all. */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center">
          <div className="absolute inset-0 bg-[rgba(4,10,24,0.55)]" onClick={() => { setDeleteOpen(false); setDeleteConfirmText(''); }} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-md rounded-2xl border p-5 shadow-lift" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} role="dialog" aria-modal="true" aria-labelledby="delete-title">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="delete-title" className="text-base font-bold" style={{ color: 'var(--text)' }}>
                  Delete account and all data
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  This permanently removes everything in this account, including {notes.length} notes and {attempts.length} quiz
                  attempts. Type <strong>DELETE</strong> to continue.
                </p>
              </div>
            </div>
            <label className="label mt-4" htmlFor="delete-confirm">
              Type DELETE to confirm
            </label>
            <input
              id="delete-confirm"
              className="input"
              value={deleteConfirmText}
              onChange={(event) => setDeleteConfirmText(event.target.value)}
              autoComplete="off"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setDeleteOpen(false); setDeleteConfirmText(''); }}>
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={deleteConfirmText !== 'DELETE'}
                loading={deleting}
                onClick={confirmDelete}
                icon={<Trash2 className="h-4 w-4" />}
              >
                Delete everything
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
