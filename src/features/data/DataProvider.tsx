import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { dataStore } from '@/services/data';
import { useAuth } from '@/features/auth/AuthProvider';
import { makeId } from '@/lib/utils';
import type {
  ActivityEvent,
  ActivityType,
  ChatMessage,
  Conversation,
  FlashcardDeck,
  Note,
  Quiz,
  QuizAttempt,
  StudyGoal,
  StudyTask,
} from '@/types/domain';

interface DataContextValue {
  conversations: Conversation[];
  notes: Note[];
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  decks: FlashcardDeck[];
  goals: StudyGoal[];
  tasks: StudyTask[];
  activity: ActivityEvent[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;

  createConversation: (input: { title: string; mode: string; subjectId: string | null }) => Promise<Conversation>;
  updateConversation: (conversation: Conversation) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  removeConversation: (id: string) => Promise<void>;
  loadConversationMessages: (conversationId: string) => Promise<ChatMessage[]>;
  appendMessage: (message: ChatMessage) => Promise<void>;

  saveNote: (note: Note) => Promise<void>;
  removeNote: (id: string) => Promise<void>;

  fetchQuiz: (id: string) => Promise<Quiz | null>;
  saveQuiz: (quiz: Quiz) => Promise<void>;
  removeQuiz: (id: string) => Promise<void>;
  saveAttempt: (attempt: QuizAttempt) => Promise<void>;

  saveDeck: (deck: FlashcardDeck) => Promise<void>;
  removeDeck: (id: string) => Promise<void>;

  saveGoal: (goal: StudyGoal) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  saveTask: (task: StudyTask) => Promise<void>;
  removeTask: (id: string) => Promise<void>;

  logActivity: (type: ActivityType, label: string, options?: { subjectId?: string | null; minutes?: number }) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

const emptyState = {
  conversations: [] as Conversation[],
  notes: [] as Note[],
  quizzes: [] as Quiz[],
  attempts: [] as QuizAttempt[],
  decks: [] as FlashcardDeck[],
  goals: [] as StudyGoal[],
  tasks: [] as StudyTask[],
  activity: [] as ActivityEvent[],
};

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState(emptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedFor = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setState(emptyState);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [conversations, notes, quizzes, attempts, decks, goals, tasks, activity] = await Promise.all([
        dataStore.listConversations(user.uid).catch(() => [] as Conversation[]),
        dataStore.listNotes(user.uid),
        dataStore.listQuizzes(user.uid),
        dataStore.listAttempts(user.uid),
        dataStore.listDecks(user.uid),
        dataStore.listGoals(user.uid),
        dataStore.listTasks(user.uid),
        dataStore.listActivity(user.uid),
      ]);
      setState({ conversations, notes, quizzes, attempts, decks, goals, tasks, activity });
      loadedFor.current = user.uid;
    } catch (loadError) {
      const message = (loadError as { code?: string; message?: string }).code === 'permission-denied'
        ? 'Your learning data could not be loaded because of a permissions problem. If you are the site owner, check that the Firestore security rules are deployed.'
        : 'Your learning data could not be loaded. Check your connection and try again.';
      console.error('[ujyalo] data load failed:', (loadError as Error).message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && loadedFor.current === user.uid) return;
    void load();
  }, [user, load]);

  const requireUid = useCallback(() => {
    if (!user) throw new Error('You need to be signed in.');
    return user.uid;
  }, [user]);

  const createConversation = useCallback<DataContextValue['createConversation']>(
    async ({ title, mode, subjectId }) => {
      const uid = requireUid();
      const now = new Date().toISOString();
      const conversation: Conversation = {
        id: makeId('conv'),
        ownerId: uid,
        title: title.slice(0, 160),
        subjectId,
        mode,
        preview: '',
        messageCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      await dataStore.saveConversation(conversation);
      setState((current) => ({ ...current, conversations: [conversation, ...current.conversations] }));
      return conversation;
    },
    [requireUid],
  );

  const updateConversation = useCallback<DataContextValue['updateConversation']>(
    async (conversation) => {
      requireUid();
      await dataStore.saveConversation(conversation);
      setState((current) => ({
        ...current,
        conversations: current.conversations
          .map((item) => (item.id === conversation.id ? conversation : item))
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      }));
    },
    [requireUid],
  );

  const renameConversation = useCallback<DataContextValue['renameConversation']>(
    async (id, title) => {
      requireUid();
      setState((current) => {
        const target = current.conversations.find((c) => c.id === id);
        if (!target) return current;
        const updated = { ...target, title: title.slice(0, 160), updatedAt: new Date().toISOString() };
        void dataStore.saveConversation(updated);
        return { ...current, conversations: current.conversations.map((c) => (c.id === id ? updated : c)) };
      });
    },
    [requireUid],
  );

  const removeConversation = useCallback<DataContextValue['removeConversation']>(
    async (id) => {
      const uid = requireUid();
      await dataStore.deleteConversation(uid, id);
      setState((current) => ({ ...current, conversations: current.conversations.filter((c) => c.id !== id) }));
    },
    [requireUid],
  );

  const loadConversationMessages = useCallback<DataContextValue['loadConversationMessages']>(
    async (conversationId) => {
      const uid = requireUid();
      const page = await dataStore.listMessages(uid, conversationId, { limit: 100 });
      return page.messages;
    },
    [requireUid],
  );

  const appendMessage = useCallback<DataContextValue['appendMessage']>(
    async (message) => {
      requireUid();
      await dataStore.addMessage(message);
    },
    [requireUid],
  );

  const saveNote = useCallback<DataContextValue['saveNote']>(
    async (note) => {
      requireUid();
      await dataStore.saveNote(note);
      setState((current) => {
        const exists = current.notes.some((n) => n.id === note.id);
        const notes = exists ? current.notes.map((n) => (n.id === note.id ? note : n)) : [note, ...current.notes];
        return { ...current, notes: notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) };
      });
    },
    [requireUid],
  );

