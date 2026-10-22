import { useState } from 'react';
import { Save, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InlineAlert } from '@/components/ui/Feedback';
import { useContent } from '@/features/content/ContentProvider';
import { canManageSettings } from '@/features/content/store';

export default function AdminSettings() {
  const { settings, saveSettings, role, mode } = useContent();
  const [draft, setDraft] = useState(settings);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  if (!canManageSettings(role)) {
    return (
      <div className="card max-w-lg p-6">
        <ShieldAlert className="h-7 w-7" style={{ color: 'var(--warning, #B45309)' }} aria-hidden="true" />
        <h1 className="mt-3 text-lg font-bold">Settings are restricted</h1>
        <p className="mt-2 text-sm text-soft">Your role can edit content but not site-wide settings.</p>
      </div>
    );
  }

  async function save() {
    setState('saving');
    try {
      await saveSettings({ ...draft, updatedAt: new Date().toISOString(), updatedBy: role });
      setState('saved');
    } catch {
      setState('error');
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Site settings</h1>
      <p className="mt-1 text-sm text-soft">
        Public identity and the maintenance banner. Changes apply to every page that reads site settings.
      </p>

      {state === 'saved' && (
        <div className="mt-4">
          <InlineAlert tone="success">Settings saved.</InlineAlert>
        </div>
      )}
      {state === 'error' && (
        <div className="mt-4">
          <InlineAlert tone="warning">Could not save settings. Check your role and connection.</InlineAlert>
        </div>
      )}
      {mode === 'local' && (
        <div className="mt-4">
          <InlineAlert tone="info">
            Demo workspace: these settings are stored in this browser only. Connect Firebase to share them.
          </InlineAlert>
        </div>
      )}

      <div className="card mt-5 space-y-4 p-5">
        <div>
          <label htmlFor="site-name" className="text-sm font-semibold">Site name</label>
          <input id="site-name" className="input mt-1.5" value={draft.siteName} onChange={(event) => setDraft({ ...draft, siteName: event.target.value })} />
        </div>
        <div>
          <label htmlFor="site-tagline" className="text-sm font-semibold">Tagline</label>
          <input id="site-tagline" className="input mt-1.5" value={draft.tagline} onChange={(event) => setDraft({ ...draft, tagline: event.target.value })} />
        </div>
        <div>
          <label htmlFor="site-contact" className="text-sm font-semibold">Contact email</label>
          <input
            id="site-contact"
            type="email"
            className="input mt-1.5"
            value={draft.contactEmail}
            placeholder="Leave empty to show “contact address not configured”"
            onChange={(event) => setDraft({ ...draft, contactEmail: event.target.value })}
          />
        </div>
        <div>
          <label htmlFor="site-maintenance" className="text-sm font-semibold">Maintenance notice</label>
          <textarea
            id="site-maintenance"
            className="input mt-1.5 min-h-[80px]"
            value={draft.maintenanceNotice}
            placeholder="Shown as a banner on every page when set. Leave empty for none."
            onChange={(event) => setDraft({ ...draft, maintenanceNotice: event.target.value })}
          />
        </div>
        <div>
          <label htmlFor="site-language" className="text-sm font-semibold">Default language</label>
          <select
            id="site-language"
            className="input mt-1.5"
            value={draft.defaultLanguage}
            onChange={(event) => setDraft({ ...draft, defaultLanguage: event.target.value as 'en' | 'ne' })}
          >
            <option value="en">English</option>
            <option value="ne">Nepali</option>
          </select>
        </div>
      </div>

      <div className="mt-5 pb-10">
        <Button onClick={save} loading={state === 'saving'}>
          <Save className="mr-1.5 h-4 w-4" aria-hidden="true" /> Save settings
        </Button>
      </div>
    </div>
  );
}
