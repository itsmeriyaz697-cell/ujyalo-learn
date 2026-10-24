import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Clock, Flag, RotateCcw, X } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthProvider';
import { ArenaApiError, startQuiz, submitQuiz } from '@/features/arena/api';
import {
  applyToLocalProfile,
  loadLocalProfile,
  startPractice,
  submitPractice,
  toQuizQuestions,
  type LocalAttempt,
} from '@/features/arena/localArena';
import { Avatar, BadgeChip, DemoNotice, DifficultyPill, Loading } from '@/features/arena/components';
import type { ArenaCategory, AnsweredQuestion, QuizQuestion, SubmitResult } from '@/features/arena/types';
import { CATEGORY_META, type Difficulty } from '../../../shared/arena/scoring';

type Phase = 'loading' | 'playing' | 'submitting' | 'results' | 'error';

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

export default function ArenaPlayPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, getToken, loading: authLoading } = useAuth();

  const isPractice = params.get('practice') === '1';
  const isDaily = params.get('daily') === '1';
  const category = (params.get('category') ?? 'mathematics') as ArenaCategory;
  const difficulty = (params.get('difficulty') ?? 'medium') as Difficulty;
  const length = Number(params.get('length') ?? 5);

  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [practice, setPractice] = useState(false);
  const [localAttempt, setLocalAttempt] = useState<LocalAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [quizCategory, setQuizCategory] = useState<ArenaCategory>(category);

  const startedRef = useRef(false);
  const submittedRef = useRef(false);

  const begin = useCallback(async () => {
    setPhase('loading');
    setError(null);
    try {
      // Practice, or signed out: score locally. No account, no points.
      if (isPractice || !user) {
        if (!user && !isPractice) {
          const next = `/global-quiz/play?${params.toString()}`;
          navigate(`/login?next=${encodeURIComponent(next)}`, { replace: true });
          return;
        }
        const attempt = startPractice(category, length, isDaily);
        setLocalAttempt(attempt);
        setPractice(true);
        setQuestions(toQuizQuestions(attempt));
        setQuizCategory(attempt.category);
        setSecondsLeft(Math.min(length, 4) * 45);
        setPhase('playing');
        return;
      }

      const token = await getToken();
      const started = await startQuiz(
        isDaily ? { daily: true } : { category, difficulty, length: Number.isFinite(length) ? length : 5 },
        token,
      );

      // Unconfigured deployment: the API reports it instead of pretending.
      if ((started as unknown as { configured?: boolean }).configured === false) {
        const attempt = startPractice(category, length, isDaily);
        setLocalAttempt(attempt);
        setDemo(true);
        setQuestions(toQuizQuestions(attempt));
        setQuizCategory(attempt.category);
        setSecondsLeft(Math.min(length, 4) * 45);
        setPhase('playing');
        return;
      }

      setAttemptId(started.attemptId);
      setQuestions(started.questions);
      setQuizCategory(started.category);
      // The server allows a full 45s per question plus a minute of grace. The
      // countdown here is deliberately a little shorter so the automatic
      // submission lands inside the window rather than being rejected.
      setSecondsLeft(Math.max(30, started.seconds - 15));
      setPhase('playing');
    } catch (err) {
      if (err instanceof ArenaApiError && err.status === 409 && err.code === 'no_profile') {
        navigate('/global-quiz', { replace: true });
        return;
      }
      setError((err as Error).message);
      setPhase('error');
    }
  }, [category, difficulty, getToken, isDaily, isPractice, length, navigate, params, user]);

  useEffect(() => {
    if (authLoading) return;
    if (startedRef.current) return;
    startedRef.current = true;
    void begin();
  }, [authLoading, begin]);

  const finish = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setPhase('submitting');
    try {
      if (practice || demo) {
        const attempt = localAttempt;
        if (!attempt) throw new Error('That practice quiz has expired.');
        const scored = submitPractice(attempt, answers);
        if (demo) applyToLocalProfile(loadLocalProfile(), attempt, scored);
        setResult(scored);
      } else {
        const token = await getToken();
        const scored = await submitQuiz(attemptId as string, answers, token);
        setResult(scored);
      }
      setPhase('results');
    } catch (err) {
      submittedRef.current = false;
      setError((err as Error).message);
      setPhase('error');
    }
  }, [answers, attemptId, demo, getToken, localAttempt, practice]);

  // Countdown. Auto-submits at zero so a quiz is never lost to a slow reader.
  useEffect(() => {
    if (phase !== 'playing') return;
    if (secondsLeft <= 0) {
      void finish();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [finish, phase, secondsLeft]);

  const current = questions[index];
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length ? ((index + 1) / questions.length) * 100 : 0;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const lowTime = secondsLeft <= 20;

  const choose = (option: number) => {
    if (phase !== 'playing' || !current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: option }));
  };

  // Keyboard: 1–4 pick an answer, arrows move between questions.
  useEffect(() => {
    if (phase !== 'playing') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const numeric = Number(event.key);
      if (numeric >= 1 && numeric <= 4) choose(numeric - 1);
      if (event.key === 'ArrowRight' && index < questions.length - 1) setIndex(index + 1);
      if (event.key === 'ArrowLeft' && index > 0) setIndex(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (phase === 'loading') return <Loading label="Preparing your questions…" />;

  if (phase === 'error') {
    return (
      <div className="container-page py-16">
        <Seo title="Quiz Arena | Ujyalo Learn" description="Arena quiz." noindex />
        <div className="card mx-auto max-w-lg p-6 text-center">
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            That quiz could not start
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">{error}</p>
          <div className="mt-4 flex justify-center gap-2">
            <Link to="/global-quiz">
              <Button variant="secondary">Back to the Arena</Button>
            </Link>
            <Button onClick={() => void begin()}>Try again</Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'results' && result) {
    return (
      <ResultsView
        result={result}
        demo={demo}
        practice={practice}
        category={quizCategory}
        categoryLabel={CATEGORY_META[quizCategory].label}
      />
    );
  }

  return (
    <div className="container-page max-w-3xl py-8">
      <Seo title="Quiz in progress | Ujyalo Learn" description="An Arena quiz in progress." noindex />

      {(practice || demo) && (
        <div className="mb-4">
          <DemoNotice>
            {demo
              ? 'This deployment has no Arena database, so this quiz is running in local demo mode. Points stay in this browser and are not part of any global ranking.'
              : 'Practice quiz: the questions and explanations are real, but no points or rank are recorded.'}
          </DemoNotice>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
            {isDaily ? 'Daily challenge · ' : ''}
            {CATEGORY_META[quizCategory].label}
          </p>
          <p className="text-[13px]" style={{ color: 'var(--text-soft)' }}>
            Question {index + 1} of {questions.length} · {answeredCount} answered
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold tabular-nums"
          style={{
            background: lowTime ? 'var(--danger-soft)' : 'var(--surface-2)',
            color: lowTime ? 'var(--danger)' : 'var(--text)',
          }}
          role="timer"
          aria-live={lowTime ? 'assertive' : 'off'}
          aria-label={`Time remaining: ${minutes} minutes ${seconds} seconds`}
        >
          <Clock className="h-4 w-4" aria-hidden="true" />
          {minutes}:{String(seconds).padStart(2, '0')}
        </div>
      </div>

      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full"
        style={{ background: 'var(--surface-3)' }}
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={questions.length}
        aria-label="Quiz progress"
      >
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: 'var(--primary)' }} />
      </div>

      {current && (
        <div className="card mt-5 p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              Question {index + 1}
            </span>
            <DifficultyPill difficulty={current.difficulty} />
          </div>

          <h1 className="mt-2 text-[17px] font-semibold leading-snug" style={{ color: 'var(--text)' }}>
            {current.prompt}
          </h1>

          <fieldset className="mt-4 space-y-2">
            <legend className="sr-only">Choose one answer</legend>
            {current.options.map((option, optionIndex) => {
              const selected = answers[current.id] === optionIndex;
              return (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition"
                  style={{
                    borderColor: selected ? 'var(--primary)' : 'var(--border)',
                    background: selected ? 'var(--primary-soft)' : 'var(--surface)',
                  }}
                >
                  <input
                    type="radio"
                    name={`q-${current.id}`}
                    value={optionIndex}
                    checked={selected}
                    onChange={() => choose(optionIndex)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold"
                    style={{
                      background: selected ? 'var(--primary)' : 'var(--surface-2)',
                      color: selected ? 'var(--primary-contrast)' : 'var(--muted)',
                    }}
                  >
                    {OPTION_KEYS[optionIndex]}
                  </span>
                  <span className="text-[14px] leading-snug" style={{ color: 'var(--text)' }}>
                    {option}
                  </span>
                </label>
              );
            })}
          </fieldset>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          disabled={index === 0}
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
          icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        >
          Previous
        </Button>

        <div className="flex gap-2">
          {index < questions.length - 1 ? (
            <Button onClick={() => setIndex((value) => Math.min(questions.length - 1, value + 1))} iconRight={<ArrowRight className="h-4 w-4" aria-hidden="true" />}>
              Next question
            </Button>
          ) : (
            <Button
              onClick={() => void finish()}
              loading={phase === 'submitting'}
              icon={<Flag className="h-4 w-4" aria-hidden="true" />}
            >
              Submit quiz
            </Button>
          )}
        </div>
      </div>

      <p className="mt-3 text-[12px]" style={{ color: 'var(--muted)' }}>
        Use keys 1–4 to answer. Once you submit, answers cannot be changed.
      </p>
    </div>
  );
}

function ResultsView({
  result,
  demo,
  practice,
  category,
  categoryLabel,
}: {
  result: SubmitResult;
  demo: boolean;
  practice: boolean;
  category: ArenaCategory;
  categoryLabel: string;
}) {
  const wrongOrSkipped = result.answers.filter((a) => !a.correct);
  const scorePct = result.total ? Math.round((result.correct / result.total) * 100) : 0;

  return (
    <div className="container-page max-w-3xl py-8">
      <Seo title="Quiz results | Ujyalo Learn" description="Your Arena quiz result." noindex />

      <div className="card p-6 text-center">
        <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
          {categoryLabel} · {result.total} questions
        </p>
        <p className="mt-2 text-4xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
          {result.correct}/{result.total}
        </p>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>
          {scorePct}% correct
          {result.duplicate ? ' · this quiz had already been scored, so nothing was added twice' : ''}
        </p>

        <div className="mt-5 grid gap-2 text-left sm:grid-cols-2">
          <Row label="Correct answers" value={`+${result.answerPoints}`} />
          <Row label="Finished the quiz" value={`+${result.completionBonus}`} />
          {result.perfectBonus > 0 && <Row label="Perfect score bonus" value={`+${result.perfectBonus}`} />}
          {result.streakBonus > 0 && <Row label="Streak bonus" value={`+${result.streakBonus}`} />}
          <Row
            label={practice || demo ? 'Points (not saved)' : 'Points added to your total'}
            value={`+${result.pointsThisAttempt}`}
            strong
          />
        </div>

        {!practice && !demo && (
          <p className="mt-4 text-[13px]" style={{ color: 'var(--text-soft)' }}>
            Total: <strong style={{ color: 'var(--text)' }}>{result.totals.totalPoints.toLocaleString()}</strong> points ·
            accuracy {result.totals.accuracy}% · streak {result.totals.streak} {result.totals.streak === 1 ? 'day' : 'days'}
          </p>
        )}

        {(practice || demo) && (
          <p className="mt-4 text-[13px]" style={{ color: 'var(--muted)' }}>
            {demo
              ? 'Demo mode: this score was kept in this browser only and is not on any leaderboard.'
              : 'Practice mode: nothing was saved. Create a free account to keep your points and rank.'}
          </p>
        )}

        {result.newBadges.length > 0 && (
          <div className="mt-5 rounded-xl border p-3 text-left" style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)' }}>
            <p className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>
              New badge{result.newBadges.length > 1 ? 's' : ''} earned
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {result.newBadges.map((badge) => (
                <BadgeChip key={badge.id} badge={badge} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link to={`/global-quiz/play?category=${category}&difficulty=${result.answers[0] ? 'medium' : 'easy'}&length=${result.total}`}>
            <Button icon={<RotateCcw className="h-4 w-4" aria-hidden="true" />}>Play again</Button>
          </Link>
          <Link to="/global-quiz/leaderboard">
            <Button variant="secondary">See the leaderboard</Button>
          </Link>
          <Link to="/global-quiz">
            <Button variant="ghost">Back to Arena</Button>
          </Link>
        </div>
      </div>

      <h2 className="mt-8 text-[16px] font-semibold" style={{ color: 'var(--text)' }}>
        Review your answers
      </h2>
      <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>
        Every question is explained, including the ones you got right.
      </p>

      <ol className="mt-4 space-y-3">
        {result.answers.map((answer, position) => (
          <AnswerCard key={answer.questionId} answer={answer} position={position + 1} />
        ))}
      </ol>

      {wrongOrSkipped.length > 0 && (
        <p className="mt-4 text-[13px]" style={{ color: 'var(--muted)' }}>
          {wrongOrSkipped.length} question{wrongOrSkipped.length > 1 ? 's' : ''} to revisit. Reading the explanation is
          worth more than replaying the quiz.
        </p>
      )}

      <div className="mt-6 flex items-center gap-2 text-[12px]" style={{ color: 'var(--muted)' }}>
        <Avatar handle="ujyalo" size="sm" />
        Questions from the Ujyalo Learn curated bank, written and checked by hand.
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className="flex items-center justify-between rounded-lg px-3 py-2"
      style={{ background: strong ? 'var(--primary-soft)' : 'var(--surface-2)' }}
    >
      <span className="text-[13px]" style={{ color: strong ? 'var(--primary)' : 'var(--text-soft)' }}>
        {label}
      </span>
      <span className="text-[13px] font-semibold tabular-nums" style={{ color: strong ? 'var(--primary)' : 'var(--text)' }}>
        {value}
      </span>
    </div>
  );
}

function AnswerCard({ answer, position }: { answer: AnsweredQuestion; position: number }) {
  return (
    <li className="card p-4">
      <div className="flex items-start gap-2">
        <span
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
          style={{
            background: answer.correct ? 'var(--success-soft)' : 'var(--danger-soft)',
            color: answer.correct ? 'var(--success)' : 'var(--danger)',
          }}
          aria-hidden="true"
        >
          {answer.correct ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
        </span>
        <div className="min-w-0">
          <p className="text-[14px] font-medium leading-snug" style={{ color: 'var(--text)' }}>
            {position}. {answer.prompt}
          </p>
          <p className="mt-1 text-[12.5px]" style={{ color: 'var(--muted)' }}>
            <span className="sr-only">{answer.correct ? 'Correct. ' : 'Incorrect. '}</span>
            Your answer:{' '}
            <span style={{ color: answer.correct ? 'var(--success)' : 'var(--danger)' }}>
              {answer.chosenIndex === null ? 'not answered' : answer.options[answer.chosenIndex]}
            </span>
            {!answer.correct && (
              <>
                {' · '}Correct answer:{' '}
                <span style={{ color: 'var(--success)' }}>{answer.options[answer.correctIndex]}</span>
              </>
            )}
            {answer.points > 0 && <> · +{answer.points} pts</>}
          </p>
          <p className="mt-1.5 rounded-lg px-2.5 py-2 text-[12.5px] leading-relaxed" style={{ background: 'var(--surface-2)', color: 'var(--text-soft)' }}>
            {answer.explanation}
          </p>
        </div>
      </div>
    </li>
  );
}
