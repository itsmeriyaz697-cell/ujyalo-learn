import { useEffect, useMemo, useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { InlineAlert } from '@/components/ui/Feedback';
import { useContent } from '@/features/content/ContentProvider';
import { canManageSettings, type AdminRole } from '@/features/content/store';

export default function AdminAudit() {
  const { audit, reloadAudit, role } = useContent();
  const [query, setQuery] = useState('');

  useEffect(() => {
    void reloadAudit();
  }, [reloadAudit]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return audit;
    return audit.filter((event) => `${event.summary} ${event.action} ${event.actorEmail}`.toLowerCase().includes(q));
  }, [audit, query]);

  // The audit trail is readable by admins and owners, not editors.
  if (!canManageSettings(role as AdminRole)) {
    return (
      <div className="card max-w-lg p-6">
        <ShieldCheck className="h-7 w-7" style={{ color: 'var(--muted)' }} aria-hidden="true" />
        <h1 className="mt-3 text-lg font-bold">Audit log is restricted</h1>
        <p className="mt-2 text-sm text-soft">Editors can publish content but cannot read or change administrative history.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Audit log</h1>
      <p className="mt-1 text-sm text-soft">
        Append-only record of publishing actions. Entries contain no student data, passwords or message content.
      </p>

      <div className="mt-5 max-w-md">
        <label className="relative block">
          <span className="sr-only">Search the audit log</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted)' }} aria-hidden="true" />
          <input className="input pl-9" placeholder="Filter by action or actor" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </div>

      <div className="mt-5">
        {filtered.length === 0 ? (
          <InlineAlert tone="info">No entries yet. Publishing, archiving or editing content writes one here.</InlineAlert>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                  <th className="py-2 pr-3 font-semibold">When</th>
                  <th className="py-2 pr-3 font-semibold">Actor</th>
                  <th className="py-2 pr-3 font-semibold">Action</th>
                  <th className="py-2 pr-3 font-semibold">Entity</th>
                  <th className="py-2 font-semibold">Summary</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((event) => (
                  <tr key={event.id} className="border-t align-top" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-2.5 pr-3 whitespace-nowrap" style={{ color: 'var(--muted)' }}>
                      {new Date(event.at).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 pr-3">{event.actorEmail || event.actorId}</td>
                    <td className="py-2.5 pr-3"><code className="text-xs">{event.action}</code></td>
                    <td className="py-2.5 pr-3" style={{ color: 'var(--muted)' }}>{event.entity}</td>
                    <td className="py-2.5">{event.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
