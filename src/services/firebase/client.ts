/**
 * Firebase bootstrap.
 *
 * Firebase SDKs are imported dynamically so a build without Firebase
 * configuration never ships the SDK in the initial bundle.
 */
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

export interface FirebasePublicConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

function readEnv(key: string): string {
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  return typeof value === 'string' ? value.trim() : '';
}

export const firebaseConfig: FirebasePublicConfig = {
  apiKey: readEnv('VITE_FIREBASE_API_KEY'),
  authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: readEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readEnv('VITE_FIREBASE_APP_ID'),
};

/** Firebase is considered configured only when all required keys are present. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId,
);

export const missingFirebaseKeys = (): string[] => {
  const required: Array<[keyof FirebasePublicConfig, string]> = [
    ['apiKey', 'VITE_FIREBASE_API_KEY'],
    ['authDomain', 'VITE_FIREBASE_AUTH_DOMAIN'],
    ['projectId', 'VITE_FIREBASE_PROJECT_ID'],
    ['appId', 'VITE_FIREBASE_APP_ID'],
  ];
  return required.filter(([key]) => !firebaseConfig[key]).map(([, env]) => env);
};

let appPromise: Promise<FirebaseApp> | null = null;
let authPromise: Promise<Auth> | null = null;
let dbPromise: Promise<Firestore> | null = null;

export async function getFirebaseApp(): Promise<FirebaseApp> {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured.');
  if (!appPromise) {
    appPromise = import('firebase/app').then(({ initializeApp, getApps, getApp }) =>
      getApps().length ? getApp() : initializeApp(firebaseConfig),
    );
  }
  return appPromise;
}

export async function getFirebaseAuth(): Promise<Auth> {
  if (!authPromise) {
    authPromise = Promise.all([getFirebaseApp(), import('firebase/auth')]).then(([app, { getAuth }]) =>
      getAuth(app),
    );
  }
  return authPromise;
}

export async function getFirebaseDb(): Promise<Firestore> {
  if (!dbPromise) {
    dbPromise = Promise.all([getFirebaseApp(), import('firebase/firestore')]).then(([app, { getFirestore }]) =>
      getFirestore(app),
    );
  }
  return dbPromise;
}
