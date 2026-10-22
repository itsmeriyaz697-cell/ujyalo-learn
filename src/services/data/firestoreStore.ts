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
import { getFirebaseDb } from '@/services/firebase/client';
import type { DataStore } from './types';

/**
 * Firestore data access. Every path is rooted at `users/{uid}` and the
 * deployed security rules enforce `request.auth.uid == uid` for all
 * subcollections. Passing the uid here is convenience, not security.
 */

type SubCollection =
  | 'conversations'
  | 'notes'
  | 'quizzes'
  | 'attempts'
  | 'decks'
  | 'goals'
  | 'tasks'
  | 'activity';

const firestore = () => import('firebase/firestore');

async function readCollection<T>(uid: string, name: SubCollection, max = 300): Promise<T[]> {
  const { getDocs, limit, query, orderBy, collection } = await firestore();
  const db = await getFirebaseDb();
  const snap = await getDocs(query(collection(db, 'users', uid, name), orderBy('createdAt', 'desc'), limit(max)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

async function setDocData(uid: string, name: SubCollection, id: string, data: object) {
  const { doc, setDoc } = await firestore();
  const db = await getFirebaseDb();
  await setDoc(doc(db, 'users', uid, name, id), data);
}

async function deleteDocById(uid: string, name: SubCollection, id: string) {
  const { deleteDoc, doc } = await firestore();
  const db = await getFirebaseDb();
  await deleteDoc(doc(db, 'users', uid, name, id));
}

export const firestoreStore: DataStore = {
  mode: 'firebase',

  async getProfile(uid) {
    const { getDoc, doc } = await firestore();
    const db = await getFirebaseDb();
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return { uid, ...(snap.data() as Omit<StudentProfile, 'uid'>) } as StudentProfile;
  },

  async saveProfile(profile) {
    const { setDoc, doc } = await firestore();
    const db = await getFirebaseDb();
    await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });
  },

  async deleteUserData(uid) {
    const { getDocs, collection, doc, writeBatch, deleteDoc } = await firestore();
    const db = await getFirebaseDb();
    const collections: SubCollection[] = [
      'conversations',
      'notes',
      'quizzes',
      'attempts',
      'decks',
      'goals',
      'tasks',
      'activity',
    ];
    for (const name of collections) {
      if (name === 'conversations') {
        const conversations = await getDocs(collection(db, 'users', uid, 'conversations'));
        for (const conversation of conversations.docs) {
          const messages = await getDocs(collection(db, 'users', uid, 'conversations', conversation.id, 'messages'));
          for (let i = 0; i < messages.docs.length; i += 400) {
            const batch = writeBatch(db);
            messages.docs.slice(i, i + 400).forEach((m) => batch.delete(m.ref));
            await batch.commit();
          }
          await deleteDoc(conversation.ref);
        }
        continue;
      }
      const snap = await getDocs(collection(db, 'users', uid, name));
      for (let i = 0; i < snap.docs.length; i += 400) {
        const batch = writeBatch(db);
        snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }
    await deleteDoc(doc(db, 'users', uid));
  },

  async listConversations(uid, limit = 50) {
    return readCollection<Conversation>(uid, 'conversations', limit);
  },

  async getConversation(uid, id) {
    const { getDoc, doc } = await firestore();
    const db = await getFirebaseDb();
    const snap = await getDoc(doc(db, 'users', uid, 'conversations', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Conversation;
  },

  async saveConversation(conversation) {
    await setDocData(conversation.ownerId, 'conversations', conversation.id, { ...conversation });
  },

  async deleteConversation(uid, id) {
    const { getDocs, collection, doc, writeBatch } = await firestore();
    const db = await getFirebaseDb();
    const messages = await getDocs(collection(db, 'users', uid, 'conversations', id, 'messages'));
    const batch = writeBatch(db);
    messages.docs.forEach((m) => batch.delete(m.ref));
    batch.delete(doc(db, 'users', uid, 'conversations', id));
    await batch.commit();
  },

  async listMessages(uid, conversationId, options = {}) {
    const { getDocs, query, orderBy, where, limit, collection } = await firestore();
    const db = await getFirebaseDb();
    const pageSize = Math.min(options.limit ?? 50, 100);
    const messagesRef = collection(db, 'users', uid, 'conversations', conversationId, 'messages');
    const constraints = [orderBy('createdAt', 'desc'), limit(pageSize + 1)];
    if (options.before) {
      const messageQuery = query(messagesRef, where('createdAt', '<', options.before), ...constraints);
      const snap = await getDocs(messageQuery);
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatMessage);
      return { messages: docs.slice(0, pageSize).reverse(), hasMore: docs.length > pageSize };
    }
    const snap = await getDocs(query(messagesRef, ...constraints));
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatMessage);
    return { messages: docs.slice(0, pageSize).reverse(), hasMore: docs.length > pageSize };
  },

  async addMessage(message) {
    const { setDoc, doc } = await firestore();
    const db = await getFirebaseDb();
    await setDoc(doc(db, 'users', message.ownerId, 'conversations', message.conversationId, 'messages', message.id), message);
  },

  async listNotes(uid) {
    return readCollection<Note>(uid, 'notes', 500);
  },

  async saveNote(note) {
    await setDocData(note.ownerId, 'notes', note.id, { ...note });
  },

  async deleteNote(uid, id) {
    await deleteDocById(uid, 'notes', id);
  },

  async listQuizzes(uid, limit = 50) {
    return readCollection<Quiz>(uid, 'quizzes', limit);
  },

  async getQuiz(uid, id) {
    const { getDoc, doc } = await firestore();
    const db = await getFirebaseDb();
    const snap = await getDoc(doc(db, 'users', uid, 'quizzes', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Quiz;
  },

  async saveQuiz(quiz) {
    await setDocData(quiz.ownerId, 'quizzes', quiz.id, { ...quiz });
  },

  async deleteQuiz(uid, id) {
    await deleteDocById(uid, 'quizzes', id);
  },

  async listAttempts(uid, limit = 200) {
    return readCollection<QuizAttempt>(uid, 'attempts', limit);
  },

  async saveAttempt(attempt) {
    await setDocData(attempt.ownerId, 'attempts', attempt.id, { ...attempt });
  },

  async listDecks(uid) {
    return readCollection<FlashcardDeck>(uid, 'decks', 300);
  },

  async saveDeck(deck) {
    await setDocData(deck.ownerId, 'decks', deck.id, { ...deck });
  },

  async deleteDeck(uid, id) {
    await deleteDocById(uid, 'decks', id);
  },

  async listGoals(uid) {
    return readCollection<StudyGoal>(uid, 'goals', 200);
  },

  async saveGoal(goal) {
    await setDocData(goal.ownerId, 'goals', goal.id, { ...goal });
  },

  async deleteGoal(uid, id) {
    const { getDocs, query, where, writeBatch, collection, doc } = await firestore();
    const db = await getFirebaseDb();
    const tasks = await getDocs(query(collection(db, 'users', uid, 'tasks'), where('goalId', '==', id)));
    const batch = writeBatch(db);
    tasks.docs.forEach((t) => batch.update(t.ref, { goalId: null }));
    batch.delete(doc(db, 'users', uid, 'goals', id));
    await batch.commit();
  },

  async listTasks(uid) {
    return readCollection<StudyTask>(uid, 'tasks', 500);
  },

  async saveTask(task) {
    await setDocData(task.ownerId, 'tasks', task.id, { ...task });
  },

  async deleteTask(uid, id) {
    await deleteDocById(uid, 'tasks', id);
  },

  async listActivity(uid, limit = 365) {
    return readCollection<ActivityEvent>(uid, 'activity', limit);
  },

  async addActivity(event) {
    await setDocData(event.ownerId, 'activity', event.id, { ...event });
  },
};
