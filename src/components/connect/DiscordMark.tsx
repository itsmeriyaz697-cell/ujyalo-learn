/**
 * The Discord mark, drawn locally.
 *
 * Deliberately a simplified interpretation rather than a copy of Discord's
 * asset: the official logo and wordmark are trademarks, and shipping a
 * hand-traced version would be both inaccurate and presumptuous. The shape is
 * recognisable so a visitor knows which account they are about to use, and the
 * docs say to swap in the official asset from Discord's brand kit before a
 * public launch.
 */
export function DiscordMark({
  size = 22,
  className,
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={style}
    >
      <path d="M19.6 5.2A16.9 16.9 0 0 0 15.5 4l-.3.6a12.6 12.6 0 0 1 3.6 1.7 15.9 15.9 0 0 0-13.6 0A12.6 12.6 0 0 1 8.8 4.6L8.5 4a16.9 16.9 0 0 0-4.1 1.2C1.8 9.3 1 13.3 1.4 17.3a17 17 0 0 0 5.1 2.6l1-1.7a11 11 0 0 1-1.8-.9l.4-.3a12.2 12.2 0 0 0 10.4 0l.4.3c-.6.4-1.2.7-1.8.9l1 1.7a17 17 0 0 0 5.1-2.6c.5-4.7-.7-8.7-2.6-12.1ZM8.6 14.9c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm6.8 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z" />
    </svg>
  );
}
