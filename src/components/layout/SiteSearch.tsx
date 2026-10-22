import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Command,
  CornerDownLeft,
  Search,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { STUDY_TOOLS, SUBJECTS, TUTOR_MODES } from '@/config/curriculum';

/**
 * Lightweight site search.
 *
 * It searches the site's own navigation, subjects, tutoring modes and study
 * tools — all of which are static configuration. It does not search student
 * notes or call an API, so it works before sign-in and needs no backend.
 */

interface Result {
  id: string;
  title: string;
  description: string;
  href: string;
  group: 'Pages' | 'Subjects' | 'Tutoring modes' | 'Study tools';
}

const PAGES: Result[] = [
  { id: 'p-home', title: 'Home', description: 'What Ujyalo Learn is and how it works', href: '/', group: 'Pages' },
  { id: 'p-features', title: 'Features', description: 'Tutor, quizzes, notes, planner and progress', href: '/features', group: 'Pages' },
  { id: 'p-subjects', title: 'Subjects & grades', description: 'Every subject from Grade 1 to SEE and beyond', href: '/subjects', group: 'Pages' },
  { id: 'p-pricing', title: 'Pricing', description: 'What is free today and what is planned', href: '/pricing', group: 'Pages' },
  { id: 'p-help', title: 'Help & FAQ', description: 'Getting started and troubleshooting', href: '/help', group: 'Pages' },
  { id: 'p-about', title: 'About', description: 'Why Ujyalo Learn exists and who built it', href: '/about', group: 'Pages' },
  { id: 'p-contact', title: 'Contact', description: 'How to reach the team', href: '/contact', group: 'Pages' },
  { id: 'p-privacy', title: 'Privacy Policy', description: 'What data is stored and why', href: '/privacy', group: 'Pages' },
  { id: 'p-terms', title: 'Terms of Service', description: 'The rules for using the platform', href: '/terms', group: 'Pages' },
  { id: 'p-tutor', title: 'Open the AI tutor', description: 'Ask a question (sign-in required)', href: '/app/tutor', group: 'Pages' },
  { id: 'p-quizzes', title: 'Practice quizzes', description: 'Generate a quiz and check your answers (sign-in required)', href: '/app/quizzes', group: 'Pages' },
  { id: 'p-notes', title: 'Notes', description: 'Saved explanations, searchable (sign-in required)', href: '/app/notes', group: 'Pages' },
  { id: 'p-flashcards', title: 'Flashcards', description: 'Build a deck and revise with active recall (sign-in required)', href: '/app/flashcards', group: 'Pages' },
  { id: 'p-planner', title: 'Study planner', description: 'Plan study sessions around your week (sign-in required)', href: '/app/planner', group: 'Pages' },
  { id: 'p-progress', title: 'Progress', description: 'See scores from your real quiz attempts (sign-in required)', href: '/app/progress', group: 'Pages' },
  { id: 'p-dashboard', title: 'Dashboard', description: 'Your day at a glance (sign-in required)', href: '/app', group: 'Pages' },
  { id: 'p-login', title: 'Log in', description: 'Return to your dashboard', href: '/login', group: 'Pages' },
  { id: 'p-signup', title: 'Create a free account', description: 'Start learning in about a minute', href: '/signup', group: 'Pages' },
];

const SUBJECT_RESULTS: Result[] = SUBJECTS.map((subject) => ({
  id: `s-${subject.id}`,
  title: subject.name,
  description: subject.description,
  href: `/subjects?subject=${subject.id}`,
  group: 'Subjects',
}));

const MODE_RESULTS: Result[] = TUTOR_MODES.map((mode) => ({
  id: `m-${mode.id}`,
  title: mode.label,
  description: mode.description,
  href: `/app/tutor?mode=${mode.id}`,
  group: 'Tutoring modes',
}));

const TOOL_RESULTS: Result[] = STUDY_TOOLS.map((tool) => ({
  id: `t-${tool.id}`,
  title: tool.label,
  description: tool.description,
  href: tool.path,
  group: 'Study tools',
}));

const ALL = [...PAGES, ...SUBJECT_RESULTS, ...MODE_RESULTS, ...TOOL_RESULTS];

function score(result: Result, query: string): number {
  const title = result.title.toLowerCase();
  const haystack = `${title} ${result.description.toLowerCase()} ${result.group.toLowerCase()}`;
  if (title === query) return 100;
  if (title.startsWith(query)) return 80;
  if (title.includes(query)) return 60;
  if (haystack.includes(query)) return 30;
  // Loose match: every letter appears in order.
  let index = 0;
  for (const character of query) {
    index = haystack.indexOf(character, index);
    if (index === -1) return 0;
    index += 1;
  }
  return 10;
}

