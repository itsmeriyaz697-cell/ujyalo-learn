import { Children, cloneElement, forwardRef, isValidElement, type ButtonHTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  /** Renders the single child (e.g. a router Link) with button styles. */
  asChild?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  accent: 'btn-accent',
  danger: 'btn-danger',
};

const sizeClass: Record<Size, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading,
    icon,
    iconRight,
    fullWidth,
    asChild,
    className,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  const classes = cn('btn', variantClass[variant], sizeClass[size], fullWidth && 'w-full', className);

  if (asChild) {
    const child = Children.only(children) as ReactElement<{ className?: string }>;
    if (!isValidElement(child)) return null;
    return cloneElement(child, {
      className: cn(classes, child.props.className),
      ...(props as Record<string, unknown>),
    });
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
});
