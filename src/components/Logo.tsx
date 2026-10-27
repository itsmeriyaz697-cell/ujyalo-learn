import { cn } from '@/lib/utils';

interface LogoProps {
  size?: number;
  withText?: boolean;
  className?: string;
  textClassName?: string;
}

/** Original Ujyalo Learn mark: rising sun over an open book, with light rays. */
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect width="64" height="64" rx="15" fill="var(--logo-bg, #15245F)" />
      <g stroke="#F7B733" strokeWidth="2.4" strokeLinecap="round">
        <path d="M32 9v4.6" />
        <path d="M19.6 13l2.8 3.4" />
        <path d="M44.4 13l-2.8 3.4" />
        <path d="M12.5 23.6l4.3 1.4" />
        <path d="M51.5 23.6l-4.3 1.4" />
      </g>
      <circle cx="32" cy="26.5" r="7.6" fill="#F7B733" />
      <path
        d="M8 37.5c7-4 16-3.4 24 2 8-5.4 17-6 24-2V50c-7-4-16-3.5-24 1.7C24 47.5 15 47 8 50V37.5Z"
        fill="#FFFFFF"
      />
      <path d="M32 39.5v12.1" stroke="#92B0FF" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M13.5 40c4.5-2.1 9.9-2.1 14.5.4M50.5 40c-4.5-2.1-9.9-2.1-14.5.4"
        stroke="#2947D6"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity=".55"
      />
    </svg>
  );
}

export function Logo({ size = 36, withText = true, className, textClassName }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      {withText && (
        <span className={cn('flex flex-col leading-none', textClassName)}>
          <span className="text-[17px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            Ujyalo <span style={{ color: 'var(--primary)' }}>Learn</span>
          </span>
          <span className="mt-1 hidden text-[10px] font-medium uppercase tracking-[0.16em] sm:block" style={{ color: 'var(--muted)' }}>
            Grades 1–12 · Nepal
          </span>
        </span>
      )}
    </span>
  );
}