export function SiteSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return PAGES.slice(0, 6);
    return ALL.map((result) => ({ result, points: score(result, trimmed) }))
      .filter((entry) => entry.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 9)
      .map((entry) => entry.result);
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Result[]>();
    for (const result of results) {
      map.set(result.group, [...(map.get(result.group) ?? []), result]);
    }
    return [...map.entries()];
  }, [results]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActive(0);
  }, []);

  const go = useCallback(
    (result: Result | undefined) => {
      if (!result) return;
      close();
      navigate(result.href);
    },
    [close, navigate],
  );

  // Global shortcuts: ⌘K / Ctrl-K open, "/" opens when not typing.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if ((event.key === 'k' || event.key === 'K') && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(true);
      } else if (event.key === '/' && !typing && !open) {
        event.preventDefault();
        setOpen(true);
      } else if (event.key === 'Escape' && open) {
        close();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [close, open]);

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
      document.body.style.overflow = 'hidden';
      return () => {
        window.clearTimeout(timer);
        document.body.style.overflow = '';
      };
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    const item = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    item?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((value) => Math.min(value + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((value) => Math.max(value - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      go(results[active]);
    }
  }

  return (
    <>
      {/* Desktop: labelled pill. Mobile: icon button. Both live here so the
          palette has a single source of open/closed state. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors md:inline-flex"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--muted)' }}
        aria-label="Search the site"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        <span className="hidden lg:inline">Search</span>
        <kbd
          className="ml-1 hidden items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-medium lg:inline-flex"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
        >
          <Command className="h-2.5 w-2.5" aria-hidden="true" />K
        </kbd>
      </button>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-icon md:hidden"
        aria-label="Search the site"
      >
        <Search className="h-[18px] w-[18px]" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]"
          style={{ background: 'color-mix(in srgb, #0B1020 55%, transparent)' }}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-2xl border shadow-2xl"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            role="dialog"
            aria-modal="true"
            aria-label="Search Ujyalo Learn"
          >
            <div className="flex items-center gap-2 border-b px-4" style={{ borderColor: 'var(--border)' }}>
              <Search className="h-4 w-4 shrink-0" style={{ color: 'var(--muted)' }} aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
                className="h-12 w-full bg-transparent text-sm outline-none"
                style={{ color: 'var(--text)' }}
                placeholder="Search pages, subjects, tools…"
                aria-controls="site-search-results"
                aria-activedescendant={results[active] ? `site-search-${results[active].id}` : undefined}
              />
              <button
                type="button"
                onClick={close}
                className="rounded-md border px-1.5 py-0.5 text-[10px] font-medium"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              >
                Esc
              </button>
            </div>

            <ul
              id="site-search-results"
              ref={listRef}
              role="listbox"
              aria-label="Search results"
              className="max-h-[52vh] overflow-y-auto py-2"
            >
              {results.length === 0 && (
                <li className="px-4 py-6 text-center text-sm" style={{ color: 'var(--muted)' }}>
                  Nothing matched “{query}”. Try “quiz”, “Nepali” or “SEE”.
                </li>
              )}
              {grouped.map(([group, items]) => (
                <li key={group} className="px-2 py-1">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                    {group}
                  </p>
                  <ul className="space-y-0.5">
                    {items.map((result) => {
                      const index = results.indexOf(result);
                      return (
                        <li key={result.id}>
                          <button
                            type="button"
                            id={`site-search-${result.id}`}
                            data-index={index}
                            role="option"
                            aria-selected={index === active}
                            onMouseEnter={() => setActive(index)}
                            onClick={() => go(result)}
                            className={cn('flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left')}
                            style={{
                              background: index === active ? 'var(--surface-2)' : 'transparent',
                            }}
                          >
                            <span
                              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                              style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                              aria-hidden="true"
                            >
                              {result.group === 'Subjects' ? (
                                <BookOpen className="h-3.5 w-3.5" />
                              ) : (
                                <Sparkles className="h-3.5 w-3.5" />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                                {result.title}
                              </span>
                              <span className="block truncate text-[11px]" style={{ color: 'var(--muted)' }}>
                                {result.description}
                              </span>
                            </span>
                            {index === active ? (
                              <CornerDownLeft className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--muted)' }} aria-hidden="true" />
                            ) : (
                              <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0" aria-hidden="true" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>

            <div
              className="flex items-center justify-between border-t px-4 py-2 text-[10px]"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
            >
              <span>↑ ↓ to move · Enter to open</span>
              <span>Searches this site only — not your notes</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
