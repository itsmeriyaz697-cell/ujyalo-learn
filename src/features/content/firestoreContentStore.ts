import { getFirebaseDb } from '@/services/firebase/client';
import type { ContentStore } from './store';
import type { AuditEvent, Course, Resource, SeoOverride, SiteSettings } from './types';
import { DEFAULT_SETTINGS } from './seed';

/**
 * Firestore-backed content store.
 *
 * Collections:
 *   courses/{id}            — published courses are world-readable
 *   resources/{id}          — same rule
 *   settings/site           — world-readable, admins only may write
 *   auditLogs/{id}          — admins only may read or append; nobody may edit
 *   roles/{uid}             — the signed-in user may read their own role
 *
 * The security rules in `firestore.rules` are the enforcement point. Filtering
 * by `status` here is only to keep the public pages tidy.
 */

const firestore = () => import('firebase/firestore');

/**
 * Firestore rules are not filters: a query that *could* return a draft is
 * rejected for a reader without a role. So the public queries must constrain
 * `status == 'published'` themselves. That needs a composite index
 * (status ASC, updatedAt DESC) — declared in firestore.indexes.json.
 */
async function fetchAll<T>(collectionName: string, { includeDrafts, max = 300 }: { includeDrafts: boolean; max?: number }): Promise<T[]> {
  const { collection, getDocs, limit, orderBy, query, where } = await firestore();
  const db = await getFirebaseDb();
  const constraints = includeDrafts
    ? [orderBy('updatedAt', 'desc'), limit(max)]
    : [where('status', '==', 'published'), orderBy('updatedAt', 'desc'), limit(max)];
  const snap = await getDocs(query(collection(db, collectionName), ...constraints));
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
}

async function fetchBySlug<T>(collectionName: string, slug: string, includeDrafts: boolean): Promise<T | null> {
  const { collection, getDocs, limit, query, where } = await firestore();
  const db = await getFirebaseDb();
  const constraints = includeDrafts
    ? [where('slug', '==', slug), limit(1)]
    : [where('slug', '==', slug), where('status', '==', 'published'), limit(1)];
  const snap = await getDocs(query(collection(db, collectionName), ...constraints));
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as T;
}

async function putDoc(collectionName: string, id: string, data: object) {
  const { doc, setDoc } = await firestore();
  const db = await getFirebaseDb();
  await setDoc(doc(db, collectionName, id), data, { merge: true });
}

async function removeDoc(collectionName: string, id: string) {
  const { deleteDoc, doc } = await firestore();
  const db = await getFirebaseDb();
  await deleteDoc(doc(db, collectionName, id));
}

export const firestoreContentStore: ContentStore = {
  mode: 'firebase',

  async listCourses({ includeDrafts = false } = {}) {
    return fetchAll<Course>('courses', { includeDrafts });
  },

  async getCourse(slug, { includeDrafts = false } = {}) {
    return fetchBySlug<Course>('courses', slug, includeDrafts);
  },

  async saveCourse(course) {
    await putDoc('courses', course.id, course);
  },

  async deleteCourse(id) {
    await removeDoc('courses', id);
  },

  async listResources({ includeDrafts = false } = {}) {
    return fetchAll<Resource>('resources', { includeDrafts });
  },

  async getResource(slug, { includeDrafts = false } = {}) {
    return fetchBySlug<Resource>('resources', slug, includeDrafts);
  },

  async saveResource(resource) {
    await putDoc('resources', resource.id, resource);
  },

  async deleteResource(id) {
    await removeDoc('resources', id);
  },

  async getSettings(): Promise<SiteSettings> {
    const { doc, getDoc } = await firestore();
    const db = await getFirebaseDb();
    const snap = await getDoc(doc(db, 'settings', 'site'));
    return snap.exists() ? ({ ...DEFAULT_SETTINGS, ...snap.data() } as SiteSettings) : DEFAULT_SETTINGS;
  },

  async saveSettings(settings) {
    await putDoc('settings', 'site', settings);
  },

  async listSeoOverrides() {
    const { collection, getDocs, limit, query } = await firestore();
    const db = await getFirebaseDb();
    const snap = await getDocs(query(collection(db, 'seoPages'), limit(200)));
    return snap.docs.map((doc) => ({ path: doc.id, ...doc.data() }) as SeoOverride);
  },

  async saveSeoOverride(override) {
    // Document id is the route path (slashes are legal in Firestore ids).
    await putDoc('seoPages', override.path, override);
  },

  async listAudit(limitCount = 50) {
    const { collection, getDocs, limit, orderBy, query } = await firestore();
    const db = await getFirebaseDb();
    const snap = await getDocs(
      query(collection(db, 'auditLogs'), orderBy('at', 'desc'), limit(limitCount)),
    );
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AuditEvent);
  },

  async logAudit(event) {
    await putDoc('auditLogs', event.id, event);
  },
};
