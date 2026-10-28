import { useState } from 'react';
import { Search, Plus, Pin, Trash2, Edit3, MessageSquare, X, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { EverestConversation } from '@/hooks/useEverestChat';

interface Props {
  conversations: EverestConversation[];
  grouped: Record<string, EverestConversation[]>;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onPin: (id: string) => void;
  searchFiltered: (q: string) => EverestConversation[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClearAll?: () => void;
}

export function EverestSidebar({ conversations, grouped, activeId, onSelect, onNew, onDelete, onRename, onPin, searchFiltered, collapsed, onToggleCollapse }: Props) {
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const filtered = query ? searchFiltered(query) : null;

  if (collapsed) {
    return (
      <div className="flex w-14 shrink-0 flex-col items-center gap-2 border-r px-2 py-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <button onClick={onToggleCollapse} className="rounded-xl p-2 hover:bg-black/5 dark:hover:bg-white/10" aria-label="Expand sidebar">
          <MessageSquare className="h-5 w-5" />
        </button>
        <button onClick={onNew} className="rounded-xl bg-[var(--primary)] p-2 text-white" aria-label="New chat">
          <Plus className="h-5 w-5" />
        </button>
        {conversations.slice(0, 6).map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={cn('h-8 w-8 rounded-lg text-xs font-medium', activeId === c.id ? 'bg-[var(--primary-soft)] text-[var(--primary)]' : 'bg-[var(--surface-2)] hover:bg-[var(--surface-3)]')}
            title={c.title}
          >
            {c.title.slice(0, 2).toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <aside className="flex w-[300px] shrink-0 flex-col border-r lg:w-[300px]" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2 border-b p-3" style={{ borderColor: 'var(--border)' }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#15245F 0%,#2947D6 50%,#3B61F0 100%)' }}>
          🏔️
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-none" style={{ color: 'var(--text)' }}>Everest AI</p>
          <p className="text-[11px]" style={{ color: 'var(--muted)' }}>by Ujyalo Learn</p>
        </div>
        <button onClick={onToggleCollapse} className="rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/10" aria-label="Collapse sidebar">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-3">
        <Button fullWidth onClick={onNew} icon={<Plus className="h-4 w-4" />}>
          New chat
        </Button>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats..."
            className="h-9 w-full rounded-xl border pl-9 pr-3 text-sm outline-none focus:border-[var(--primary)]"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
          />
        </div>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto px-2 pb-4">
        {filtered ? (
          <div className="space-y-1">
            <p className="px-2 py-1 text-xs font-semibold" style={{ color: 'var(--muted)' }}>{filtered.length} results</p>
            {filtered.map((c) => renderItem(c))}
          </div>
        ) : (
          Object.entries(grouped).map(([group, items]) =>
            items.length ? (
              <div key={group} className="mt-4 first:mt-2">
                <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{group}</p>
                <div className="space-y-1">{items.map((c) => renderItem(c))}</div>
              </div>
            ) : null,
          )
        )}
        {!conversations.length && (
          <div className="mt-8 px-3 text-center">
            <p className="text-sm font-medium" style={{ color: 'var(--text-soft)' }}>No chats yet</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>Start a new conversation to see it here</p>
          </div>
        )}
      </div>

      <div className="border-t p-3 text-[11px]" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
        <p>Groq • Ultra-fast • 131k context</p>
        <p className="mt-1">🏔️ Everest Pro • Free to start</p>
      </div>
    </aside>
  );

  function renderItem(c: EverestConversation) {
    const isActive = activeId === c.id;
    const isEditing = editingId === c.id;
    return (
      <div
        key={c.id}
        className={cn('group flex items-center gap-2 rounded-xl px-2.5 py-2 text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.06]', isActive && 'bg-[var(--primary-soft)] !hover:bg-[var(--primary-soft)]')}
      >
        <button onClick={() => !isEditing && onSelect(c.id)} className="min-w-0 flex-1 text-left">
          {isEditing ? (
            <input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { onRename(c.id, editValue); setEditingId(null); }
                if (e.key === 'Escape') setEditingId(null);
              }}
              onBlur={() => { if (editValue.trim()) onRename(c.id, editValue); setEditingId(null); }}
              autoFocus
              className="w-full rounded-lg border px-2 py-1 text-sm"
              style={{ background: 'var(--surface)', borderColor: 'var(--primary)' }}
            />
          ) : (
            <>
              <p className={cn('truncate text-[13px] font-medium leading-tight', isActive && 'text-[var(--primary)]')} style={!isActive ? { color: 'var(--text)' } : undefined}>{c.title}</p>
              <p className="truncate text-[11px]" style={{ color: 'var(--muted)' }}>{c.preview || 'No messages yet'} • {c.model.split('/').pop()}</p>
            </>
          )}
        </button>
        <div className={cn('hidden items-center gap-0.5 group-hover:flex', isActive && 'flex')}>
          <button
            onClick={() => onPin(c.id)}
            className="rounded-lg p-1 hover:bg-black/10 dark:hover:bg-white/10"
            title={c.pinned ? 'Unpin' : 'Pin'}
          >
            {c.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => { setEditingId(c.id); setEditValue(c.title); }}
            className="rounded-lg p-1 hover:bg-black/10 dark:hover:bg-white/10"
            title="Rename"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onDelete(c.id)} className="rounded-lg p-1 hover:bg-red-50 hover:text-red-600" title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }
}
