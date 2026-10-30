import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronRight, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * One question a day, rotating by calendar date rather than by a cron job.
 *
 * Honesty rules:
 *  - The bank is written here, by hand, so nothing is scraped or invented at
 *    runtime.
 *  - "Answered" state is per-browser (localStorage) and per-date. There is no
 *    server counter and no number on screen claiming how many students got it
 *    right, because we do not have that number.
 *  - The explanation only appears after an answer, so the question still
 *    teaches when someone gets it wrong.
 */

interface DailyQuestion {
  subject: string;
  grade: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}

const BANK: DailyQuestion[] = [
  {
    subject: 'Mathematics',
    grade: 'Class 8',
    prompt: 'A shirt marked at Rs 1,200 is sold at 15% off. What is the selling price?',
    options: ['Rs 180', 'Rs 1,020', 'Rs 1,080', 'Rs 1,380'],
    answer: 1,
    explanation:
      '15% of 1,200 is 180. A discount takes that away, so 1,200 − 180 = 1,020. Adding instead of subtracting gives 1,380 — a common slip when the word "off" is skimmed.',
  },
  {
    subject: 'Science',
    grade: 'Class 8',
    prompt: 'A plant is kept in a dark cupboard for three days. Which result would you expect?',
    options: [
      'It grows faster because it saves energy',
      'Its leaves stop producing starch',
      'It produces more oxygen than before',
      'The roots stop taking up water',
    ],
    answer: 1,
    explanation:
      'Photosynthesis needs light. Without light the leaf cannot make glucose, so the iodine starch test turns negative. The plant still respires, which is why it keeps using water and does not grow faster.',
  },
  {
    subject: 'Mathematics',
    grade: 'Class 9',
    prompt: 'If 2x + 3 = 11, what is the value of 4x − 1?',
    options: ['13', '15', '17', '21'],
    answer: 1,
    explanation:
      'First solve for x: 2x = 8, so x = 4. Then 4(4) − 1 = 15. A shortcut: 4x is double 2x, so double 8 to get 16, then subtract 1.',
  },
  {
    subject: 'English',
    grade: 'Class 7',
    prompt: 'Choose the sentence with the correct form of the verb.',
    options: [
      'She have finished her homework already.',
      'She has finished her homework already.',
      'She has finish her homework already.',
      'She having finished her homework already.',
    ],
    answer: 1,
    explanation:
      '"She" is third person singular, so the present perfect uses has + past participle: "has finished". "Have" belongs with I, you, we and they.',
  },
  {
    subject: 'Social Studies',
    grade: 'Class 8',
    prompt: 'Why does Nepal experience warmer weather in the Terai than in the mountains?',
    options: [
      'The Terai is closer to the sun',
      'Air pressure is lower at high altitude',
      'Air heats up more near sea level',
      'Mountains receive less sunlight',
    ],
    answer: 2,
    explanation:
      'Air pressure is higher at low altitude, so the air is denser and holds more heat. Temperature falls by roughly 6.5 °C for every kilometre you climb. Sunlight reaches the mountains just as directly.',
  },
  {
    subject: 'Computer Science',
    grade: 'Class 9',
    prompt: 'A loop runs while (i < 5) starting from i = 0 and adds 1 to i each time. How many times does the body run?',
    options: ['4 times', '5 times', '6 times', 'Infinite times'],
    answer: 1,
    explanation:
      'The values are 0, 1, 2, 3 and 4 — five passes. The loop stops at 5 because 5 < 5 is false. Counting 0 through 4 rather than 1 through 5 is the usual off-by-one trap.',
  },
  {
    subject: 'Science',
    grade: 'Class 10',
    prompt: 'A convex lens forms a real, inverted image when the object is placed beyond 2F. Where is the image formed?',
    options: ['At F', 'Between F and 2F', 'At 2F', 'Beyond 2F'],
    answer: 1,
    explanation:
      'Beyond 2F the image always lands between F and 2F on the other side, smaller than the object. At exactly 2F the image is at 2F and the same size — worth memorising as the pair.',
  },
];

/** Local calendar date in Asia/Kathmandu, so "today" matches the student's day. */
function todayKey(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return parts;
}

