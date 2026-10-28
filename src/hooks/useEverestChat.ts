import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { makeId, safeJsonParse } from '@/lib/utils';

export interface EverestMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  persona?: string;
  timestamp: string;
  notice?: string;
}

export interface EverestConversation {
  id: string;
  title: string;
  preview: string;
  model: string;
  persona: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  pinned?: boolean;
}

function storageKey(uid: string | null, key: string) {
  return `everest:${uid ?? 'anon'}:${key}`;
}

function loadConvs(uid: string | null): EverestConversation[] {
  return safeJsonParse<EverestConversation[]>(localStorage.getItem(storageKey(uid, 'conversations')), []);
}

function saveConvs(uid: string | null, convs: EverestConversation[]) {
  localStorage.setItem(storageKey(uid, 'conversations'), JSON.stringify(convs.slice(0, 200)));
}

function loadMessages(convId: string, uid: string | null): EverestMessage[] {
  return safeJsonParse<EverestMessage[]>(localStorage.getItem(storageKey(uid, `messages:${convId}`)), []);
}

function saveMessages(convId: string, uid: string | null, messages: EverestMessage[]) {
  localStorage.setItem(storageKey(uid, `messages:${convId}`), JSON.stringify(messages.slice(-80)));
}

export function useEverestChat(uid: string | null) {
  const [conversations, setConversations] = useState<EverestConversation[]>(() => loadConvs(uid));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<EverestMessage[]>([]);
  const uidRef = useRef(uid);

  useEffect(() => {
    uidRef.current = uid;
    setConversations(loadConvs(uid));
    setActiveId(null);
    setMessages([]);
  }, [uid]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    setMessages(loadMessages(activeId, uid));
  }, [activeId, uid]);

  const createConversation = useCallback((opts: { title?: string; model?: string; persona?: string }) => {
    const now = new Date().toISOString();
    const conv: EverestConversation = {
      id: makeId('ev'),
      title: opts.title?.slice(0, 80) || 'New chat',
      preview: '',
      model: opts.model ?? 'openai/gpt-oss-120b',
      persona: opts.persona ?? 'default',
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
    };
    const next = [conv, ...conversations];
    setConversations(next);
    saveConvs(uidRef.current, next);
    setActiveId(conv.id);
    saveMessages(conv.id, uidRef.current, []);
    return conv;
  }, [conversations]);

  const updateConversation = useCallback((id: string, patch: Partial<EverestConversation>) => {
    setConversations((current) => {
      const next = current.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c))
        .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt.localeCompare(a.updatedAt));
      saveConvs(uidRef.current, next);
      return next;
    });
  }, []);

  const deleteConversation = useCallback((id: string) => {
    const next = conversations.filter((c) => c.id !== id);
    setConversations(next);
    saveConvs(uidRef.current, next);
    localStorage.removeItem(storageKey(uidRef.current, `messages:${id}`));
    if (activeId === id) setActiveId(next[0]?.id ?? null);
  }, [conversations, activeId]);

  const clearAll = useCallback(() => {
    conversations.forEach((c) => localStorage.removeItem(storageKey(uidRef.current, `messages:${c.id}`)));
    setConversations([]);
    saveConvs(uidRef.current, []);
    setActiveId(null);
  }, [conversations]);

  const appendMessage = useCallback((convId: string, message: EverestMessage) => {
    const currentMsgs = loadMessages(convId, uidRef.current);
    const next = [...currentMsgs, message];
    saveMessages(convId, uidRef.current, next);
    if (convId === activeId) setMessages(next);
    // Update preview
    const preview = message.role === 'assistant' ? message.content.slice(0, 80) : ([...currentMsgs].reverse().find((m: EverestMessage) => m.role === 'assistant')?.content.slice(0, 80) ?? '');
    const conv = conversations.find((c) => c.id === convId);
    if (conv) {
      const updated: EverestConversation = {
        ...conv,
        preview: preview || conv.preview,
        updatedAt: new Date().toISOString(),
        messageCount: next.length,
        title: conv.title === 'New chat' && message.role === 'user' ? message.content.slice(0, 48) : conv.title,
      };
      const nextConvs = conversations.map((c) => (c.id === convId ? updated : c))
        .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt.localeCompare(a.updatedAt));
      setConversations(nextConvs);
      saveConvs(uidRef.current, nextConvs);
    }
  }, [activeId, conversations]);

  const updateLastMessage = useCallback((convId: string, content: string) => {
    const currentMsgs = loadMessages(convId, uidRef.current);
    if (!currentMsgs.length) return;
    currentMsgs[currentMsgs.length - 1] = { ...currentMsgs[currentMsgs.length - 1], content };
    saveMessages(convId, uidRef.current, currentMsgs);
    if (convId === activeId) setMessages([...currentMsgs]);
  }, [activeId]);

  const replaceMessages = useCallback((convId: string, newMessages: EverestMessage[]) => {
    saveMessages(convId, uidRef.current, newMessages);
    if (convId === activeId) setMessages(newMessages);
    const conv = conversations.find((c) => c.id === convId);
    if (conv) {
      const lastAssistant = newMessages.filter((m) => m.role === 'assistant').pop();
      const updated = {
        ...conv,
        preview: lastAssistant?.content.slice(0, 80) ?? conv.preview,
        updatedAt: new Date().toISOString(),
        messageCount: newMessages.length,
      };
      const nextConvs = conversations.map((c) => (c.id === convId ? updated : c));
      setConversations(nextConvs);
      saveConvs(uidRef.current, nextConvs);
    }
  }, [activeId, conversations]);

  const activeConversation = useMemo(() => conversations.find((c) => c.id === activeId) ?? null, [conversations, activeId]);

  const grouped = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups: Record<string, EverestConversation[]> = {
      Today: [],
      Yesterday: [],
      'Previous 7 days': [],
      Older: [],
    };
    for (const c of conversations) {
      const d = new Date(c.updatedAt);
      if (d >= today) groups.Today.push(c);
      else if (d >= yesterday) groups.Yesterday.push(c);
      else if (d >= weekAgo) groups['Previous 7 days'].push(c);
      else groups.Older.push(c);
    }
    return groups;
  }, [conversations]);

  const searchFiltered = useCallback((query: string) => {
    if (!query.trim()) return conversations;
    const q = query.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q));
  }, [conversations]);

  return {
    conversations,
    grouped,
    activeId,
    setActiveId,
    activeConversation,
    messages,
    setMessages,
    createConversation,
    updateConversation,
    deleteConversation,
    clearAll,
    appendMessage,
    updateLastMessage,
    replaceMessages,
    searchFiltered,
  };
}
