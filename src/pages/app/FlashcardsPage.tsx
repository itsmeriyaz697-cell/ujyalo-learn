import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  Eye,
  Layers,
  Shuffle,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, InlineAlert, ProgressBar } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { AiStatusBanner } from '@/components/app/AiStatusBanner';
import { PageHeading } from '@/components/app/PageHeading';
import { useAuth } from '@/features/auth/AuthProvider';
import { useData } from '@/features/data/DataProvider';
import { useAiHealth } from '@/hooks/useAiHealth';
import { generateFlashcardsViaApi } from '@/services/ai/client';
import { getSubject, SUBJECTS } from '@/config/curriculum';
import { formatRelative } from '@/lib/format';
import { makeId } from '@/lib/utils';
import type { FlashcardDeck } from '@/types/domain';

export default function FlashcardsPage() {
  const { user, profile } = useAuth();
  const { notes, decks, saveDeck, removeDeck, logActivity } = useData();
  const { health, loading: healthLoading, refresh } = useAiHealth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState(profile?.preferences.subjects[0] ?? 'science');
  const [count, setCount] = useState(8);
  const [noteId, setNoteId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FlashcardDeck | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [practiceDeck, setPracticeDeck] = useState<FlashcardDeck | null>(null);
  const [practiceOrder, setPracticeOrder] = useState<number[]>([]);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState<Set<number>>(new Set());

  useEffect(() => {
    const presetNoteId = searchParams.get('note');
    if (!presetNoteId) return;
    const note = notes.find((item) => item.id === presetNoteId);
    if (!note) return;
    setNoteId(note.id);
    setTopic(note.topic || note.title);
    if (note.subjectId) setSubject(note.subjectId);
  }, [notes, searchParams]);

  const selectedNote = useMemo(() => notes.find((note) => note.id === noteId) ?? null, [noteId, notes]);

  async function generate() {
    if (!user) return;
    if (!topic.trim()) {
      setError('Enter a topic, or choose one of your notes to base the cards on.');
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const generated = await generateFlashcardsViaApi({
        topic: topic.trim(),
        subject: getSubject(subject)?.name ?? subject,
        grade: profile?.preferences.grade ?? '10',
        count,
        notes: selectedNote?.content.slice(0, 8000),
      });
      const deck: FlashcardDeck = {
        id: makeId('deck'),
        ownerId: user.uid,
        title: generated.title,
        subjectId: subject,
        topic: topic.trim(),
        cards: generated.cards.map((card, index) => ({ ...card, id: card.id || `c${index + 1}` })),
        source: selectedNote ? 'student' : 'ai',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveDeck(deck);
      logActivity('flashcard', `Flashcards: ${deck.title}`, { subjectId: subject });
      toast(`Deck created with ${deck.cards.length} cards`, 'success');
      startPractice(deck);
    } catch (generationError) {
      setError((generationError as Error).message || 'The flashcards could not be generated.');
    } finally {
      setGenerating(false);
    }
  }

  function startPractice(deck: FlashcardDeck) {
    setPracticeDeck(deck);
    setPracticeOrder(deck.cards.map((_, index) => index));
    setPracticeIndex(0);
    setRevealed(false);
    setReviewed(new Set());
  }

  function shuffle() {
    if (!practiceDeck) return;
    const order = practiceDeck.cards.map((_, index) => index);
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    setPracticeOrder(order);
    setPracticeIndex(0);
    setRevealed(false);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removeDeck(deleteTarget.id);
      toast('Deck deleted', 'success');
      setDeleteTarget(null);
    } catch {
      toast('Could not delete the deck.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  const currentCardIndex = practiceOrder[practiceIndex];
  const currentCard = practiceDeck?.cards[currentCardIndex];

  return (
    <>
      <Seo title="Flashcards" description="Generate and practise flashcards." path="/app/flashcards" noindex />
      <PageHeading
        eyebrow="Revision"
        title="Flashcards"
        description="Turn a topic or one of your notes into cards, then practise with simple reveal-and-check."
      />

      <AiStatusBanner health={health} loading={healthLoading} onRetry={refresh} />

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader title="Create a deck" description="Cards are AI-generated from your topic or notes." icon={<Sparkles className="h-4 w-4" />} />
          <CardBody>
            <div className="space-y-4">
              {error && <InlineAlert tone="danger">{error}</InlineAlert>}

              <Input
                label="Topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="e.g. Human digestive system"
                maxLength={160}
              />

              <div>
                <label className="label" htmlFor="base-note">
                  Base on one of your notes <span className="font-normal text-muted">(optional)</span>
                </label>
                <select
                  id="base-note"
                  className="input"
                  value={noteId}
                  onChange={(event) => {
                    const value = event.target.value;
                    setNoteId(value);
                    const note = notes.find((item) => item.id === value);
                    if (note) {
                      setTopic(note.topic || note.title);
                      if (note.subjectId) setSubject(note.subjectId);
                    }
                  }}
                >
                  <option value="">No note — use the topic only</option>
                  {notes.map((note) => (
                    <option key={note.id} value={note.id}>
                      {note.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Select label="Subject" value={subject} onChange={(event) => setSubject(event.target.value)}>
                  {SUBJECTS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
                <Select label="Number of cards" value={count} onChange={(event) => setCount(Number(event.target.value))}>
                  {[4, 6, 8, 10, 12, 16, 20].map((value) => (
                    <option key={value} value={value}>
                      {value} cards
                    </option>
                  ))}
                </Select>
              </div>

              {selectedNote && (
                <p className="rounded-lg px-3 py-2 text-[11px] leading-relaxed" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
                  Cards will be based on “{selectedNote.title}”. Only the note content is sent to the AI provider.
                </p>
              )}

              <Button
                fullWidth
                onClick={generate}
                loading={generating}
                disabled={!health?.configured}
                icon={<Layers className="h-4 w-4" />}
              >
                {generating ? 'Writing cards…' : 'Generate flashcards'}
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Your decks" description={`${decks.length} saved deck${decks.length === 1 ? '' : 's'}`} icon={<Layers className="h-4 w-4" />} />
          <CardBody>
            {decks.length === 0 ? (
              <EmptyState
                icon={<Layers className="h-6 w-6" />}
                title="No flashcard decks yet"
                description="Create a deck from a topic or a saved note to start revising."
              />
            ) : (
              <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {decks.map((deck) => (
                  <li key={deck.id} className="flex items-center justify-between gap-2 py-3 first:pt-0">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                        {deck.title}
                      </p>
                      <p className="truncate text-[11px] text-muted">
                        {deck.cards.length} cards · {getSubject(deck.subjectId ?? '')?.name ?? 'General'} · {formatRelative(deck.updatedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button size="sm" variant="secondary" onClick={() => startPractice(deck)}>
                        Practise
                      </Button>
                      <button
                        type="button"
                        className="btn-icon !h-8 !w-8"
                        onClick={() => setDeleteTarget(deck)}
                        aria-label={`Delete ${deck.title}`}
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

      <p className="mt-4 text-center text-[11px] text-muted">
        AI-generated cards can contain mistakes. Check definitions against your textbook before an exam.
      </p>

      {/* Practice overlay */}
      {practiceDeck && currentCard && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--bg)' }} role="dialog" aria-modal="true" aria-label={`Practising ${practiceDeck.title}`}>
          <header className="flex items-center justify-between gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" style={{ color: 'var(--text)' }}>
                {practiceDeck.title}
              </p>
              <p className="text-[11px] text-muted">
                Card {practiceIndex + 1} of {practiceOrder.length} · {reviewed.size} reviewed
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" className="btn-icon" onClick={shuffle} aria-label="Shuffle cards" title="Shuffle">
                <Shuffle className="h-4 w-4" />
              </button>
              <button type="button" className="btn-icon" onClick={() => setPracticeDeck(null)} aria-label="Close practice">
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-6">
            <ProgressBar value={practiceIndex + 1} max={practiceOrder.length} className="mb-5" />

            <button
              type="button"
              onClick={() => {
                setRevealed((value) => !value);
                setReviewed((current) => new Set(current).add(currentCardIndex));
              }}
              className="card flex min-h-[16rem] w-full flex-col items-center justify-center gap-4 p-6 text-center transition-shadow hover:shadow-lift"
              aria-live="polite"
            >
              <span className="badge badge-neutral">{revealed ? 'Answer' : 'Question'}</span>
              <p className="text-lg font-semibold leading-relaxed" style={{ color: 'var(--text)' }}>
                {revealed ? currentCard.back : currentCard.front}
              </p>
              {!revealed && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Tap to reveal the answer
                </span>
              )}
            </button>

            <div className="mt-5 flex items-center justify-between gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setPracticeIndex((value) => Math.max(0, value - 1));
                  setRevealed(false);
                }}
                disabled={practiceIndex === 0}
                icon={<ChevronLeft className="h-4 w-4" />}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setPracticeIndex(0);
                  setRevealed(false);
                  setReviewed(new Set());
                }}
                icon={<ArrowLeft className="h-4 w-4" />}
              >
                Restart
              </Button>
              {practiceIndex < practiceOrder.length - 1 ? (
                <Button
                  onClick={() => {
                    setPracticeIndex((value) => value + 1);
                    setRevealed(false);
                  }}
                  iconRight={<ArrowRight className="h-4 w-4" />}
                >
                  Next card
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    toast('Deck reviewed. Nice work!', 'success');
                    setPracticeDeck(null);
                  }}
                >
                  Finish
                </Button>
              )}
            </div>

            <p className="mt-6 text-center text-[11px] text-muted">
              Flashcards are a recall aid. They do not prove mastery on their own — practise questions too.
            </p>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this deck?"
        description={`“${deleteTarget?.title ?? ''}” and its cards will be permanently deleted.`}
        confirmLabel="Delete deck"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

    </>
  );
}
