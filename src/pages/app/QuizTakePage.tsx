import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  CircleHelp,
  Clock,
  RefreshCw,
  RotateCcw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { InlineAlert, PageLoader, ProgressBar } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthProvider';
import { useData } from '@/features/data/DataProvider';
import { buildAttempt, scoreMessage, scoreQuiz } from '@/lib/quiz';
import { getSubject } from '@/config/curriculum';
import { formatMinutes } from '@/lib/format';
import { cn, makeId, pluralize } from '@/lib/utils';
import type { Quiz, QuizQuestion } from '@/types/domain';

type Phase = 'taking' | 'result';

export default function QuizTakePage() {
  const { quizId } = useParams();
  const { user } = useAuth();
  const { quizzes, fetchQuiz, saveAttempt, logActivity, loading } = useData();
  const { toast } = useToast();

  const [quiz, setQuiz] = useState<Quiz | null>(() => quizzes.find((item) => item.id === quizId) ?? null);
  const [notFound, setNotFound] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('taking');
  const [result, setResult] = useState<ReturnType<typeof scoreQuiz> | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [isRetry, setIsRetry] = useState(false);
  const [saving, setSaving] = useState(false);
  const startRef = useRef(Date.now());
  const savedAttemptRef = useRef(false);

  useEffect(() => {
    if (!quizId) return;
    const cached = quizzes.find((item) => item.id === quizId);
    if (cached) {
      setQuiz(cached);
      setQuestions(cached.questions);
      setAnswers({});
      setIndex(0);
      setPhase('taking');
      setResult(null);
      setIsRetry(false);
      savedAttemptRef.current = false;
      startRef.current = Date.now();
      return;
    }
    if (loading) return;
    let cancelled = false;
    fetchQuiz(quizId)
      .then((loaded) => {
        if (cancelled) return;
        if (!loaded) {
          setNotFound(true);
          return;
        }
        setQuiz(loaded);
        setQuestions(loaded.questions);
        startRef.current = Date.now();
      })
      .catch(() => setNotFound(true));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId, loading]);

  const current = questions[index];
  const answeredCount = useMemo(
    () => questions.filter((question) => (answers[question.id] ?? '').trim().length > 0).length,
    [answers, questions],
  );
  const unanswered = questions.length - answeredCount;

  function choose(value: string) {
    if (!current) return;
    setAnswers((currentAnswers) => ({ ...currentAnswers, [current.id]: value }));
  }

  async function submit() {
    if (!quiz || !user) return;
    setConfirmSubmit(false);
    setSaving(true);
    const scored = scoreQuiz({ questions }, answers);
    setResult(scored);
    setPhase('result');

    if (!savedAttemptRef.current) {
      savedAttemptRef.current = true;
      const durationSeconds = Math.round((Date.now() - startRef.current) / 1000);
      try {
        await saveAttempt(
          buildAttempt(
            { ...quiz, questions },
            scored,
            {
              id: makeId('attempt'),
              ownerId: user.uid,
              durationSeconds,
              now: new Date(),
            },
          ),
        );
        logActivity('quiz', `Quiz: ${quiz.title} — ${scored.score}/${scored.total}`, {
          subjectId: quiz.subjectId,
          minutes: Math.max(1, Math.round(durationSeconds / 60)),
        });
      } catch {
        toast('Your score was calculated but could not be saved. Check your connection.', 'error');
      }
    }
    setSaving(false);
  }

  function askSubmit() {
    if (unanswered > 0) {
      setConfirmSubmit(true);
    } else {
      void submit();
    }
  }

  function retryIncorrect() {
    if (!result) return;
    const incorrectIds = new Set(result.answers.filter((answer) => !answer.correct).map((answer) => answer.questionId));
    const subset = questions.filter((question) => incorrectIds.has(question.id));
    if (!subset.length) return;
    setIsRetry(true);
    setQuestions(subset);
    setAnswers({});
    setIndex(0);
    setResult(null);
    setPhase('taking');
    savedAttemptRef.current = false;
    startRef.current = Date.now();
  }

  function restartQuiz() {
    if (!quiz) return;
    setIsRetry(false);
    setQuestions(quiz.questions);
    setAnswers({});
    setIndex(0);
    setResult(null);
    setPhase('taking');
    savedAttemptRef.current = false;
    startRef.current = Date.now();
  }

  if (notFound) {
    return (
      <div className="card mx-auto max-w-lg p-6 text-center">
        <CircleHelp className="mx-auto h-8 w-8" style={{ color: 'var(--muted)' }} aria-hidden="true" />
        <h1 className="mt-3 text-lg font-bold" style={{ color: 'var(--text)' }}>
          Quiz not found
        </h1>
        <p className="mt-1 text-sm text-muted">It may have been deleted, or it belongs to a different account.</p>
        <Button asChild className="mt-4" variant="secondary">
          <Link to="/app/quizzes">Back to quizzes</Link>
        </Button>
      </div>
    );
  }

  if (!quiz || !questions.length) return <PageLoader label="Loading quiz…" />;

  const subjectName = getSubject(quiz.subjectId)?.name ?? quiz.subjectId;
  const total = questions.length;

  if (phase === 'result' && result) {
    const percent = result.percent;
    const incorrect = result.answers.filter((answer) => !answer.correct);
    return (
      <>
        <Seo title={`${quiz.title} — results`} description="Quiz results." path="/app/quizzes" noindex />
        <div className="mx-auto max-w-3xl">
          <Button asChild variant="ghost" size="sm" className="mb-3" icon={<ArrowLeft className="h-4 w-4" />}>
            <Link to="/app/quizzes">All quizzes</Link>
          </Button>

          <Card className="overflow-hidden">
            <div
              className="px-6 py-7 text-center"
              style={{
                background:
                  percent >= 70
                    ? 'linear-gradient(135deg, #0E7A4F 0%, #12905D 100%)'
                    : percent >= 40
                      ? 'linear-gradient(135deg, #B97716 0%, #D99B27 100%)'
                      : 'linear-gradient(135deg, #8F2A21 0%, #B42318 100%)',
                color: '#fff',
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-90">{isRetry ? 'Retry result' : 'Quiz complete'}</p>
              <p className="mt-2 text-5xl font-extrabold tracking-tight">
                {result.score}
                <span className="text-2xl font-semibold opacity-80">/{result.total}</span>
              </p>
              <p className="mt-1 text-sm font-medium opacity-95">{percent}% · {scoreMessage(percent)}</p>
            </div>
            <CardBody>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {incorrect.length > 0 && (
                  <Button onClick={retryIncorrect} icon={<RotateCcw className="h-4 w-4" />}>
                    Retry {pluralize(incorrect.length, 'incorrect question')}
                  </Button>
                )}
                <Button variant="secondary" onClick={restartQuiz} icon={<RefreshCw className="h-4 w-4" />}>
                  Retake full quiz
                </Button>
                <Button asChild variant="ghost">
                  <Link to={`/app/quizzes?subject=${quiz.subjectId}&topic=${encodeURIComponent(quiz.topic)}`}>
                    <Sparkles className="h-4 w-4" /> Generate another quiz
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link to={`/app/tutor?subject=${quiz.subjectId}`}>Ask the tutor about this</Link>
                </Button>
              </div>
              <p className="mt-4 text-center text-[11px] text-muted">
                This score is saved to your quiz history. It is practice feedback, not an official grade.
              </p>
            </CardBody>
          </Card>

          <h2 className="mb-2 mt-6 text-lg font-bold" style={{ color: 'var(--text)' }}>
            Review your answers
          </h2>
          <div className="space-y-3">
            {questions.map((question, questionIndex) => {
              const answerRecord = result.answers.find((answer) => answer.questionId === question.id);
              const correct = answerRecord?.correct ?? false;
              return (
                <Card key={question.id}>
                  <CardBody>
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 shrink-0" aria-hidden="true">
                        {correct ? (
                          <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--success)' }} />
                        ) : (
                          <XCircle className="h-5 w-5" style={{ color: 'var(--danger)' }} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold leading-relaxed" style={{ color: 'var(--text)' }}>
                          {questionIndex + 1}. {question.question}
                        </p>
                        <div className="mt-2 space-y-1.5 text-[13px]">
                          <p className="text-muted">
                            Your answer:{' '}
                            <span style={{ color: correct ? 'var(--success)' : 'var(--danger)' }}>
                              {answerRecord?.given?.trim() || 'Not answered'}
                            </span>
                          </p>
                          {!correct && (
                            <p className="text-muted">
                              Correct answer: <span style={{ color: 'var(--success)' }}>{question.answer}</span>
                            </p>
                          )}
                        </div>
                        <div className="mt-2 rounded-lg px-3 py-2 text-[12px] leading-relaxed" style={{ background: 'var(--surface-2)', color: 'var(--text-soft)' }}>
                          <span className="font-semibold" style={{ color: 'var(--text)' }}>
                            Why:{' '}
                          </span>
                          {question.explanation}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Seo title={`${quiz.title} — quiz`} description="Practice quiz." path="/app/quizzes" noindex />
      <div className="mx-auto max-w-2xl">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Button asChild variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
            <Link to="/app/quizzes">Exit</Link>
          </Button>
          <p className="truncate text-xs text-muted">
            {subjectName} · {quiz.difficulty} · {isRetry ? 'Retry' : 'Practice'}
          </p>
        </div>

        <Card>
          <CardHeader
            title={quiz.title}
            description={`Question ${index + 1} of ${total} · ${answeredCount} answered`}
            icon={<CircleHelp className="h-4 w-4" />}
            action={
              <span className="badge badge-neutral inline-flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden="true" /> {formatMinutes(Math.max(1, Math.round((Date.now() - startRef.current) / 60000)))}
              </span>
            }
          />
          <div className="px-5">
            <ProgressBar value={answeredCount} max={total} className="mt-1" />
          </div>
          <CardBody>
            {current && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--primary)' }}>
                  {current.type === 'mcq'
                    ? 'Multiple choice'
                    : current.type === 'true-false'
                      ? 'True or false'
                      : current.type === 'short-answer'
                        ? 'Short answer'
                        : 'Fill in the blank'}
                </p>
                <h2 className="mt-2 text-lg font-semibold leading-relaxed" style={{ color: 'var(--text)' }}>
                  {current.question}
                </h2>

                <div className="mt-4 space-y-2">
                  {current.type === 'mcq' &&
                    current.options?.map((option) => {
                      const selected = answers[current.id] === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => choose(option)}
                          aria-pressed={selected}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition-colors',
                            selected ? 'border-[color:var(--primary)] bg-[color:var(--primary-soft)]' : 'hover:bg-[color:var(--surface-2)]',
                          )}
                          style={{ borderColor: selected ? 'var(--primary)' : 'var(--border)' }}
                        >
                          {selected ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} aria-hidden="true" />
                          ) : (
                            <Circle className="h-4 w-4 shrink-0" style={{ color: 'var(--border-strong)' }} aria-hidden="true" />
                          )}
                          <span style={{ color: selected ? 'var(--primary)' : 'var(--text-soft)' }}>{option}</span>
                        </button>
                      );
                    })}

                  {current.type === 'true-false' &&
                    ['True', 'False'].map((option) => {
                      const selected = answers[current.id] === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => choose(option)}
                          aria-pressed={selected}
                          className={cn(
                            'w-full rounded-xl border px-3.5 py-3 text-left text-sm font-medium transition-colors',
                            selected ? 'border-[color:var(--primary)] bg-[color:var(--primary-soft)]' : 'hover:bg-[color:var(--surface-2)]',
                          )}
                          style={{ borderColor: selected ? 'var(--primary)' : 'var(--border)', color: selected ? 'var(--primary)' : 'var(--text-soft)' }}
                        >
                          {option}
                        </button>
                      );
                    })}

                  {(current.type === 'short-answer' || current.type === 'fill-blank') && (
                    <div>
                      <label className="label" htmlFor={`answer-${current.id}`}>
                        Your answer
                      </label>
                      <input
                        id={`answer-${current.id}`}
                        className="input"
                        value={answers[current.id] ?? ''}
                        onChange={(event) => choose(event.target.value)}
                        placeholder={current.type === 'fill-blank' ? 'The missing word or phrase' : 'Type your answer'}
                        autoComplete="off"
                      />
                      <p className="hint">Spelling matters. Capital letters and extra spaces do not.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-2">
              <Button
                variant="secondary"
                onClick={() => setIndex((value) => Math.max(0, value - 1))}
                disabled={index === 0}
                icon={<ArrowLeft className="h-4 w-4" />}
              >
                Previous
              </Button>
              {index < total - 1 ? (
                <Button onClick={() => setIndex((value) => Math.min(total - 1, value + 1))} iconRight={<ArrowRight className="h-4 w-4" />}>
                  Next
                </Button>
              ) : (
                <Button onClick={askSubmit} loading={saving} disabled={(answers[current?.id ?? ''] ?? '').trim().length === 0 && unanswered === total}>
                  Submit quiz
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        <div className="mt-3 flex items-center justify-center gap-1.5">
          {questions.map((question, questionIndex) => (
            <button
              key={question.id}
              type="button"
              onClick={() => setIndex(questionIndex)}
              aria-label={`Go to question ${questionIndex + 1}`}
              aria-current={questionIndex === index ? 'step' : undefined}
              className="h-2.5 w-2.5 rounded-full transition-transform hover:scale-125"
              style={{
                background:
                  questionIndex === index
                    ? 'var(--primary)'
                    : (answers[question.id] ?? '').trim()
                      ? 'var(--primary-soft)'
                      : 'var(--surface-3)',
                border: questionIndex === index ? '1px solid var(--primary)' : '1px solid var(--border)',
              }}
            />
          ))}
        </div>

        <div className="mt-4">
          <InlineAlert tone="info">
            Answers are hidden until you submit, so this stays honest practice. You can move between questions and change
            your answers before submitting.
          </InlineAlert>
        </div>

        <ConfirmDialog
          open={confirmSubmit}
          title="Submit with unanswered questions?"
          description={`${unanswered} question${unanswered === 1 ? ' is' : 's are'} still unanswered. Unanswered questions are marked incorrect.`}
          confirmLabel="Submit anyway"
          cancelLabel="Keep answering"
          onConfirm={submit}
          onClose={() => setConfirmSubmit(false)}
        />
      </div>
    </>
  );
}
