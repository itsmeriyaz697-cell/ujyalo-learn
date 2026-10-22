import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CommonProps {
  label?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & CommonProps>(function Input(
  { label, hint, error, optional, className, id, ...props },
  ref,
) {
  const generated = useId();
  const inputId = id ?? generated;
  const describedBy = [hint ? `${inputId}-hint` : '', error ? `${inputId}-error` : ''].filter(Boolean).join(' ');
  return (
    <div>
      {label && (
        <label className="label" htmlFor={inputId}>
          {label}
          {optional && <span className="ml-1 font-normal text-muted">(optional)</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn('input', error && 'border-[color:var(--danger)]', className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        {...props}
      />
      {hint && !error && (
        <p id={`${inputId}-hint`} className="hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & CommonProps>(function Textarea(
  { label, hint, error, optional, className, id, ...props },
  ref,
) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <div>
      {label && (
        <label className="label" htmlFor={inputId}>
          {label}
          {optional && <span className="ml-1 font-normal text-muted">(optional)</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={cn('input', error && 'border-[color:var(--danger)]', className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {hint && <p id={`${inputId}-hint`} className="hint">{hint}</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, CommonProps {
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, optional, className, id, children, ...props },
  ref,
) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <div>
      {label && (
        <label className="label" htmlFor={inputId}>
          {label}
          {optional && <span className="ml-1 font-normal text-muted">(optional)</span>}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        className={cn('input appearance-none bg-[length:16px] pr-9', className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235b6b8c' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.85rem center',
        }}
        aria-invalid={error ? true : undefined}
        {...props}
      >
        {children}
      </select>
      {hint && !error && <p className="hint">{hint}</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
});

export function Fieldset({ legend, description, children }: { legend: string; description?: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
        {legend}
      </legend>
      {description && <p className="mt-1 text-xs text-muted">{description}</p>}
      <div className="mt-2.5">{children}</div>
    </fieldset>
  );
}
