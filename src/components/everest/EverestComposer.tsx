import { useEffect, useRef, useState } from 'react';
import { Send, Square, Paperclip, Mic, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onStop?: () => void;
  sending: boolean;
  placeholder?: string;
  onAttach?: (file: File) => void;
}

export function EverestComposer({ value, onChange, onSend, onStop, sending, placeholder, onAttach }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [listening, setListening] = useState(false);
  const [attached, setAttached] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = `${Math.min(ref.current.scrollHeight, 160)}px`;
  }, [value]);

  const startVoice = () => {
    const SR: unknown = (window as unknown as { webkitSpeechRecognition?: unknown; SpeechRecognition?: unknown }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (!SR) {
      alert('Voice input not supported in this browser. Try Chrome.');
      return;
    }
    // @ts-expect-error web speech
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = (e: { results: Array<Array<{ transcript: string }>> }) => {
      const t = e.results[0][0].transcript;
      onChange(value ? `${value} ${t}` : t);
    };
    try { rec.start(); } catch {/* ignore */}
  };

  return (
    <div className="rounded-2xl border shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      {attached && (
        <div className="flex items-center gap-2 border-b px-3 py-2 text-xs" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
          <Paperclip className="h-4 w-4" /> <span className="min-w-0 flex-1 truncate">{attached}</span>
          <button onClick={() => setAttached(null)} className="rounded-full p-1 hover:bg-black/10"><X className="h-4 w-4" /></button>
        </div>
      )}
      <div className="flex items-end gap-2 p-2">
        <input ref={fileRef} type="file" hidden onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setAttached(f.name);
          onAttach?.(f);
          onChange(value ? `${value}\n\n[Attached: ${f.name}]\n` : `Explain this file: ${f.name}`);
          e.target.value = '';
        }} accept=".txt,.md,.json,.csv,.pdf,.png,.jpg,.jpeg,.webp" />
        <button onClick={() => fileRef.current?.click()} className="rounded-xl p-2 hover:bg-black/5 dark:hover:bg-white/10" title="Attach file">
          <Paperclip className="h-5 w-5" style={{ color: 'var(--muted)' }} />
        </button>
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (value.trim() && !sending) onSend(); }
          }}
          placeholder={placeholder ?? 'Ask Everest anything — homework, code, ideas, Nepali, and more...'}
          rows={1}
          className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-3 text-[14px] leading-relaxed outline-none placeholder:text-muted"
        />
        <button
          onClick={startVoice}
          className={`rounded-xl p-2 ${listening ? 'animate-pulse bg-red-50 text-red-600' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
          title="Voice input"
        >
          <Mic className="h-5 w-5" style={{ color: listening ? undefined : 'var(--muted)' }} />
        </button>
        {sending ? (
          <Button onClick={onStop} variant="danger" size="sm" className="shrink-0 rounded-xl" icon={<Square className="h-4 w-4 fill-current" />}>
            Stop
          </Button>
        ) : (
          <Button onClick={onSend} disabled={!value.trim()} size="sm" className="shrink-0 rounded-xl" icon={<Send className="h-4 w-4" />}>
            Send
          </Button>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2 text-[11px]" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
        <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> Press Enter to send • Shift+Enter for new line</span>
        <span>{value.length} / 8000</span>
      </div>
    </div>
  );
}
