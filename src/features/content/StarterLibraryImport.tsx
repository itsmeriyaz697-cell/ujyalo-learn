import { useState } from 'react';
import { CheckCircle2, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InlineAlert } from '@/components/ui/Feedback';
import { useContent } from '@/features/content/ContentProvider';
import { SEED_COURSES, SEED_RESOURCES } from './seed';

/**
 * One-click import of the starter library into Firestore.
 *
 * Why this exists: `scripts/seed-firestore.mjs` needs a service-account key,
 * which means downloading a credential that can write to the whole database and
 * then deleting it afterwards. That is a lot of ceremony — and a real risk — for
 * copying fourteen documents once. The admin is already signed in with the role
 * that the security rules accept, so the import can run through their own
 * session instead. No key, no credential file, nothing to clean up.
 *
 * It never overwrites: a document whose id already exists is skipped, so an
 * edit made in the admin panel is not clobbered by pressing this twice.
 */
export function StarterLibraryImport() {
  const { mode, courses, resources, saveCourse, saveResource, settings, settingsStored, saveSettings, reload } =
    useContent();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // In local demo mode the library is already present and import is meaningless.
  if (mode !== 'firebase') return null;

  const existingCourseIds = new Set(courses.map((course) => course.id));
  const existingResourceIds = new Set(resources.map((resource) => resource.id));

  const missingCourses = SEED_COURSES.filter((course) => !existingCourseIds.has(course.id));
  const missingResources = SEED_RESOURCES.filter((resource) => !existingResourceIds.has(resource.id));
  // Not `Boolean(settings.siteName)`: getSettings() falls back to defaults, and
  // the defaults carry a site name too, so that would never read as missing.
  const settingsSeeded = settingsStored;

  const missing = missingCourses.length + missingResources.length + (settingsSeeded ? 0 : 1);
  if (missing === 0 && !result) return null;

  async function run() {
    setBusy(true);
    setError(null);
    setResult(null);
    let written = 0;
    const failures: string[] = [];

    for (const course of missingCourses) {
      try {
        await saveCourse(course);
        written += 1;
      } catch (caught) {
        failures.push(`${course.title}: ${(caught as Error).message}`);
      }
    }
    for (const resource of missingResources) {
      try {
        await saveResource(resource);
        written += 1;
      } catch (caught) {
        failures.push(`${resource.title}: ${(caught as Error).message}`);
      }
    }
    if (!settingsSeeded) {
      try {
        await saveSettings(settings);
        written += 1;
      } catch (caught) {
        failures.push(`site settings: ${(caught as Error).message}`);
      }
    }

    setBusy(false);

    if (failures.length) {
      setError(
        `${written} of ${missing} written, ${failures.length} failed. First failure — ${failures[0]}`,
      );
      return;
    }
    // Re-read so the counts above stop claiming records are missing while a
    // success message sits underneath them.
    await reload();
    setResult(`Imported ${written} records. The public library is now served from Firestore.`);
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="text-base font-bold">Starter library not imported</h2>
          <p className="mt-1 text-sm text-soft">
            This project's Firestore is missing {missing} of the {SEED_COURSES.length + SEED_RESOURCES.length + 1}{' '}
            starter records, so the public library will look empty. Importing copies them into your database using
            your signed-in account — no service-account key needed, and nothing already edited is overwritten.
          </p>
          <p className="mt-2 text-xs text-muted">
            {missingCourses.length} of {SEED_COURSES.length} courses · {missingResources.length} of{' '}
            {SEED_RESOURCES.length} guides · site settings {settingsSeeded ? 'present' : 'missing'}
          </p>
        </div>
        <Button type="button" size="sm" onClick={run} disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" /> Importing…
            </>
          ) : (
            <>
              <Download className="mr-1 h-4 w-4" aria-hidden="true" /> Import starter library
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="mt-4">
          <InlineAlert tone="danger" title="Import did not finish">
            {error}
          </InlineAlert>
        </div>
      )}

      {result && (
        <p className="mt-4 flex items-center gap-2 text-sm" style={{ color: 'var(--success-contrast)' }}>
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {result}
        </p>
      )}
    </div>
  );
}
