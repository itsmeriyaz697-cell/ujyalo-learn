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

export interface MessagePage {
  messages: ChatMessage[];
  hasMore: boolean;
}

/**
 * Storage contract. Two implementations exist:
 *  - FirestoreStore: cloud data, protected by security rules.
 *  - LocalStore: browser-only demo data, clearly labelled in the UI.
 *
 * Every method takes the owner's uid so that callers can never accidentally
 * read or write another student's records.
 */
export interface DataStore {
  mode: 'firebase' | 'local';

  getProfile(uid: string): Promise<StudentProfile | null>;
  saveProfile(profile: StudentProfile): Promise<void>;
  deleteUserData(uid: string): Promise<void>;

  listConversations(uid: string, limit?: number): Promise<Conversation[]>;
  getConversation(uid: string, id: string): Promise<Conversation | null>;
  saveConversation(conversation: Conversation): Promise<void>;
  deleteConversation(uid: string, id: string): Promise<void>;
  listMessages(uid: string, conversationId: string, options?: { limit?: number; before?: string }): Promise<MessagePage>;
  addMessage(message: ChatMessage): Promise<void>;

  listNotes(uid: string): Promise<Note[]>;
  saveNote(note: Note): Promise<void>;
  deleteNote(uid: string, id: string): Promise<void>;

  listQuizzes(uid: string, limit?: number): Promise<Quiz[]>;
  getQuiz(uid: string, id: string): Promise<Quiz | null>;
  saveQuiz(quiz: Quiz): Promise<void>;
  deleteQuiz(uid: string, id: string): Promise<void>;
  listAttempts(uid: string, limit?: number): Promise<QuizAttempt[]>;
  saveAttempt(attempt: QuizAttempt): Promise<void>;

  listDecks(uid: string): Promise<FlashcardDeck[]>;
  saveDeck(deck: FlashcardDeck): Promise<void>;
  deleteDeck(uid: string, id: string): Promise<void>;

  listGoals(uid: string): Promise<StudyGoal[]>;
  saveGoal(goal: StudyGoal): Promise<void>;
  deleteGoal(uid: string, id: string): Promise<void>;

  listTasks(uid: string): Promise<StudyTask[]>;
  saveTask(task: StudyTask): Promise<void>;
  deleteTask(uid: string, id: string): Promise<void>;

  listActivity(uid: string, limit?: number): Promise<ActivityEvent[]>;
  addActivity(event: ActivityEvent): Promise<void>;
}

export interface StoreError extends Error {
  code?: string;
}

export function storeError(message: string, code?: string): StoreError {
  const error = new Error(message) as StoreError;
  if (code) error.code = code;
  return error;
}
