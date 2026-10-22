import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  BookmarkPlus,
  Check,
  Copy,
  History,
  MessageSquarePlus,
  Pencil,
  RefreshCw,
  Send,
  Sparkles,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Markdown } from '@/components/markdown/Markdown';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { ErrorState, InlineAlert, Spinner } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { AiStatusBanner } from '@/components/app/AiStatusBanner';
import { useAuth } from '@/features/auth/AuthProvider';
import { useData } from '@/features/data/DataProvider';
import { useAiHealth } from '@/hooks/useAiHealth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { sendTutorMessage } from '@/services/ai/client';
import { noteFromAi } from '@/lib/notes';
import { cn, makeId } from '@/lib/utils';
import { formatRelative, truncate } from '@/lib/format';
import { subjectLabel } from '@shared/labels';
import type { TutorModeId } from '@shared/constants';
import { TUTOR_MODES, getSubject } from '@/config/curriculum';
import type { ChatMessage, Conversation } from '@/types/domain';

interface UiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  notice?: string;
  pending?: boolean;
}

const QUICK_PROMPTS = [
  { title: 'Explain a concept', prompt: 'Explain photosynthesis in simple words, with one everyday example.' },
  { title: 'Work through maths', prompt: 'Show me step by step how to solve 2x + 5 = 17, and explain why each step works.' },
  { title: 'Revise for an exam', prompt: 'Help me revise the difference between mass and weight for my science exam.' },
  { title: 'Practise questions', prompt: 'Give me 3 practice questions on fractions for my grade, one at a time.' },
];

const VALID_MODES = new Set(TUTOR_MODES.map((mode) => mode.id));

function resolveMode(value: string | null): TutorModeId {
  return value && VALID_MODES.has(value as TutorModeId) ? (value as TutorModeId) : 'explain-simply';
}

