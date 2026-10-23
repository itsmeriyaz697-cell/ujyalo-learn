import type {
  ActivityEvent,
  ChatMessage,
  Conversation,
  FlashcardDeck,
  Note,
  Quiz,
  QuizAttempt,
  StudentProfile,
  StudyGoal,
  StudyTask,
} from '@/types/domain';
import { safeJsonParse } from '@/lib/utils';
import type { DataStore } from './types';

const PREFIX = 'ujyalo:data:';

type CollectionName =
  | 'profile'
  | 'conversations'
  | 'messages'
  | 'notes'
  | 'quizzes'
  | 'attempts'
  | 'decks'
  | 'goals'
  | 'tasks'
  | 'activity';

function key(uid: string, name: CollectionName) {
  return `${PREFIX}${uid}:${name}`;
}

function read<T>(uid: string, name: CollectionName): T[] {
  try {
    return safeJsonParse<T[]>(localStorage.getItem(key(uid, name)), []);
  } catch {
    return [];
  }
}

function write<T>(uid: string, name: CollectionName, rows: T[]) {
  try {
    localStorage.setItem(key(uid, name), JSON.stringify(rows));
  } catch (error) {
    if ((error as { name?: string }).name === 'QuotaExceededError') {
      throw new Error(
        'This browser’s storage is full. Delete some old conversations or notes, or connect Firebase for cloud storage.',
        { cause: error },
      );
    }
    throw error;
  }
}

const byNewest = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);

/**
 * Browser-only demo store. All records are namespaced by uid and never leave
 * the device. This is NOT cloud sync and the UI says so.
 */
export const localStore: DataStore = {
  mode: 'local',

  async getProfile(uid) {
    return read<StudentProfile>(uid, 'profile')[0] ?? null;
  },

  async saveProfile(profile) {
    write(uid(profile), 'profile', [profile]);
  },

  async deleteUserData(uid) {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(`${PREFIX}${uid}:`))
      .forEach((k) => localStorage.removeItem(k));
  },

  async listConversations(uid, limit = 50) {
    return read<Conversation>(uid, 'conversations').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, limit);
  },

  async getConversation(uid, id) {
    return read<Conversation>(uid, 'conversations').find((c) => c.id === id) ?? null;
  },

  async saveConversation(conversation) {
    const { ownerId } = conversation;
    const rows = read<Conversation>(ownerId, 'conversations');
    const index = rows.findIndex((c) => c.id === conversation.id);
    if (index >= 0) rows[index] = conversation;
    else rows.push(conversation);
    write(ownerId, 'conversations', rows);
  },

  async deleteConversation(uid, id) {
    write(uid, 'conversations', read<Conversation>(uid, 'conversations').filter((c) => c.id !== id));
    write(uid, 'messages', read<ChatMessage>(uid, 'messages').filter((m) => m.conversationId !== id));
  },

  async listMessages(uid, conversationId, options = {}) {
    const limit = options.limit ?? 100;
    const all = read<ChatMessage>(uid, 'messages')
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const filtered = options.before ? all.filter((m) => m.createdAt < options.before!) : all;
    const page = filtered.slice(-limit);
    return { messages: page, hasMore: filtered.length > page.length };
  },

  async addMessage(message) {
    const rows = read<ChatMessage>(message.ownerId, 'messages');
    const index = rows.findIndex((m) => m.id === message.id);
    if (index >= 0) rows[index] = message;
    else rows.push(message);
    write(message.ownerId, 'messages', rows);
  },

  async listNotes(uid) {
    return read<Note>(uid, 'notes').sort(byNewest);
  },

  async saveNote(note) {
    const rows = read<Note>(note.ownerId, 'notes');
    const index = rows.findIndex((n) => n.id === note.id);
    if (index >= 0) rows[index] = note;
    else rows.push(note);
    write(note.ownerId, 'notes', rows);
  },

  async deleteNote(uid, id) {
    write(uid, 'notes', read<Note>(uid, 'notes').filter((n) => n.id !== id));
  },

  async listQuizzes(uid, limit = 50) {
    return read<Quiz>(uid, 'quizzes').sort(byNewest).slice(0, limit);
  },

  async getQuiz(uid, id) {
    return read<Quiz>(uid, 'quizzes').find((q) => q.id === id) ?? null;
  },

  async saveQuiz(quiz) {
    const rows = read<Quiz>(quiz.ownerId, 'quizzes');
    const index = rows.findIndex((q) => q.id === quiz.id);
    if (index >= 0) rows[index] = quiz;
    else rows.push(quiz);
    write(quiz.ownerId, 'quizzes', rows);
  },

  async deleteQuiz(uid, id) {
    write(uid, 'quizzes', read<Quiz>(uid, 'quizzes').filter((q) => q.id !== id));
  },

  async listAttempts(uid, limit = 200) {
    return read<QuizAttempt>(uid, 'attempts').sort(byNewest).slice(0, limit);
  },

  async saveAttempt(attempt) {
    const rows = read<QuizAttempt>(attempt.ownerId, 'attempts');
    rows.push(attempt);
    write(attempt.ownerId, 'attempts', rows);
  },

  async listDecks(uid) {
    return read<FlashcardDeck>(uid, 'decks').sort(byNewest);
  },

  async saveDeck(deck) {
    const rows = read<FlashcardDeck>(deck.ownerId, 'decks');
    const index = rows.findIndex((d) => d.id === deck.id);
    if (index >= 0) rows[index] = deck;
    else rows.push(deck);
    write(deck.ownerId, 'decks', rows);
  },

  async deleteDeck(uid, id) {
    write(uid, 'decks', read<FlashcardDeck>(uid, 'decks').filter((d) => d.id !== id));
  },

  async listGoals(uid) {
    return read<StudyGoal>(uid, 'goals').sort(byNewest);
  },

  async saveGoal(goal) {
    const rows = read<StudyGoal>(goal.ownerId, 'goals');
    const index = rows.findIndex((g) => g.id === goal.id);
    if (index >= 0) rows[index] = goal;
    else rows.push(goal);
    write(goal.ownerId, 'goals', rows);
  },

  async deleteGoal(uid, id) {
    write(uid, 'goals', read<StudyGoal>(uid, 'goals').filter((g) => g.id !== id));
    write(
      uid,
      'tasks',
      read<StudyTask>(uid, 'tasks').map((t) => (t.goalId === id ? { ...t, goalId: null } : t)),
    );
  },

  async listTasks(uid) {
    return read<StudyTask>(uid, 'tasks').sort((a, b) => a.date.localeCompare(b.date));
  },

  async saveTask(task) {
    const rows = read<StudyTask>(task.ownerId, 'tasks');
    const index = rows.findIndex((t) => t.id === task.id);
    if (index >= 0) rows[index] = task;
    else rows.push(task);
    write(task.ownerId, 'tasks', rows);
  },

  async deleteTask(uid, id) {
    write(uid, 'tasks', read<StudyTask>(uid, 'tasks').filter((t) => t.id !== id));
  },

  async listActivity(uid, limit = 365) {
    return read<ActivityEvent>(uid, 'activity').sort(byNewest).slice(0, limit);
  },

  async addActivity(event) {
    const rows = read<ActivityEvent>(event.ownerId, 'activity');
    rows.push(event);
    // Keep the local log bounded.
    write(event.ownerId, 'activity', rows.slice(-500));
  },
};

// Local helper used by saveProfile where uid lives on the profile object.
function uid(profile: StudentProfile): string {
  return profile.uid;
}