  const removeNote = useCallback<DataContextValue['removeNote']>(
    async (id) => {
      const uid = requireUid();
      await dataStore.deleteNote(uid, id);
      setState((current) => ({ ...current, notes: current.notes.filter((n) => n.id !== id) }));
    },
    [requireUid],
  );

  const fetchQuiz = useCallback<DataContextValue['fetchQuiz']>(
    async (id) => {
      const uid = requireUid();
      const cached = state.quizzes.find((quiz) => quiz.id === id);
      if (cached) return cached;
      return dataStore.getQuiz(uid, id);
    },
    [requireUid, state.quizzes],
  );

  const saveQuiz = useCallback<DataContextValue['saveQuiz']>(
    async (quiz) => {
      requireUid();
      await dataStore.saveQuiz(quiz);
      setState((current) => ({ ...current, quizzes: [quiz, ...current.quizzes.filter((q) => q.id !== quiz.id)] }));
    },
    [requireUid],
  );

  const removeQuiz = useCallback<DataContextValue['removeQuiz']>(
    async (id) => {
      const uid = requireUid();
      await dataStore.deleteQuiz(uid, id);
      setState((current) => ({ ...current, quizzes: current.quizzes.filter((q) => q.id !== id) }));
    },
    [requireUid],
  );

  const saveAttempt = useCallback<DataContextValue['saveAttempt']>(
    async (attempt) => {
      requireUid();
      await dataStore.saveAttempt(attempt);
      setState((current) => ({ ...current, attempts: [attempt, ...current.attempts] }));
    },
    [requireUid],
  );

  const saveDeck = useCallback<DataContextValue['saveDeck']>(
    async (deck) => {
      requireUid();
      await dataStore.saveDeck(deck);
      setState((current) => ({
        ...current,
        decks: [deck, ...current.decks.filter((d) => d.id !== deck.id)],
      }));
    },
    [requireUid],
  );

  const removeDeck = useCallback<DataContextValue['removeDeck']>(
    async (id) => {
      const uid = requireUid();
      await dataStore.deleteDeck(uid, id);
      setState((current) => ({ ...current, decks: current.decks.filter((d) => d.id !== id) }));
    },
    [requireUid],
  );

  const saveGoal = useCallback<DataContextValue['saveGoal']>(
    async (goal) => {
      requireUid();
      await dataStore.saveGoal(goal);
      setState((current) => ({
        ...current,
        goals: [goal, ...current.goals.filter((g) => g.id !== goal.id)],
      }));
    },
    [requireUid],
  );

  const removeGoal = useCallback<DataContextValue['removeGoal']>(
    async (id) => {
      const uid = requireUid();
      await dataStore.deleteGoal(uid, id);
      setState((current) => ({
        ...current,
        goals: current.goals.filter((g) => g.id !== id),
        tasks: current.tasks.map((t) => (t.goalId === id ? { ...t, goalId: null } : t)),
      }));
    },
    [requireUid],
  );

  const saveTask = useCallback<DataContextValue['saveTask']>(
    async (task) => {
      requireUid();
      await dataStore.saveTask(task);
      setState((current) => ({
        ...current,
        tasks: [...current.tasks.filter((t) => t.id !== task.id), task].sort((a, b) => a.date.localeCompare(b.date)),
      }));
    },
    [requireUid],
  );

  const removeTask = useCallback<DataContextValue['removeTask']>(
    async (id) => {
      const uid = requireUid();
      await dataStore.deleteTask(uid, id);
      setState((current) => ({ ...current, tasks: current.tasks.filter((t) => t.id !== id) }));
    },
    [requireUid],
  );

  const logActivity = useCallback<DataContextValue['logActivity']>(
    (type, label, options) => {
      if (!user) return;
      const event: ActivityEvent = {
        id: makeId('act'),
        ownerId: user.uid,
        type,
        label: label.slice(0, 160),
        subjectId: options?.subjectId ?? null,
        minutes: options?.minutes,
        createdAt: new Date().toISOString(),
      };
      setState((current) => ({ ...current, activity: [event, ...current.activity].slice(0, 365) }));
      void dataStore.addActivity(event).catch((error) => {
        console.warn('[ujyalo] activity not saved:', (error as Error).message);
      });
    },
    [user],
  );

  const value = useMemo<DataContextValue>(
    () => ({
      ...state,
      loading,
      error,
      reload: load,
      createConversation,
      updateConversation,
      renameConversation,
      removeConversation,
      loadConversationMessages,
      appendMessage,
      saveNote,
      removeNote,
      fetchQuiz,
      saveQuiz,
      removeQuiz,
      saveAttempt,
      saveDeck,
      removeDeck,
      saveGoal,
      removeGoal,
      saveTask,
      removeTask,
      logActivity,
    }),
    [
      state,
      loading,
      error,
      load,
      createConversation,
      updateConversation,
      renameConversation,
      removeConversation,
      loadConversationMessages,
      appendMessage,
      saveNote,
      removeNote,
      fetchQuiz,
      saveQuiz,
      removeQuiz,
      saveAttempt,
      saveDeck,
      removeDeck,
      saveGoal,
      removeGoal,
      saveTask,
      removeTask,
      logActivity,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used inside DataProvider');
  return context;
}
