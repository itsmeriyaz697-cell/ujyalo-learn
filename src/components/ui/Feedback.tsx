import type { ReactNode } from 'react';
import { AlertCircle, Inbox, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export function Spinner({ size = 18, className, label = 'Loading' }: { size?: number; className?: string; label?: string }) {
  return (
    <span role="status" aria-live="polite" className={cn('inline-flex items-center', className)}>
      <Loader2 className="animate-spin" style={{ width: size, height: size }} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <Spinner size={26} />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl px-6 py-10 text-center', className)}>
      <span
        className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
        aria-hidden="true"
      >
        {icon ?? <Inbox className="h-6 w-6" />}
      </span>
      <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
        {title}
      </h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl px-6 py-10 text-center" role="alert">
      <span
        className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
        aria-hidden="true"
      >
        <AlertCircle className="h-6 w-6" />
      </span>
      <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
        {title}
      </h3>
      {message && <p className="mt-1 max-w-md text-sm text-muted">{message}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry} icon={<RefreshCw className="h-4 w-4" />}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export function InlineAlert({
  tone = 'info',
  title,
  children,
  action,
}: {
  tone?: 'info' | 'warning' | 'success' | 'danger';
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const styles = {
    info: { bg: 'var(--primary-soft)', fg: 'var(--primary)', border: 'color-mix(in srgb, var(--primary) 30%, transparent)' },
    warning: { bg: 'var(--accent-soft)', fg: 'color-mix(in srgb, var(--accent) 72%, black)', border: 'color-mix(in srgb, var(--accent) 45%, transparent)' },
    success: { bg: 'var(--success-soft)', fg: 'var(--success)', border: 'color-mix(in srgb, var(--success) 30%, transparent)' },
    danger: { bg: 'var(--danger-soft)', fg: 'var(--danger)', border: 'color-mix(in srgb, var(--danger) 30%, transparent)' },
  }[tone];

  return (
    <div
      className="flex flex-wrap items-start gap-3 rounded-xl border px-4 py-3 text-sm"
      style={{ background: styles.bg, borderColor: styles.border, color: styles.fg }}
      role={tone === 'danger' ? 'alert' : undefined}
    >
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="mt-0.5 leading-relaxed opacity-90">{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function ProgressBar({
  value,
  max = 100,
  label,
  tone = 'brand',
  className,
}: {
  value: number;
  max?: number;
  label?: string;
  tone?: 'brand' | 'gold' | 'success';
  className?: string;
}) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const color = tone === 'gold' ? 'var(--accent)' : tone === 'success' ? 'var(--success)' : 'var(--primary)';
  return (
    <div className={className}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
          <span>{label}</span>
          <span>{Math.round(percent)}%</span>
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ background: 'var(--surface-3)' }}
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
      >
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${percent}%`, background: color }} />
      </div>
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      className="rounded border px-1.5 py-0.5 text-[10px] font-semibold"
      style={{ borderColor: 'var(--border-strong)', background: 'var(--surface-2)', color: 'var(--muted)' }}
    >
      {children}
    </kbd>
  );
}
