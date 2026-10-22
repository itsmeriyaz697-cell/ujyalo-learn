import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { isFirebaseConfigured } from '@/services/firebase/client';
import { getFirebaseAuth } from '@/services/firebase/client';
import { useAuth } from '@/features/auth/AuthProvider';
import { makeId } from '@/lib/utils';
import { firestoreContentStore } from './firestoreContentStore';
import { localContentStore } from './localContentStore';
import type { AdminRole, ContentStore } from './store';
import type { AuditAction, AuditEvent, Course, Resource, SeoOverride, SiteSettings } from './types';
import { DEFAULT_SETTINGS } from './seed';
import { setSeoOverrides as publishSeoOverrides } from './seoOverrides';

export const contentStore: ContentStore = isFirebaseConfigured ? firestoreContentStore : localContentStore;

interface ContentContextValue {
  mode: ContentStore['mode'];
  /** Admin view — includes drafts when the signed-in role allows it. */
  courses: Course[];
  resources: Resource[];
  /** Public view — published only, whatever the signed-in role is. */
  publishedCourses: Course[];
  publishedResources: Resource[];
  settings: SiteSettings;
  role: AdminRole;
  roleLoading: boolean;
  audit: AuditEvent[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  reloadAudit: () => Promise<void>;
  saveCourse: (course: Course) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  saveResource: (resource: Resource) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
  saveSettings: (settings: SiteSettings) => Promise<void>;
  seoOverrides: Record<string, SeoOverride>;
  saveSeoOverride: (override: SeoOverride) => Promise<void>;
  recordAudit: (action: AuditAction, entity: AuditEvent['entity'], entityId: string, summary: string) => Promise<void>;
}

const ContentContext = createContext<ContentContextValue | null>(null);

/**
 * Loads the public library once per session and exposes admin helpers.
 *
 * Role handling: with Firebase configured the role is read from `roles/{uid}`,
 * and Firestore rules — not this component — decide whether a write is
 * allowed. Without Firebase there is no shared content at all, so the demo
 * workspace grants owner rights locally and the UI says so on every screen.
 */
export function ContentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [seoOverrides, setSeoOverridesState] = useState<Record<string, SeoOverride>>({});
  const [role, setRole] = useState<AdminRole>(isFirebaseConfigured ? 'student' : 'owner');
  const [roleLoading, setRoleLoading] = useState(isFirebaseConfigured);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const isAdmin = role !== 'student';

