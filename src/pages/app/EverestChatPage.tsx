import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Settings, Download, Trash2, Code, BookOpen, PenLine } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { EverestSidebar } from '@/components/everest/EverestSidebar';
import { EverestMessage } from '@/components/everest/EverestMessage';
import { EverestComposer } from '@/components/everest/EverestComposer';
import { EverestModelPicker } from '@/components/everest/EverestModelPicker';
import { useEverestChat, type EverestMessage as Message } from '@/hooks/useEverestChat';
import { useEverestHealth } from '@/hooks/useEverestHealth';
import { useAuth } from '@/features/auth/AuthProvider';
import { sendEverestMessage } from '@/services/ai/everestClient';
import { EVEREST_QUICK_PROMPTS, getEverestPersona } from '@/config/everest';
import { Button } from '@/components/ui/Button';
import { InlineAlert } from '@/components/ui/Feedback';
import { makeId } from '@/lib/utils';

export default function EverestChatPage() {
  const { user } = useAuth();
  const { health, configured } = useEverestHealth();
  const chat = useEverestChat(user?.uid ?? null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [model, setModel] = useState('openai/gpt-oss-120b');
  const [persona, setPersona] = useState('default');
  const [customSystem, setCustomSystem] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chat.activeConversation) {
      setModel(chat.activeConversation.model);
      setPersona(chat.activeConversation.persona);
    }
  }, [chat.activeConversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chat.messages, sending]);

  const ensureConversation = useCallback(() => {
    if (chat.activeId && chat.activeConversation) return chat.activeConversation;
    return chat.createConversation({ title: 'New chat', model, persona });
  }, [chat, model, persona]);

  const doSend = useCallback(async (contentOverride?: string, regenerateId?: string) => {
    const text = (contentOverride ?? input).trim();
    if (!text || sending) return;
    setInput('');

    const conv = ensureConversation();
    const personaMeta = getEverestPersona(persona);

    // If regenerating, remove last assistant message
    let history: Message[] = chat.messages;
    if (regenerateId) {
      const idx = history.findIndex((m) => m.id === regenerateId);
      if (idx !== -1) history = history.slice(0, idx);
      // update storage immediately
      chat.replaceMessages(conv.id, history);
    }

    const userMsg: Message = {
      id: makeId('msg'),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      persona,
      model,
    };

    const assistantId = makeId('msg');
    const assistantPlaceholder: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      model,
      persona,
    };

    const newHistory = [...history, userMsg, assistantPlaceholder];
    chat.replaceMessages(conv.id, newHistory);
    chat.appendMessage(conv.id, userMsg); // will dupe? we use replace for history, so just track via replace
    // Actually replaceMessages already wrote; we don't need append. But to keep updated title/preview, we already have replace.
    // We'll directly start streaming and keep placeholder in UI via streaming state

    // Instead, we manage messages via local state for streaming, then persist at end
    // For simplicity, use chat.messages as UI source but stream into placeholder
    setSending(true);
    setStreamingId(assistantId);

    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = '';
    let frame: number | null = null;
    let pending = '';

    const flush = () => {
      frame = null;
      if (!pending) return;
      const chunk = pending;
      pending = '';
      accumulated += chunk;
      // update message content live
      const msgs = JSON.parse(localStorage.getItem(`everest:${user?.uid ?? 'anon'}:messages:${conv.id}`) ?? '[]') as Message[];
      const updated = msgs.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m));
      localStorage.setItem(`everest:${user?.uid ?? 'anon'}:messages:${conv.id}`, JSON.stringify(updated));
      chat.replaceMessages(conv.id, updated);
    };

    const payload = newHistory
      .filter((m) => m.content.trim())
      .slice(-14)
      .map((m) => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content }));

    // Prepend persona system if not default? Backend will handle persona, but we also send system for clarity
    if (persona !== 'default') {
      payload.unshift({ role: 'system', content: personaMeta.system });
    }

    try {
      const result = await sendEverestMessage({
        messages: payload,
        model,
        persona,
        systemPrompt: customSystem || undefined,
        signal: controller.signal,
        onDelta: (delta) => {
          pending += delta;
          if (frame === null) frame = requestAnimationFrame(flush);
        },
      });
      if (frame !== null) cancelAnimationFrame(frame);
      flush();
      const finalText = result.text || accumulated;
      // Persist final
      const msgs = JSON.parse(localStorage.getItem(`everest:${user?.uid ?? 'anon'}:messages:${conv.id}`) ?? '[]') as Message[];
      const finalMsgs = msgs.map((m) => (m.id === assistantId ? { ...m, content: finalText } : m));
      localStorage.setItem(`everest:${user?.uid ?? 'anon'}:messages:${conv.id}`, JSON.stringify(finalMsgs));
      chat.replaceMessages(conv.id, finalMsgs);
      // update conv meta
      chat.updateConversation(conv.id, {
        title: conv.title === 'New chat' ? text.slice(0, 48) : conv.title,
        preview: finalText.slice(0, 80),
        model,
        persona,
      });
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // keep partial
        const msgs = JSON.parse(localStorage.getItem(`everest:${user?.uid ?? 'anon'}:messages:${conv.id}`) ?? '[]') as Message[];
        const updated = msgs.map((m) => (m.id === assistantId ? { ...m, content: m.content || accumulated || 'Stopped.' , notice: 'Stopped by user.' } : m));
        localStorage.setItem(`everest:${user?.uid ?? 'anon'}:messages:${conv.id}`, JSON.stringify(updated));
        chat.replaceMessages(conv.id, updated);
      } else {
        const messageText = (error as Error & { code?: string }).message ?? 'Failed to get response.';
        const msgs = JSON.parse(localStorage.getItem(`everest:${user?.uid ?? 'anon'}:messages:${conv.id}`) ?? '[]') as Message[];
        const updated = msgs.map((m) => (m.id === assistantId ? { ...m, content: `⚠️ ${messageText}` } : m));
        localStorage.setItem(`everest:${user?.uid ?? 'anon'}:messages:${conv.id}`, JSON.stringify(updated));
        chat.replaceMessages(conv.id, updated);
      }
    } finally {
      setSending(false);
      setStreamingId(null);
      abortRef.current = null;
    }
  }, [input, sending, ensureConversation, chat, model, persona, customSystem, user]);

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleNewChat = () => {
    const c = chat.createConversation({ model, persona });
    chat.updateConversation(c.id, { title: 'New chat' });
  };

  const handleExport = () => {
    if (!chat.activeId) return;
    const data = {
      conversation: chat.activeConversation,
      messages: chat.messages,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `everest-${chat.activeConversation?.title ?? 'chat'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Seo title="Everest AI — Chat with Groq-powered assistant | Ujyalo Learn" description="Everest AI by Ujyalo Learn — ultra-fast Groq inference, ChatGPT & Gemini-like features: streaming, code, maths, Nepali & English." path="/app/everest" />

      <div className="flex h-[calc(100dvh-0px)] flex-col lg:h-[calc(100dvh-0px)]" style={{ background: 'var(--bg)' }}>
        {/* Top bar */}
        <div className="flex h-14 shrink-0 items-center gap-2 border-b px-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <button onClick={() => setSidebarOpen((v) => !v)} className="rounded-xl p-2 hover:bg-black/5 dark:hover:bg-white/10 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden items-center gap-2 lg:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#15245F] to-[#2947D6] text-sm font-bold text-white">🏔️</div>
            <span className="text-sm font-semibold">Everest AI</span>
            <span className="rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--primary)]">GROQ</span>
          </div>
          <div className="flex flex-1 items-center justify-center lg:justify-start lg:pl-4">
            <EverestModelPicker model={model} persona={persona} onModelChange={setModel} onPersonaChange={setPersona} />
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setShowSettings((v) => !v)} icon={<Settings className="h-4 w-4" />}>Settings</Button>
            <Button variant="ghost" size="sm" onClick={handleExport} icon={<Download className="h-4 w-4" />}>Export</Button>
            <Link to="/everest" className="hidden text-xs underline sm:inline" style={{ color: 'var(--muted)' }}>About Everest</Link>
          </div>
        </div>

        {!configured && (
          <div className="px-4 py-2">
            <InlineAlert tone="warning" title="AI not configured">
              Everest AI needs a Groq API key. The site owner should set <code>EVEREST_API_KEY</code> or <code>AI_API_KEY</code> in Vercel env. Local demo works with the key in <code>.env.local</code>.
            </InlineAlert>
          </div>
        )}

        <div className="flex min-h-0 flex-1">
          {/* Sidebar */}
          <div className={`${sidebarOpen ? 'flex' : 'hidden'} lg:flex`}>
            <EverestSidebar
              conversations={chat.conversations}
              grouped={chat.grouped}
              activeId={chat.activeId}
              onSelect={(id) => chat.setActiveId(id)}
              onNew={handleNewChat}
              onDelete={chat.deleteConversation}
              onRename={(id, title) => chat.updateConversation(id, { title })}
              onPin={(id) => {
                const c = chat.conversations.find((x) => x.id === id);
                if (c) chat.updateConversation(id, { pinned: !c.pinned });
              }}
              searchFiltered={chat.searchFiltered}
              collapsed={false}
              onToggleCollapse={() => setSidebarOpen(false)}
            />
          </div>

          {/* Main chat */}
          <div className="flex min-w-0 flex-1 flex-col">
            {showSettings && (
              <div className="border-b p-4" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs font-semibold">Custom instructions</span>
                    <textarea
                      value={customSystem}
                      onChange={(e) => setCustomSystem(e.target.value)}
                      placeholder="e.g., You are a friendly Nepali teacher who uses simple examples..."
                      className="min-h-20 w-full rounded-xl border p-2 text-sm outline-none"
                      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                    />
                    <span className="text-[11px]" style={{ color: 'var(--muted)' }}>Like ChatGPT custom instructions — prepended to every chat.</span>
                  </label>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold">Quick actions</p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm" onClick={() => { if (confirm('Clear all Everest chats?')) chat.clearAll(); }} icon={<Trash2 className="h-4 w-4" />}>Clear all chats</Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>Close</Button>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Model: {health?.model ?? model} • {health?.provider ?? 'groq'}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Storage: localStorage (per browser) • Export to keep backups</p>
                  </div>
                </div>
              </div>
            )}

            <div ref={mainRef} className="scroll-thin flex-1 overflow-y-auto">
              {!chat.activeId || !chat.messages.length ? (
                <div className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center px-4 py-10">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl" style={{ background: 'linear-gradient(135deg,#15245F,#2947D6,#3B61F0)', color: 'white' }}>🏔️</div>
                  <h1 className="mt-4 text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Everest AI</h1>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>Groq ultra-fast • ChatGPT & Gemini features • Nepal-ready</p>
                  <p className="mt-2 max-w-lg text-center text-sm leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                    Ask anything — homework, code, essays, translations, ideas. Everest streams answers at up to 1000 tok/s, understands Nepali & English, and shows code & maths beautifully.
                  </p>
                  <div className="mt-6 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                    {EVEREST_QUICK_PROMPTS.map((p) => (
                      <button
                        key={p.title}
                        onClick={() => { setInput(p.prompt); }}
                        className="rounded-2xl border p-3 text-left hover:bg-[var(--surface-2)]"
                        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                      >
                        <span className="text-sm font-medium">{p.title}</span>
                        <span className="mt-1 block text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{p.prompt}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-8 grid w-full max-w-2xl grid-cols-3 gap-3 text-center">
                    {[
                      { icon: Code, label: 'Write & debug code', sub: 'Python, JS, C, HTML' },
                      { icon: BookOpen, label: 'Explain concepts', sub: 'Step-by-step, with diagrams' },
                      { icon: PenLine, label: 'Essays & emails', sub: 'Preserve your voice' },
                    ].map((f) => (
                      <div key={f.label} className="rounded-2xl border p-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <f.icon className="mx-auto h-5 w-5" style={{ color: 'var(--primary)' }} />
                        <p className="mt-1 text-xs font-semibold">{f.label}</p>
                        <p className="text-[11px]" style={{ color: 'var(--muted)' }}>{f.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
                  {chat.messages.map((m) => (
                    <EverestMessage
                      key={m.id}
                      role={m.role as 'user' | 'assistant'}
                      content={m.content}
                      model={m.model}
                      streaming={streamingId === m.id}
                      onCopy={() => {}}
                      onRegenerate={m.role === 'assistant' ? () => {
                        const idx = chat.messages.findIndex((x) => x.id === m.id);
                        const prevUser = [...chat.messages].slice(0, idx).reverse().find((x) => x.role === 'user');
                        if (prevUser) doSend(prevUser.content, m.id);
                      } : undefined}
                      onEdit={m.role === 'user' ? (newContent) => {
                        const idx = chat.messages.findIndex((x) => x.id === m.id);
                        const newMsgs = chat.messages.slice(0, idx).concat({ ...m, content: newContent });
                        chat.replaceMessages(chat.activeId!, newMsgs);
                        setTimeout(() => doSend(newContent), 0);
                      } : undefined}
                      onDelete={() => {
                        const next = chat.messages.filter((x) => x.id !== m.id);
                        chat.replaceMessages(chat.activeId!, next);
                      }}
                    />
                  ))}
                  {sending && !chat.messages.some((m) => m.id === streamingId) && (
                    <div className="flex gap-3">
                      <div className="h-7 w-7 rounded-full bg-[var(--primary-soft)]" />
                      <div className="rounded-2xl border px-4 py-3 text-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <span className="inline-flex items-center gap-2" style={{ color: 'var(--muted)' }}>
                          <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--primary)]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--primary)] [animation-delay:120ms]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--primary)] [animation-delay:240ms]" />
                          Everest is thinking...
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <div className="border-t p-3 sm:p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="mx-auto max-w-3xl">
                <EverestComposer value={input} onChange={setInput} onSend={() => doSend()} onStop={handleStop} sending={sending} />
                <p className="mt-2 text-center text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  Everest AI can make mistakes. Verify important facts with your teacher or textbook. • <Link to="/privacy" className="underline">Privacy</Link> • <Link to="/terms" className="underline">Terms</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