export default function TutorPage() {
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const {
    conversations,
    createConversation,
    updateConversation,
    removeConversation,
    loadConversationMessages,
    appendMessage,
    saveNote,
    logActivity,
  } = useData();
  const { toast } = useToast();
  const { health, loading: healthLoading, refresh: refreshHealth } = useAiHealth();
  const online = useOnlineStatus();

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Conversation | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [mode, setMode] = useState<TutorModeId>(() => resolveMode(searchParams.get('mode')));
  const [subjectId, setSubjectId] = useState<string | null>(searchParams.get('subject'));

  const abortRef = useRef<AbortController | null>(null);
  /**
   * A conversation created by sending the first message is already fully in
   * React state. Without this flag the route change to /app/tutor/:id would
   * re-run the loader and wipe the optimistic message that is being streamed.
   */
  const justCreatedConversation = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === conversationId) ?? null,
    [conversations, conversationId],
  );

  const preferences = profile?.preferences;
  const availableSubjects = useMemo(
    () =>
      (preferences?.subjects ?? [])
        .map((id) => getSubject(id))
        .filter((subject): subject is NonNullable<typeof subject> => Boolean(subject)),
    [preferences?.subjects],
  );

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setNotice(null);

    if (!conversationId) {
      setMessages([]);
      setMode(resolveMode(searchParams.get('mode')));
      return;
    }

    if (justCreatedConversation.current === conversationId) {
      justCreatedConversation.current = null;
      return;
    }

    setLoadingMessages(true);
    setLoadError(null);
    loadConversationMessages(conversationId)
      .then((loaded) => {
        if (cancelled) return;
        setMessages(
          loaded.map((message) => ({ id: message.id, role: message.role, content: message.content, notice: message.notice })),
        );
      })
      .catch((loadFailure) => {
        if (cancelled) return;
        setLoadError(
          (loadFailure as { code?: string }).code === 'permission-denied'
            ? 'This conversation could not be opened. It may belong to a different account.'
            : 'Your conversation could not be loaded. Check your connection and try again.',
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, loadConversationMessages]);

  useEffect(() => {
    if (activeConversation) {
      setMode(activeConversation.mode as TutorModeId);
      setSubjectId(activeConversation.subjectId);
    }
  }, [activeConversation]);

  useEffect(() => {
    if (messages.length) bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  useEffect(() => {
    if (sending) bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, sending]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 170)}px`;
    }
  }, [input]);

  const ensureConversation = useCallback(
    async (firstMessage: string): Promise<Conversation> => {
      if (activeConversation) return activeConversation;
      const conversation = await createConversation({
        title: truncate(firstMessage.replace(/\s+/g, ' ').trim(), 56) || 'New conversation',
        mode,
        subjectId: subjectId ?? preferences?.subjects[0] ?? null,
      });
      justCreatedConversation.current = conversation.id;
      navigate(`/app/tutor/${conversation.id}`, { replace: true });
      return conversation;
    },
    [activeConversation, createConversation, mode, navigate, preferences?.subjects, subjectId],
  );

  /**
   * Streams an assistant reply into `assistantId`. The placeholder must
   * already exist in `messages`.
   */
  const generate = useCallback(
    async (conversation: Conversation, history: UiMessage[], assistantId: string) => {
      if (!user) return;
      const controller = new AbortController();
      abortRef.current = controller;
      setSending(true);
      setError(null);
      setNotice(null);

      let accumulated = '';
      let frame: number | null = null;
      let pendingChunk = '';

      const flush = () => {
        frame = null;
        if (!pendingChunk) return;
        const chunk = pendingChunk;
        pendingChunk = '';
        accumulated += chunk;
        setMessages((current) =>
          current.map((message) => (message.id === assistantId ? { ...message, content: message.content + chunk } : message)),
        );
        bottomRef.current?.scrollIntoView({ block: 'end' });
      };

      const payload = history
        .filter((message) => message.content.trim() && !message.pending)
        .map((message) => ({ role: message.role, content: message.content }));

      try {
        const result = await sendTutorMessage({
          mode: conversation.mode as TutorModeId,
          messages: payload,
          context: {
            grade: preferences?.grade ?? '10',
            curriculum: preferences?.curriculum ?? 'nepal-national',
            language: preferences?.language ?? 'en',
            subjects: preferences?.subjects ?? [],
            explanationStyle: preferences?.explanationStyle ?? 'simple',
            country: preferences?.country ?? 'NP',
            studentName: profile?.displayName,
          },
          subjectId: conversation.subjectId,
          signal: controller.signal,
          onDelta: (text) => {
            pendingChunk += text;
            if (frame === null) frame = requestAnimationFrame(flush);
          },
          onNotice: (text) => setNotice(text),
        });

        if (frame !== null) cancelAnimationFrame(frame);
        flush();
        const finalText = result.text || accumulated;

        await appendMessage({
          id: assistantId,
          conversationId: conversation.id,
          ownerId: user.uid,
          role: 'assistant',
          content: finalText,
          mode: conversation.mode,
          createdAt: new Date().toISOString(),
          notice: result.notice,
        });

        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId ? { ...message, content: finalText, pending: false, notice: result.notice } : message,
          ),
        );

        await updateConversation({
          ...conversation,
          preview: finalText.slice(0, 140),
          messageCount: history.length + 1,
          updatedAt: new Date().toISOString(),
        });
        logActivity('tutor', `Tutor: ${conversation.title}`, { subjectId: conversation.subjectId });
      } catch (requestError) {
        if (frame !== null) cancelAnimationFrame(frame);
        flush();

        if ((requestError as Error).name === 'AbortError') {
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId
                ? { ...message, pending: false, notice: 'Stopped. You can ask again or continue from here.' }
                : message,
            ),
          );
          if (accumulated.trim()) {
            await appendMessage({
              id: assistantId,
              conversationId: conversation.id,
              ownerId: user.uid,
              role: 'assistant',
              content: accumulated,
              mode: conversation.mode,
              createdAt: new Date().toISOString(),
              notice: 'Stopped by the student.',
            }).catch(() => undefined);
          }
          setNotice('Response stopped.');
        } else {
          const message = (requestError as Error).message || 'The AI service is unavailable right now.';
          setError(message);
          setMessages((current) =>
            current
              .map((item) =>
                item.id === assistantId
                  ? { ...item, pending: false, notice: accumulated.trim() ? 'The response stopped early.' : undefined }
                  : item,
              )
              .filter((item) => !(item.id === assistantId && !item.content.trim())),
          );
          if (accumulated.trim()) {
            await appendMessage({
              id: assistantId,
              conversationId: conversation.id,
              ownerId: user.uid,
              role: 'assistant',
              content: accumulated,
              mode: conversation.mode,
              createdAt: new Date().toISOString(),
              notice: 'The response stopped early.',
            }).catch(() => undefined);
          }
        }
      } finally {
        abortRef.current = null;
        setSending(false);
      }
    },
    [appendMessage, logActivity, preferences, profile?.displayName, updateConversation, user],
  );

  const handleSend = useCallback(
    async (rawText?: string) => {
      const text = (rawText ?? input).trim();
      if (!text || sending || !user) return;
      if (!online) {
        setError('You are offline. AI tutoring needs an internet connection.');
        return;
      }

      setInput('');
      setError(null);
      setNotice(null);
      const userMessageId = makeId('msg');
      const assistantId = makeId('msg');
      const now = new Date().toISOString();

      try {
        const conversation = await ensureConversation(text);
        const userMessage: ChatMessage = {
          id: userMessageId,
          conversationId: conversation.id,
          ownerId: user.uid,
          role: 'user',
          content: text,
          mode: conversation.mode,
          createdAt: now,
        };

        const history: UiMessage[] = [...messages, { id: userMessageId, role: 'user', content: text }];
        setMessages([...history, { id: assistantId, role: 'assistant', content: '', pending: true }]);
        await appendMessage(userMessage);
        await updateConversation({ ...conversation, preview: text.slice(0, 140), updatedAt: now });

        await generate(conversation, history, assistantId);
      } catch (sendError) {
        setError((sendError as Error).message || 'Your message could not be sent. Please try again.');
        setMessages((current) => current.filter((message) => message.id !== assistantId));
        setInput(text);
      }
    },
    [appendMessage, ensureConversation, generate, input, messages, online, sending, updateConversation, user],
  );

  const retryLast = useCallback(async () => {
    if (sending || !messages.length) return;
    const lastUser = [...messages].reverse().find((message) => message.role === 'user');
    if (!lastUser) return;

    const conversation = activeConversation ?? (await ensureConversation(lastUser.content));
    const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant');
    const history = messages.filter((message) => message.id !== lastAssistant?.id);
    const assistantId = lastAssistant?.id ?? makeId('msg');
    setMessages([...history, { id: assistantId, role: 'assistant', content: '', pending: true }]);
    await generate(conversation, history, assistantId);
  }, [activeConversation, ensureConversation, generate, messages, sending]);

  const handleRegenerate = useCallback(async () => {
    if (!activeConversation || sending) return;
    const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant');
    if (!lastAssistant) return;
    const index = messages.findIndex((message) => message.id === lastAssistant.id);
    const history = messages.slice(0, index);
    if (!history.some((message) => message.role === 'user')) return;
    setMessages([...history, { id: lastAssistant.id, role: 'assistant', content: '', pending: true }]);
    await generate(activeConversation, history, lastAssistant.id);
  }, [activeConversation, generate, messages, sending]);

  const stopGeneration = () => abortRef.current?.abort();

  async function copyMessage(content: string) {
    try {
      await navigator.clipboard.writeText(content);
      toast('Answer copied to clipboard', 'success');
    } catch {
      toast('Copy failed. Select the text and copy manually.', 'error');
    }
  }

  async function saveAnswerToNotes(message: UiMessage) {
    if (!user) return;
    if (message.content.length > 20000) {
      toast('This answer is too long to save as a note. Copy it instead.', 'error');
      return;
    }
    const firstLine = message.content.split('\n').find((line) => line.trim()) ?? 'Saved explanation';
    const title = firstLine.replace(/^#+\s*/, '').replace(/[*_`]/g, '').slice(0, 100) || 'Saved explanation';
    try {
      await saveNote(
        noteFromAi({
          ownerId: user.uid,
          id: makeId('note'),
          title,
          content: message.content,
          subjectId: activeConversation?.subjectId ?? null,
          topic: activeConversation?.title ?? '',
        }),
      );
      toast('Saved to your notes', 'success');
    } catch (saveError) {
      toast((saveError as Error).message || 'Could not save the note.', 'error');
    }
  }

  const startNewChat = () => {
    abortRef.current?.abort();
    navigate('/app/tutor');
    setMessages([]);
    setError(null);
    setNotice(null);
    setInput('');
    setActiveMode('explain-simply');
    textareaRef.current?.focus();
  };

  const setActiveMode = (next: TutorModeId) => {
    setMode(next);
    if (activeConversation) void updateConversation({ ...activeConversation, mode: next });
  };

  const submitRename = async () => {
    if (!renameTarget) return;
    const value = renameValue.trim();
    if (!value) return;
    await updateConversation({ ...renameTarget, title: value.slice(0, 160), updatedAt: new Date().toISOString() });
    setRenameTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removeConversation(deleteTarget.id);
      if (deleteTarget.id === conversationId) navigate('/app/tutor', { replace: true });
      toast('Conversation deleted', 'success');
      setDeleteTarget(null);
    } catch {
      toast('Could not delete the conversation.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const modeConfig = TUTOR_MODES.find((item) => item.id === mode) ?? TUTOR_MODES[0];

  const historyList = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Conversations</p>
        <button type="button" className="btn-icon !h-8 !w-8" onClick={startNewChat} aria-label="New conversation">
          <MessageSquarePlus className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin px-2 pb-3">
        {conversations.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted">Your conversations will appear here.</p>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <div
                  className={cn(
                    'group flex items-center gap-1 rounded-lg pr-1',
                    conversation.id === conversationId ? 'bg-[color:var(--primary-soft)]' : 'hover:bg-[color:var(--surface-2)]',
                  )}
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 px-2.5 py-2 text-left"
                    onClick={() => {
                      navigate(`/app/tutor/${conversation.id}`);
                      setShowHistory(false);
                    }}
                    aria-current={conversation.id === conversationId ? 'page' : undefined}
                  >
                    <span
                      className="block truncate text-[13px] font-medium"
                      style={{ color: conversation.id === conversationId ? 'var(--primary)' : 'var(--text)' }}
                    >
                      {conversation.title}
                    </span>
                    <span className="block truncate text-[11px] text-muted">
                      {formatRelative(conversation.updatedAt)} · {conversation.messageCount} messages
                    </span>
                  </button>
                  <div className="flex shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <button
                      type="button"
                      className="btn-icon !h-7 !w-7"
                      aria-label={`Rename ${conversation.title}`}
                      onClick={() => {
                        setRenameTarget(conversation);
                        setRenameValue(conversation.title);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="btn-icon !h-7 !w-7"
                      aria-label={`Delete ${conversation.title}`}
                      onClick={() => setDeleteTarget(conversation)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Seo title="AI Tutor" description="Ask your Ujyalo Learn AI tutor a question." path="/app/tutor" noindex />
      <div className="flex h-[calc(100dvh-8.5rem)] min-h-[520px] gap-3 lg:h-[calc(100dvh-7.5rem)]">
        <aside
          className="hidden w-64 shrink-0 flex-col overflow-hidden rounded-xl border lg:flex"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <div className="border-b px-3 py-3" style={{ borderColor: 'var(--border)' }}>
            <Button fullWidth size="sm" icon={<MessageSquarePlus className="h-4 w-4" />} onClick={startNewChat}>
              New chat
            </Button>
          </div>
          {historyList}
        </aside>

        <section
          className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <header className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2.5" style={{ borderColor: 'var(--border)' }}>
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                className="btn-icon lg:hidden"
                onClick={() => setShowHistory(true)}
                aria-label="Open conversation history"
              >
                <History className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  {activeConversation?.title ?? 'New conversation'}
                </p>
                <p className="truncate text-[11px] text-muted">
                  {subjectId ? subjectLabel(subjectId) : 'All subjects'} · {modeConfig.label}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <label className="sr-only" htmlFor="tutor-mode">
                Tutoring mode
              </label>
              <select
                id="tutor-mode"
                className="input !min-h-9 !w-auto !max-w-[11rem] !py-1.5 !text-[12px]"
                value={mode}
                onChange={(event) => setActiveMode(event.target.value as TutorModeId)}
              >
                {TUTOR_MODES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <Button
                variant="secondary"
                size="sm"
                className="hidden sm:inline-flex"
                onClick={startNewChat}
                icon={<MessageSquarePlus className="h-4 w-4" />}
              >
                New
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto scroll-thin px-3 py-4 sm:px-5" style={{ background: 'var(--bg)' }}>
            <div className="mx-auto max-w-3xl">
              <AiStatusBanner health={health} loading={healthLoading} onRetry={refreshHealth} compact />

              {!online && (
                <div className="mb-3">
                  <InlineAlert tone="warning">You are offline. AI tutoring needs an internet connection.</InlineAlert>
                </div>
              )}

              {loadError ? (
                <ErrorState
                  title="Could not open this conversation"
                  message={loadError}
                  onRetry={() => navigate('/app/tutor')}
                  retryLabel="Back to tutor"
                />
              ) : loadingMessages ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
                  <Spinner /> Loading conversation…
                </div>
              ) : messages.length === 0 ? (
                <div className="py-6">
                  <div className="text-center">
                    <span
                      className="inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                    >
                      <Sparkles className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <h2 className="mt-3 text-lg font-bold" style={{ color: 'var(--text)' }}>
                      Ask anything you are studying
                    </h2>
                    <p className="mx-auto mt-1 max-w-md text-sm text-muted">
                      {preferences?.grade
                        ? `Explanations follow your profile: Grade ${preferences.grade}, ${subjectId ? subjectLabel(subjectId) : 'all subjects'}.`
                        : 'Your tutor adapts to the preferences in your profile.'}
                    </p>
                  </div>
                  <div className="mt-6 grid gap-2 sm:grid-cols-2">
                    {QUICK_PROMPTS.map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => void handleSend(item.prompt)}
                        className="card card-hover p-3.5 text-left"
                      >
                        <span className="block text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted">{item.prompt}</span>
                      </button>
                    ))}
                  </div>
                  {availableSubjects.length > 0 && (
                    <div className="mt-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Subject focus</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSubjectId(null)}
                          className={cn('chip !py-1 !text-[12px]', !subjectId && 'chip-active')}
                        >
                          All
                        </button>
                        {availableSubjects.map((subject) => (
                          <button
                            key={subject.id}
                            type="button"
                            onClick={() => setSubjectId(subject.id)}
                            className={cn('chip !py-1 !text-[12px]', subjectId === subject.id && 'chip-active')}
                          >
                            {subject.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) =>
                    message.role === 'user' ? (
                      <div key={message.id} className="flex justify-end">
                        <div
                          className="max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-br-md px-3.5 py-2.5 text-[14px] leading-relaxed"
                          style={{ background: 'var(--primary)', color: 'var(--primary-contrast)' }}
                        >
                          {message.content}
                        </div>
                      </div>
                    ) : (
                      <div key={message.id} className="flex gap-2.5">
                        <span
                          className="mt-0.5 hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:inline-flex"
                          style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                          aria-hidden="true"
                        >
                          <Sparkles className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div
                            className="rounded-2xl rounded-tl-md border px-3.5 py-3"
                            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                          >
                            {message.pending && !message.content ? (
                              <div className="flex items-center gap-2 py-1 text-sm text-muted" aria-live="polite">
                                <span className="flex gap-1" aria-hidden="true">
                                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full" style={{ background: 'var(--primary)' }} />
                                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full [animation-delay:150ms]" style={{ background: 'var(--primary)' }} />
                                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full [animation-delay:300ms]" style={{ background: 'var(--primary)' }} />
                                </span>
                                Thinking…
                              </div>
                            ) : (
                              <>
                                <Markdown content={message.content} streaming={message.pending} />
                                {message.pending && (
                                  <span
                                    className="ml-0.5 inline-block h-4 w-[2px] animate-pulse-soft align-middle"
                                    style={{ background: 'var(--primary)' }}
                                    aria-hidden="true"
                                  />
                                )}
                              </>
                            )}
                            {message.notice && <p className="mt-2 text-[11px] italic text-muted">{message.notice}</p>}
                          </div>

                          {!message.pending && message.content && (
                            <div className="mt-1.5 flex flex-wrap items-center gap-1">
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm !px-2 !text-[11px]"
                                onClick={() => copyMessage(message.content)}
                              >
                                <Copy className="h-3.5 w-3.5" /> Copy
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm !px-2 !text-[11px]"
                                onClick={() => saveAnswerToNotes(message)}
                              >
                                <BookmarkPlus className="h-3.5 w-3.5" /> Save to notes
                              </button>
                              {message.id === messages[messages.length - 1]?.id && (
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm !px-2 !text-[11px]"
                                  onClick={handleRegenerate}
                                  disabled={sending}
                                >
                                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                                </button>
                              )}
                              <span className="badge badge-neutral !text-[10px]">AI-generated</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ),
                  )}

                  {notice && <p className="text-center text-[11px] text-muted">{notice}</p>}

                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border px-3.5 py-3 text-sm"
                      style={{
                        borderColor: 'color-mix(in srgb, var(--danger) 40%, transparent)',
                        background: 'var(--danger-soft)',
                        color: 'var(--danger)',
                      }}
                    >
                      <p className="font-medium">{error}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={retryLast} icon={<RefreshCw className="h-3.5 w-3.5" />}>
                          Try again
                        </Button>
                        <Button size="sm" variant="ghost" onClick={refreshHealth}>
                          Check AI status
                        </Button>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>
          </div>

          <div className="border-t px-3 py-2.5 sm:px-4" style={{ borderColor: 'var(--border)' }}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSend();
              }}
              className="mx-auto max-w-3xl"
            >
              <div
                className="flex items-end gap-2 rounded-xl border p-1.5 focus-within:ring-2"
                style={{ borderColor: 'var(--border-strong)', background: 'var(--surface)' }}
              >
                <label htmlFor="tutor-input" className="sr-only">
                  Your question
                </label>
                <textarea
                  id="tutor-input"
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder="Ask your question… (Enter to send, Shift+Enter for a new line)"
                  className="max-h-[170px] min-h-[2.5rem] flex-1 resize-none bg-transparent px-2.5 py-2 text-sm outline-none"
                  style={{ color: 'var(--text)' }}
                  aria-describedby="tutor-input-hint"
                />
                {sending ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={stopGeneration}
                    icon={<Square className="h-3.5 w-3.5" />}
                    aria-label="Stop generating"
                  >
                    Stop
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!input.trim() || !online}
                    aria-label="Send message"
                    icon={<Send className="h-4 w-4" />}
                  >
                    Send
                  </Button>
                )}
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <p id="tutor-input-hint" className="text-[10px] text-muted">
                  AI can make mistakes. Check important facts with your textbook or teacher.
                </p>
                <p className="hidden text-[10px] text-muted sm:block">{modeConfig.description}</p>
              </div>
            </form>
          </div>
        </section>
      </div>

      {showHistory && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[rgba(4,10,24,0.5)]" onClick={() => setShowHistory(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 flex w-[84%] max-w-xs flex-col" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between border-b px-3 py-2.5" style={{ borderColor: 'var(--border)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                Conversations
              </p>
              <button type="button" className="btn-icon" onClick={() => setShowHistory(false)} aria-label="Close history">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scroll-thin">{historyList}</div>
          </div>
        </div>
      )}

      <Modal
        open={Boolean(renameTarget)}
        onClose={() => setRenameTarget(null)}
        title="Rename conversation"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button onClick={submitRename} disabled={!renameValue.trim()} icon={<Check className="h-4 w-4" />}>
              Save
            </Button>
          </>
        }
      >
        <label className="label" htmlFor="rename-input">
          Conversation title
        </label>
        <input
          id="rename-input"
          className="input"
          value={renameValue}
          maxLength={160}
          onChange={(event) => setRenameValue(event.target.value)}
          autoFocus
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this conversation?"
        description="The conversation and all of its messages will be permanently deleted. This cannot be undone."
        confirmLabel="Delete conversation"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