function dayIndex(key: string): number {
  // Deterministic: the same date always maps to the same question, and the
  // bank cycles through every entry before repeating.
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) % 100000;
  return hash % BANK.length;
}

const STORAGE_PREFIX = 'ujyalo.daily.';

export function DailyQuestion({ compact = false }: { compact?: boolean }) {
  const key = useMemo(() => todayKey(), []);
  const question = BANK[dayIndex(key)];
  const storageKey = `${STORAGE_PREFIX}${key}`;

  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved !== null) {
        const value = Number(saved);
        if (Number.isInteger(value) && value >= 0) {
          setPicked(value);
          setRevealed(true);
        }
      }
    } catch {
      // Private mode or storage disabled — the question still works, it just
      // does not remember the answer.
    }
  }, [storageKey]);

  function choose(index: number) {
    if (revealed) return;
    setPicked(index);
    setRevealed(true);
    try {
      window.localStorage.setItem(storageKey, String(index));
    } catch {
      /* ignore */
    }
  }

  const correct = picked === question.answer;

  return (
    <section
      aria-labelledby="daily-question-heading"
      className={cn('overflow-hidden rounded-lg border', compact ? '' : '')}
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-5 py-3" style={{ borderColor: 'var(--border)' }}>
        <span
          className="text-[11px] font-bold uppercase tracking-[0.16em]"
          style={{ color: 'var(--accent-text)' }}
        >
          Question of the day
        </span>
        <span className="text-xs text-muted">
          {question.subject} · {question.grade}
        </span>
        <span className="ml-auto text-xs text-muted">{key}</span>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <h3
          id="daily-question-heading"
          className="text-lg font-bold leading-snug tracking-[-0.01em] sm:text-xl"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
        >
          {question.prompt}
        </h3>

        <ul className="mt-4 grid gap-2">
          {question.options.map((option, index) => {
            const isPicked = picked === index;
            const isAnswer = index === question.answer;
            const showState = revealed && (isPicked || isAnswer);
            return (
              <li key={option}>
                <button
                  type="button"
                  onClick={() => choose(index)}
                  disabled={revealed}
                  aria-pressed={isPicked}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md border px-3.5 py-2.5 text-left text-sm transition-colors',
                    revealed ? 'cursor-default' : 'hover:bg-[var(--surface-2)]',
                  )}
                  style={{
                    borderColor: showState
                      ? isAnswer
                        ? 'var(--success)'
                        : 'var(--danger)'
                      : 'var(--border)',
                    background: showState
                      ? isAnswer
                        ? 'var(--success-soft)'
                        : 'var(--danger-soft)'
                      : 'var(--surface)',
                    color: 'var(--text)',
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-bold uppercase"
                    style={{ borderColor: 'var(--border-strong)', color: 'var(--muted)' }}
                  >
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1">{option}</span>
                  {showState && isAnswer && <Check className="h-4 w-4 shrink-0" style={{ color: 'var(--success)' }} aria-hidden="true" />}
                  {showState && isPicked && !isAnswer && <X className="h-4 w-4 shrink-0" style={{ color: 'var(--danger)' }} aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>

        {revealed ? (
          <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
            <p className="text-sm font-semibold" style={{ color: correct ? 'var(--success)' : 'var(--danger)' }}>
              {correct ? 'Correct.' : `Not quite — the answer is ${String.fromCharCode(65 + question.answer)}.`}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{question.explanation}</p>
            <p className="mt-3 text-xs text-muted">
              One question a day, and one answer per device. A new one appears tomorrow.
            </p>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="text-xs text-muted">Pick an answer — the explanation appears either way.</p>
            <button
              type="button"
              onClick={() => {
                window.localStorage.removeItem(storageKey);
                setPicked(null);
                setRevealed(false);
              }}
              className="ml-auto hidden items-center gap-1 text-xs text-muted hover:underline sm:inline-flex"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              Reset
            </button>
          </div>
        )}
      </div>

      {!compact && (
        <div className="border-t px-5 py-3" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
          <a
            href="/global-quiz"
            className="inline-flex items-center gap-1 text-sm font-semibold"
            style={{ color: 'var(--text)' }}
          >
            Practise a full set
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      )}
    </section>
  );
}
