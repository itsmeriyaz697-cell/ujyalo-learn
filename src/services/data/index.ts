import { isFirebaseConfigured } from '@/services/firebase/client';
import { firestoreStore } from './firestoreStore';
import { localStore } from './localStore';
import type { DataStore } from './types';

export type { DataStore } from './types';

/**
 * Which storage backend is active right now.
 *
 * This used to be fixed at import time (`isFirebaseConfigured ? cloud : local`),
 * which meant a visitor who had not signed in was pointed at Firestore with no
 * credentials — so the app had to stop them at a wall and ask who they were
 * before showing a single tool.
 *
 * It is now switchable. A visitor browses on the browser store; the moment they
 * have a real account the app switches to the cloud store and carries their
 * work across. Nothing about the DataStore contract changes, so every caller
 * keeps working unmodified.
 */
let active: DataStore = isFirebaseConfigured ? firestoreStore : localStore;

export function isCloudAvailable(): boolean {
  return isFirebaseConfigured;
}

/** Use the browser store: no account, nothing leaves this device. */
export function activateLocalStore(): void {
  active = localStore;
}

/** Use the cloud store when it exists; otherwise stay local rather than fail. */
export function activateCloudStore(): void {
  active = isFirebaseConfigured ? firestoreStore : localStore;
}

/**
 * A delegating facade. Every call resolves against the active store at call
 * time, so a mid-session switch takes effect immediately without any component
 * re-importing anything.
 */
export const dataStore: DataStore = new Proxy({} as DataStore, {
  get(_target, property) {
    const value = (active as unknown as Record<string | symbol, unknown>)[property];
    return typeof value === 'function' ? value.bind(active) : value;
  },
});

/** Human-readable storage mode, for the place in the UI that states it. */
export function storageModeText(): string {
  return active.mode === 'firebase'
    ? 'Synced with your account'
    : 'Saved in this browser only';
}

/** @deprecated kept for older imports; prefer storageModeText(). */
export const storageModeLabel = storageModeText();
