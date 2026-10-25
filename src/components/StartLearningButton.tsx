import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { useStartLearning } from '@/features/auth/useStartLearning';

/**
 * A primary call to action that lets a visitor in without a form.
 * Use this instead of linking to /signup for anything that says "start".
 */
export function StartLearningButton({
  children = 'Start learning free',
  to,
  size = 'lg',
  variant = 'primary',
  fullWidth,
  className,
  iconRight,
}: {
  children?: ReactNode;
  /** Where the visitor lands. Defaults to the tutor. */
  to?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent';
  fullWidth?: boolean;
  className?: string;
  iconRight?: ReactNode;
}) {
  const { start, busy } = useStartLearning();

  return (
    <Button onClick={() => start(to)} loading={busy} size={size} variant={variant} fullWidth={fullWidth} className={className} iconRight={iconRight}>
      {children}
    </Button>
  );
}
