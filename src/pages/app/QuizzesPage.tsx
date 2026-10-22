import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ClipboardList, Loader2, Sparkles, Trash2, TrendingUp } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { EmptyState, InlineAlert } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { AiStatusBanner } from '@/components/app/AiStatusBanner';
import { PageHeading } from '@/components/app/PageHeading';
import { useAuth } from '@/features/auth/AuthProvider';
import { useData } from '@/features/data/DataProvider';
import { useAiHealth } from '@/hooks/useAiHealth';
import { generateQuizViaApi } from '@/services/ai/client';
import { PRICING_TIERS, SUBJECTS, getSubject } from '@/config/curriculum';
import { formatDate } from '@/lib/format';
import { makeId, pluralize } from '@/lib/utils';
import type { QuestionType } from '@/types/domain';

const TYPE_OPTIONS: Array<{ id: QuestionType; label: string }> = [
  { id: 'mcq', label: 'Multiple choice' },
  { id: 'true-false', label: 'True / false' },
  { id: 'short-answer', label: 'Short answer' },
  { id: 'fill-blank', label: 'Fill in the blank' },
];

export default function QuizzesPage() {
  const { user, profile } = useAuth();
  const { quizzes, attempts, saveQuiz, removeQuiz, logActivity } = useData();
  const { toast } = useToast();
  const { health, loading: healthLoading, refresh: refreshHealth } = useAiHealth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const studentSubjects = useMemo(() => {
    const ids = profile?.preferences.subjects ?? [];
    const list = ids.map((id) => getSubject(id)).filter((s): s is NonNullable<typeof s> => Boolean(s));
    return list.length ? list : SUBJECTS;
  }, [profile?.preferences.subjects]);

  const [subject, setSubject] = useState(searchParams.get('subject') ?? studentSubjects[0]?.id ?? 'mathematics');
  const [topic, setTopic] = useState(searchParams.get('topic') ?? '');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('medium');
  const [count, setCount] = useState(5);
  const [types, setTypes] = useState<QuestionType[]>(['mcq']);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (studentSubjects.length && !studentSubjects.some((s) => s.id === subject)) {
      setSubject(studentSubjects[0].id);
    }
  }, [studentSubjects, subject]);

  function toggleType(type: QuestionType) {
    setTypes((current) => {
      if (current.includes(type)) return current.length > 1 ? current.filter((item) => item !== type) : current;
      return [...current, type];
    });
  }

  async function generate() {
    if (!user) return;
    if (!topic.trim()) {
      setError('Please enter a topic so the quiz matches what you are studying.');
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const generated = await generateQuizViaApi({
        subject: getSubject(subject)?.name ?? subject,
        grade: profile?.preferences.grade ?? '10',
        topic: topic.trim(),
        difficulty,
        count,
        questionTypes: types,
        language: profile?.preferences.language ?? 'en',
      });

      const quiz = {
        id: makeId('quiz'),
        ownerId: user.uid,
        title: generated.title,
        subjectId: subject,
        grade: profile?.preferences.grade ?? '10',
        topic: topic.trim(),
        difficulty,
        questions: generated.questions.map((question, index) => ({
          ...question,
          id: question.id || `q${index + 1}`,
        })),
        createdAt: new Date().toISOString(),
        source: 'ai' as const,
      };

      await saveQuiz(quiz);
      logActivity('quiz', `Generated quiz: ${quiz.title}`, { subjectId: subject });
      toast('Quiz ready — good luck!', 'success');
      navigate(`/app/quizzes/${quiz.id}`);
    } catch (generationError) {
      setError((generationError as Error).message || 'The quiz could not be generated.');
    } finally {
      setGenerating(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removeQuiz(deleteTarget);
      toast('Quiz deleted', 'success');
      setDeleteTarget(null);
    } catch {
      toast('Could not delete the quiz.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  const attemptsByQuiz = useMemo(() => {
    const map = new Map<string, number>();
    for (const attempt of attempts) map.set(attempt.quizId, (map.get(attempt.quizId) ?? 0) + 1);
    return map;
  }, [attempts]);

  return (
    <>
      <Seo title="Quizzes" description="Generate and take practice quizzes." path="/app/quizzes" noindex />
      <PageHeading
        eyebrow="Practice"
        title="Quizzes"
        description="Generate a quiz on any topic, answer it, then learn from the explanation for every question."
      />

      <AiStatusBanner health={health} loading={healthLoading} onRetry={refreshHealth} />

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader
            title="Generate a quiz"
            description="The AI writes original questions — not official exam papers."
            icon={<Sparkles className="h-4 w-4" />}
          />
          <CardBody>
            <div className="space-y-4">
              {error && (
                <InlineAlert tone="danger" title="Quiz generation failed">
                  {error}
                </InlineAlert>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <Select label="Subject" value={subject} onChange={(event) => setSubject(event.target.value)}>
                  {studentSubjects.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Grade"
                  value={profile?.preferences.grade ?? '10'}
                  disabled
                  hint="Change your grade in Settings."
                >
                  <option value={profile?.preferences.grade ?? '10'}>Grade {profile?.preferences.grade ?? '10'}</option>
                </Select>
              </div>

              <Input
                label="Topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="e.g. Fractions, photosynthesis, Newton's laws"
                maxLength={160}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  label="Difficulty"
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value as typeof difficulty)}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="mixed">Mixed</option>
                </Select>
                <Select label="Number of questions" value={count} onChange={(event) => setCount(Number(event.target.value))}>
                  {[3, 5, 8, 10, 12, 15].map((value) => (
                    <option key={value} value={value}>
                      {value} questions
                    </option>
                  ))}
                </Select>
              </div>

              <fieldset>
                <legend className="label">Question types</legend>
                <div className="flex flex-wrap gap-1.5">
                  {TYPE_OPTIONS.map((option) => {
                    const active = types.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => toggleType(option.id)}
                        aria-pressed={active}
                        className={`chip ${active ? 'chip-active' : ''}`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <p className="hint">At least one type is required.</p>
              </fieldset>

              <Button
                fullWidth
                onClick={generate}
                loading={generating}
                disabled={!health?.configured}
                icon={generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              >
                {generating ? 'Writing your quiz…' : 'Generate quiz'}
              </Button>
              {!health?.configured && (
                <p className="text-center text-[11px] text-muted">
                  Quiz generation needs the AI provider configured by the site owner.
                </p>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Your quizzes"
            description={`${quizzes.length} saved · ${attempts.length} attempts`}
            icon={<ClipboardList className="h-4 w-4" />}
          />
          <CardBody>
            {quizzes.length === 0 ? (
              <EmptyState
                icon={<ClipboardList className="h-6 w-6" />}
                title="No quizzes yet"
                description="Generate your first quiz using the form. Start with 5 questions on one topic."
              />
            ) : (
              <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {quizzes.slice(0, 12).map((quiz) => (
                  <li key={quiz.id} className="flex items-center justify-between gap-2 py-3 first:pt-0">
                    <div className="min-w-0">
                      <Link to={`/app/quizzes/${quiz.id}`} className="block truncate text-[13px] font-semibold hover:underline" style={{ color: 'var(--text)' }}>
                        {quiz.title}
                      </Link>
                      <p className="truncate text-[11px] text-muted">
                        {getSubject(quiz.subjectId)?.name ?? quiz.subjectId} · {pluralize(quiz.questions.length, 'question')} ·{' '}
                        {formatDate(quiz.createdAt, { day: 'numeric', month: 'short' })}
                      </p>
                      {attemptsByQuiz.get(quiz.id) ? (
                        <p className="mt-0.5 inline-flex items-center gap-1 text-[10px]" style={{ color: 'var(--success)' }}>
                          <TrendingUp className="h-3 w-3" aria-hidden="true" />
                          {attemptsByQuiz.get(quiz.id)} attempt{attemptsByQuiz.get(quiz.id) === 1 ? '' : 's'}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button asChild size="sm" variant="secondary">
                        <Link to={`/app/quizzes/${quiz.id}`}>{attemptsByQuiz.get(quiz.id) ? 'Retake' : 'Start'}</Link>
                      </Button>
                      <button
                        type="button"
                        className="btn-icon !h-8 !w-8"
                        onClick={() => setDeleteTarget(quiz.id)}
                        aria-label={`Delete ${quiz.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { title: 'Answers stay hidden', body: 'Correct answers are only revealed after you submit, so practice stays honest.' },
          { title: 'Every answer explained', body: 'Each question includes a short explanation you can learn from and save.' },
          { title: 'Real scoring', body: 'Your score is calculated from your answers and stored in your quiz history.' },
        ].map((item) => (
          <div key={item.title} className="card p-4">
            <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
              {item.title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{item.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-[11px] text-muted">
        AI-generated practice is not official curriculum material. {PRICING_TIERS[0].limits}
      </p>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this quiz?"
        description="The quiz will be removed. Your past attempt scores stay in your history."
        confirmLabel="Delete quiz"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

    </>
  );
}
