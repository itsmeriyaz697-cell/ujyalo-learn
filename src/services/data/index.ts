import { isFirebaseConfigured } from '@/services/firebase/client';
import { firestoreStore } from './firestoreStore';
import { localStore } from './localStore';
import type { DataStore } from './types';

export type { DataStore } from './types';

/**
 * Selects the storage backend once for the whole session.
 * Cloud data is used whenever Firebase is configured; the browser-only
 * demo store is used otherwise and is labelled in the UI.
 */
export const dataStore: DataStore = isFirebaseConfigured ? firestoreStore : localStore;

export const storageModeLabel =
  dataStore.mode === 'firebase' ? 'Synced with your account' : 'Local demo — saved in this browser only';
