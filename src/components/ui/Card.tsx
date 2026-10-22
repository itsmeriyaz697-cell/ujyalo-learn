import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('card', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 px-5 pt-5', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span
            className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold leading-6" style={{ color: 'var(--text)' }}>
            {title}
          </h2>
          {description && <p className="mt-0.5 text-[13px] leading-5 text-muted">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>;
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: 'default' | 'gold' | 'success';
}) {
  const toneStyles = {
    default: { bg: 'var(--primary-soft)', fg: 'var(--primary)' },
    gold: { bg: 'var(--accent-soft)', fg: 'var(--accent)' },
    success: { bg: 'var(--success-soft)', fg: 'var(--success)' },
  }[tone];

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-medium uppercase tracking-wide text-muted">{label}</p>
        {icon && (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: toneStyles.bg, color: toneStyles.fg }} aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
