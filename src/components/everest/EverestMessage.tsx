import { useState } from 'react';
import { Copy, Check, RotateCcw, ThumbsUp, ThumbsDown, Pencil, Trash2 } from 'lucide-react';
import { Markdown } from '@/components/markdown/Markdown';
import { cn } from '@/lib/utils';

interface Props {
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  streaming?: boolean;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onEdit?: (newContent: string) => void;
  onDelete?: () => void;
}

export function EverestMessage({ role, content, model, streaming, onCopy, onRegenerate, onEdit, onDelete }: Props) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<'up' | 'down' | null>(null);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);

  const isUser = role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 1600);
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="group relative max-w-[82%]">
          {editing ? (
            <div className="rounded-2xl border p-3" style={{ background: 'var(--surface)', borderColor: 'var(--primary)' }}>
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="min-h-[60px] w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
                autoFocus
              />
              <div className="mt-2 flex justify-end gap-2">
                <button onClick={() => setEditing(false)} className="rounded-xl px-3 py-1.5 text-xs font-medium" style={{ background: 'var(--surface-2)' }}>Cancel</button>
                <button onClick={() => { onEdit?.(editValue); setEditing(false); }} className="rounded-xl bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white">Save & send</button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl rounded-br-md px-4 py-3 text-[14px] leading-relaxed" style={{ background: 'var(--primary)', color: 'var(--primary-contrast)' }}>
              <p className="whitespace-pre-wrap">{content}</p>
            </div>
          )}
          {!editing && (
            <div className="mt-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100">
              <button onClick={() => setEditing(true)} className="rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/10" title="Edit">
                <Pencil className="h-3.5 w-3.5" style={{ color: 'var(--muted)' }} />
              </button>
              <button onClick={handleCopy} className="rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/10" title="Copy">
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" style={{ color: 'var(--muted)' }} />}
              </button>
              {onDelete && (
                <button onClick={onDelete} className="rounded-lg p-1.5 hover:bg-red-50 hover:text-red-600" title="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,#15245F,#2947D6)' }}>
        🏔️
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Everest AI</span>
          {model && <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>{model.split('/').pop()}</span>}
          {streaming && <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: 'var(--muted)' }}><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--primary)]" /> Writing...</span>}
        </div>
        <div className="prose-ujyalo mt-1 max-w-none rounded-2xl rounded-tl-md border px-4 py-3 text-[14px] leading-relaxed" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <Markdown content={content} streaming={streaming} />
          {streaming && !content && <span className="inline-block h-4 w-2 animate-pulse bg-[var(--primary)] text-transparent">|</span>}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <button onClick={handleCopy} className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/10" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
            {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />} {copied ? 'Copied' : 'Copy'}
          </button>
          {onRegenerate && (
            <button onClick={onRegenerate} className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/10" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
              <RotateCcw className="h-3 w-3" /> Regenerate
            </button>
          )}
          <button onClick={() => setLiked(liked === 'up' ? null : 'up')} className={cn('rounded-full border p-1.5 hover:bg-black/5', liked === 'up' && 'bg-green-50 text-green-600 border-green-200')} style={{ borderColor: 'var(--border)' }}>
            <ThumbsUp className="h-3 w-3" />
          </button>
          <button onClick={() => setLiked(liked === 'down' ? null : 'down')} className={cn('rounded-full border p-1.5 hover:bg-black/5', liked === 'down' && 'bg-red-50 text-red-600 border-red-200')} style={{ borderColor: 'var(--border)' }}>
            <ThumbsDown className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
