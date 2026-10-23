import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, GraduationCap, Sparkles } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Seo } from '@/components/seo/Seo';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { ProgressBar } from '@/components/ui/Feedback';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  COUNTRIES,
  CURRICULA,
  EXPLANATION_STYLES,
  GRADES,
  LANGUAGES,
  LEARNING_GOALS,
  subjectsForGrade,
} from '@/config/curriculum';
import type { StudentPreferences } from '@/types/domain';
import { cn, safeJsonParse } from '@/lib/utils';

const TOTAL_STEPS = 7;
const DRAFT_KEY = 'ujyalo:onboarding-draft';

export default function OnboardingPage() {
  const { user, profile, savePreferences, signOut, mode } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(profile?.displayName || user?.displayName || '');

  const [draft, setDraft] = useState<StudentPreferences>(() => {
    const saved = safeJsonParse<StudentPreferences | null>(localStorage.getItem(DRAFT_KEY), null);
    return (
      saved ??
      profile?.preferences ?? {
        country: 'NP',
        grade: '10',
        curriculum: 'nepal-national',
        language: 'en',
        subjects: ['mathematics', 'science', 'english'],
        goals: ['exam-prep', 'concepts'],
        explanationStyle: 'simple',
        dailyMinutes: 30,
      }
    );
  });

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  const availableSubjects = useMemo(() => {
    const level = GRADES.find((g) => g.value === draft.grade)?.level ?? 10;
    return subjectsForGrade(level);
  }, [draft.grade]);

  // Keep selected subjects valid when the grade changes.
  useEffect(() => {
    setDraft((current) => {
      const valid = current.subjects.filter((id) => availableSubjects.some((s) => s.id === id));
      return valid.length === current.subjects.length ? current : { ...current, subjects: valid };
    });
  }, [availableSubjects]);

  const update = <K extends keyof StudentPreferences>(key: K, value: StudentPreferences[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const toggleIn = (key: 'subjects' | 'goals', id: string) =>
    setDraft((current) => {
      const list = current[key];
      return { ...current, [key]: list.includes(id) ? list.filter((item) => item !== id) : [...list, id] };
    });

  const canContinue = () => {
    if (step === 1) return Boolean(draft.grade);
    if (step === 2) return Boolean(draft.curriculum);
    if (step === 3) return Boolean(draft.language);
    if (step === 4) return draft.subjects.length > 0;
    if (step === 5) return draft.goals.length > 0;
    if (step === 6) return Boolean(draft.explanationStyle);
    return true;
  };

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      await savePreferences(draft, name.trim() || undefined);
      localStorage.removeItem(DRAFT_KEY);
      navigate('/app', { replace: true });
    } catch (saveError) {
      setError((saveError as Error).message || 'Your preferences could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const stepTitles = [
    'Where do you study?',
    'Which grade are you in?',
    'Which curriculum?',
    'Which language do you prefer?',
    'Which subjects do you study?',
    'What are your learning goals?',
    'How should the tutor explain?',
  ];

  return (
    <>
      <Seo title="Set up your learning profile" description="Choose your grade, subjects and preferences." path="/onboarding" noindex />
      <div className="min-h-[100dvh] px-4 py-6 sm:py-10">
        <div className="mx-auto w-full max-w-2xl">
          <div className="flex items-center justify-between">
            <Logo size={34} />
            <div className="flex items-center gap-4">
              {/* Without this, a student who lands here mid-setup is trapped:
                  every /app route redirects back, and sign-out lives inside the
                  app shell they cannot reach. */}
              <button type="button" className="text-xs font-medium text-muted underline" onClick={() => void signOut()}>
                Sign out
              </button>
              <button
                type="button"
                className="text-xs font-medium text-muted underline"
                onClick={() => navigate('/')}
              >
                Save and exit
              </button>
            </div>
          </div>

          <div className="mt-6">
            <ProgressBar value={step + 1} max={TOTAL_STEPS} label={`Step ${step + 1} of ${TOTAL_STEPS}`} />
          </div>

          <div className="card mt-4 p-5 sm:p-7">
            <p className="eyebrow">Your learning profile</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              {stepTitles[step]}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {step === 0 && 'This helps the tutor use examples and curriculum context that fit you.'}
              {step === 1 && 'Questions and explanations are pitched at this level.'}
              {step === 2 && 'You can change this later in Settings.'}
              {step === 3 && 'You can always ask in a different language per conversation.'}
              {step === 4 && 'Pick everything you are studying. Choose at least one.'}
              {step === 5 && 'Your dashboard and planner use these goals.'}
              {step === 6 && 'This sets the default explanation style.'}
            </p>

            <div className="mt-6 min-h-[240px]">
              {step === 0 && (
                <div className="space-y-4">
                  <Input
                    label="Your name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="How should we greet you?"
                    maxLength={60}
                  />
                  <Select
                    label="Country"
                    value={draft.country}
                    onChange={(event) => update('country', event.target.value)}
                  >
                    {COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </Select>
                  {mode === 'local' && (
                    <p className="text-[11px] text-muted">
                      Demo mode: this profile is stored in this browser only.
                    </p>
                  )}
                </div>
              )}

              {step === 1 && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {GRADES.map((grade) => (
                    <button
                      key={grade.value}
                      type="button"
                      onClick={() => update('grade', grade.value)}
                      aria-pressed={draft.grade === grade.value}
                      className={cn(
                        'rounded-xl border px-3 py-3 text-left text-sm font-medium transition-colors',
                        draft.grade === grade.value ? 'border-[color:var(--primary)] bg-[color:var(--primary-soft)]' : 'hover:bg-[color:var(--surface-2)]',
                      )}
                      style={{ borderColor: draft.grade === grade.value ? 'var(--primary)' : 'var(--border)', color: draft.grade === grade.value ? 'var(--primary)' : 'var(--text)' }}
                    >
                      <GraduationCap className="mb-1.5 h-4 w-4" aria-hidden="true" />
                      {grade.label}
                      {grade.examPrep && <span className="mt-0.5 block text-[10px] font-normal opacity-80">Exam preparation</span>}
                    </button>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-2">
                  {CURRICULA.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => update('curriculum', option.id)}
                      aria-pressed={draft.curriculum === option.id}
                      className="flex w-full items-start justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors hover:bg-[color:var(--surface-2)]"
                      style={{
                        borderColor: draft.curriculum === option.id ? 'var(--primary)' : 'var(--border)',
                        background: draft.curriculum === option.id ? 'var(--primary-soft)' : undefined,
                      }}
                    >
                      <span>
                        <span className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
                          {option.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">{option.note}</span>
                      </span>
                      {draft.curriculum === option.id && <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              )}

              {step === 3 && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {LANGUAGES.map((language) => (
                    <button
                      key={language.code}
                      type="button"
                      onClick={() => update('language', language.code)}
                      aria-pressed={draft.language === language.code}
                      className="rounded-xl border px-4 py-3 text-left transition-colors hover:bg-[color:var(--surface-2)]"
                      style={{
                        borderColor: draft.language === language.code ? 'var(--primary)' : 'var(--border)',
                        background: draft.language === language.code ? 'var(--primary-soft)' : undefined,
                      }}
                    >
                      <span className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
                        {language.label}
                      </span>
                      <span className="text-xs text-muted">{language.native}</span>
                    </button>
                  ))}
                </div>
              )}

              {step === 4 && (
                <div className="flex flex-wrap gap-2">
                  {availableSubjects.map((subject) => {
                    const active = draft.subjects.includes(subject.id);
                    return (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() => toggleIn('subjects', subject.id)}
                        aria-pressed={active}
                        className={cn('chip !px-3.5 !py-2 !text-[13px]', active && 'chip-active')}
                      >
                        {active && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                        {subject.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {step === 5 && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {LEARNING_GOALS.map((goal) => {
                    const active = draft.goals.includes(goal.id);
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => toggleIn('goals', goal.id)}
                        aria-pressed={active}
                        className="rounded-xl border px-3.5 py-3 text-left transition-colors hover:bg-[color:var(--surface-2)]"
                        style={{
                          borderColor: active ? 'var(--primary)' : 'var(--border)',
                          background: active ? 'var(--primary-soft)' : undefined,
                        }}
                      >
                        <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--text)' }}>
                          {active && <Check className="h-3.5 w-3.5" style={{ color: 'var(--primary)' }} aria-hidden="true" />}
                          {goal.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">{goal.description}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {step === 6 && (
                <div className="space-y-4">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {EXPLANATION_STYLES.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => update('explanationStyle', style.id)}
                        aria-pressed={draft.explanationStyle === style.id}
                        className="rounded-xl border px-3.5 py-3 text-left transition-colors hover:bg-[color:var(--surface-2)]"
                        style={{
                          borderColor: draft.explanationStyle === style.id ? 'var(--primary)' : 'var(--border)',
                          background: draft.explanationStyle === style.id ? 'var(--primary-soft)' : undefined,
                        }}
                      >
                        <span className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
                          {style.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">{style.description}</span>
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="label" htmlFor="daily-minutes">
                      How much time can you study on a typical day?
                    </label>
                    <input
                      id="daily-minutes"
                      type="range"
                      min={10}
                      max={120}
                      step={5}
                      value={draft.dailyMinutes}
                      onChange={(event) => update('dailyMinutes', Number(event.target.value))}
                      className="w-full"
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <p className="mt-1 text-xs text-muted">
                      {draft.dailyMinutes} minutes — used to suggest study-plan sessions you can realistically finish.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p className="mt-4 rounded-lg px-3 py-2 text-sm" role="alert" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                {error}
              </p>
            )}

            <div className="mt-6 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                onClick={() => setStep((value) => Math.max(0, value - 1))}
                disabled={step === 0 || saving}
                icon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
              {step < TOTAL_STEPS - 1 ? (
                <Button
                  onClick={() => setStep((value) => value + 1)}
                  disabled={!canContinue()}
                  iconRight={<ArrowRight className="h-4 w-4" />}
                >
                  Continue
                </Button>
              ) : (
                <Button onClick={finish} loading={saving} icon={<Sparkles className="h-4 w-4" />}>
                  Finish setup
                </Button>
              )}
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-muted">
            You can change all of these later in <strong>Settings → Learning preferences</strong>.
          </p>
        </div>
      </div>
    </>
  );
}