  const reload = useCallback(async () => {
    try {
      const [nextCourses, nextResources, nextSettings, nextSeo] = await Promise.all([
        contentStore.listCourses({ includeDrafts: isAdmin }),
        contentStore.listResources({ includeDrafts: isAdmin }),
        contentStore.getSettings(),
        contentStore.listSeoOverrides().catch(() => [] as SeoOverride[]),
      ]);
      if (!mounted.current) return;
      setCourses(nextCourses);
      setResources(nextResources);
      setSettings(nextSettings);
      const registry = nextSeo.reduce<Record<string, SeoOverride>>((acc, item) => {
        acc[item.path] = item;
        return acc;
      }, {});
      setSeoOverridesState(registry);
      publishSeoOverrides(registry);
      setError(null);
    } catch {
      if (mounted.current) {
        setError('The learning library could not be loaded. Check your connection and try again.');
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [isAdmin]);

  const reloadAudit = useCallback(async () => {
    try {
      const events = await contentStore.listAudit(60);
      if (mounted.current) setAudit(events);
    } catch {
      if (mounted.current) setAudit([]);
    }
  }, []);

  // Resolve the signed-in user's role, then (re)load the library for them.
  useEffect(() => {
    let cancelled = false;

    async function resolveRole() {
      if (!isFirebaseConfigured) {
        setRole('owner');
        setRoleLoading(false);
        return;
      }
      if (!user) {
        if (!cancelled) {
          setRole('student');
          setRoleLoading(false);
        }
        return;
      }
      setRoleLoading(true);
      try {
        const [{ getFirebaseDb }, { doc, getDoc }] = await Promise.all([
          import('@/services/firebase/client'),
          import('firebase/firestore'),
        ]);
        const db = await getFirebaseDb();
        const snap = await getDoc(doc(db, 'roles', user.uid));
        const value = (snap.data()?.role ?? 'student') as AdminRole;
        if (!cancelled) setRole(['owner', 'admin', 'editor', 'student'].includes(value) ? value : 'student');
      } catch {
        // A failed role lookup must fail closed.
        if (!cancelled) setRole('student');
      } finally {
        if (!cancelled) setRoleLoading(false);
      }
    }

    void resolveRole();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    void reload();
  }, [reload, role]);

  const actor = useMemo(
    () => ({
      id: user?.uid ?? (isFirebaseConfigured ? 'unknown' : 'demo-owner'),
      email: user?.email ?? (isFirebaseConfigured ? '' : 'demo@localhost'),
    }),
    [user],
  );

  const recordAudit = useCallback(
    async (action: AuditAction, entity: AuditEvent['entity'], entityId: string, summary: string) => {
      const event: AuditEvent = {
        id: makeId(),
        at: new Date().toISOString(),
        actorId: actor.id,
        actorEmail: actor.email,
        action,
        entity,
        entityId,
        summary,
      };
      try {
        await contentStore.logAudit(event);
        if (mounted.current) setAudit((prev) => [event, ...prev].slice(0, 60));
      } catch {
        // The action itself already succeeded; a failed log must not hide that.
      }
    },
    [actor],
  );

  const saveCourse = useCallback(
    async (course: Course) => {
      await contentStore.saveCourse(course);
      await recordAudit(
        course.status === 'published' ? 'course.publish' : 'course.update',
        'course',
        course.id,
        `${course.status === 'published' ? 'Published' : 'Saved'} "${course.title}"`,
      );
      await reload();
    },
    [recordAudit, reload],
  );

  const deleteCourse = useCallback(
    async (id: string) => {
      const target = courses.find((course) => course.id === id);
      await contentStore.deleteCourse(id);
      if (target) await recordAudit('course.delete', 'course', id, `Deleted "${target.title}"`);
      await reload();
    },
    [courses, recordAudit, reload],
  );

  const saveResource = useCallback(
    async (resource: Resource) => {
      await contentStore.saveResource(resource);
      await recordAudit(
        resource.status === 'published' ? 'resource.publish' : 'resource.update',
        'resource',
        resource.id,
        `${resource.status === 'published' ? 'Published' : 'Saved'} "${resource.title}"`,
      );
      await reload();
    },
    [recordAudit, reload],
  );

  const deleteResource = useCallback(
    async (id: string) => {
      const target = resources.find((resource) => resource.id === id);
      await contentStore.deleteResource(id);
      if (target) await recordAudit('resource.delete', 'resource', id, `Deleted "${target.title}"`);
      await reload();
    },
    [resources, recordAudit, reload],
  );

  const saveSettings = useCallback(
    async (next: SiteSettings) => {
      await contentStore.saveSettings(next);
      await recordAudit('settings.update', 'settings', 'site', 'Updated site settings');
      await reload();
    },
    [recordAudit, reload],
  );

  const publishedCourses = useMemo(() => courses.filter((course) => course.status === 'published'), [courses]);
  const publishedResources = useMemo(() => resources.filter((item) => item.status === 'published'), [resources]);

  const saveSeoOverride = useCallback(
    async (override: SeoOverride) => {
      await contentStore.saveSeoOverride(override);
      await recordAudit('settings.update', 'settings', `seo:${override.path}`, `Updated SEO for ${override.path}`);
      await reload();
    },
    [recordAudit, reload],
  );

  const value: ContentContextValue = {
    mode: contentStore.mode,
    courses,
    resources,
    publishedCourses,
    publishedResources,
    settings,
    role,
    roleLoading,
    audit,
    loading,
    error,
    reload,
    reloadAudit,
    saveCourse,
    deleteCourse,
    saveResource,
    deleteResource,
    saveSettings,
    seoOverrides,
    saveSeoOverride,
    recordAudit,
  };

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent(): ContentContextValue {
  const context = useContext(ContentContext);
  if (!context) throw new Error('useContent must be used inside <ContentProvider>');
  return context;
}

/** Firebase auth instance is only needed for the admin screens. */
export function getAuthInstance() {
  return isFirebaseConfigured ? getFirebaseAuth() : null;
}
