import { cn } from '@/lib/utils';

interface LogoProps {
  size?: number;
  withText?: boolean;
  /** The brand line under the wordmark. Off in the header, on in the footer. */
  showTagline?: boolean;
  className?: string;
  textClassName?: string;
}

/**
 * Original Ujyalo Learn mark: the sun rising over an open book.
 *
 * The palette follows the 2.0 identity — navy tile, sunrise disc, paper-white
 * pages, sage shadow in the gutter. It is drawn here rather than imported so
 * the app icon, the favicon and the header lockup cannot drift apart.
 */
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
      <rect width="64" height="64" rx="14" fill="var(--logo-bg, #172b4d)" />
      <g stroke="#f49b45" strokeWidth="2.4" strokeLinecap="round">
        <path d="M32 9v4.6" />
        <path d="M19.6 13l2.8 3.4" />
        <path d="M44.4 13l-2.8 3.4" />
        <path d="M12.5 23.6l4.3 1.4" />
        <path d="M51.5 23.6l-4.3 1.4" />
      </g>
      <circle cx="32" cy="26.5" r="7.6" fill="#f49b45" />
      <path
        d="M8 37.5c7-4 16-3.4 24 2 8-5.4 17-6 24-2V50c-7-4-16-3.5-24 1.7C24 47.5 15 47 8 50V37.5Z"
        fill="#ffffff"
      />
      <path d="M32 39.5v12.1" stroke="#c3d8c8" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M13.5 40c4.5-2.1 9.9-2.1 14.5.4M50.5 40c-4.5-2.1-9.9-2.1-14.5.4"
        stroke="#172b4d"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity=".45"
      />
    </svg>
  );
}

export function Logo({ size = 36, withText = true, showTagline = false, className, textClassName }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      {withText && (
        <span className={cn('flex flex-col leading-none', textClassName)}>
          <span
            className="text-[17px] font-extrabold tracking-[-0.01em]"
            style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}
          >
            Ujyalo<span style={{ color: 'var(--accent-text)' }}>&nbsp;Learn</span>
          </span>
          {showTagline && (
            <span
              className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: 'var(--muted)' }}
            >
              Learn today. Lead tomorrow.
            </span>
          )}
        </span>
      )}
    </span>
  );
}
