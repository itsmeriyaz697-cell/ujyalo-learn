import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      counter.current += 1;
      const id = counter.current;
      setItems((current) => [...current.slice(-3), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), tone === 'error' ? 7000 : 4200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-3 bottom-3 z-[70] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:items-end"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lift',
            )}
            style={{
              background: 'var(--surface)',
              borderColor:
                item.tone === 'error'
                  ? 'color-mix(in srgb, var(--danger) 45%, transparent)'
                  : item.tone === 'success'
                    ? 'color-mix(in srgb, var(--success) 40%, transparent)'
                    : 'var(--border-strong)',
              color: 'var(--text)',
            }}
            role={item.tone === 'error' ? 'alert' : 'status'}
          >
            <span className="mt-0.5 shrink-0" aria-hidden="true">
              {item.tone === 'error' ? (
                <AlertTriangle className="h-4 w-4" style={{ color: 'var(--danger)' }} />
              ) : item.tone === 'success' ? (
                <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--success)' }} />
              ) : (
                <Info className="h-4 w-4" style={{ color: 'var(--primary)' }} />
              )}
            </span>
            <p className="flex-1 leading-snug">{item.message}</p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="-mr-1 rounded p-1 opacity-60 hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
