/** Human-friendly formatting helpers (no external date library). */

export function formatDate(iso: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, options ?? { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatRelative(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const diff = now.getTime() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (Math.abs(minutes) < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return formatDate(date, { day: 'numeric', month: 'short' });
}

export function formatDayLabel(isoDate: string, now = new Date()): string {
  const today = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);
  if (isoDate === today) return 'Today';
  if (isoDate === tomorrow) return 'Tomorrow';
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatMinutes(total: number): string {
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`;
}

export function formatCount(n: number): string {
  return new Intl.NumberFormat().format(n);
}

export function truncate(text: string, max = 80): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

/** Uses the Unicode Devanagari digits for Nepali-language UI where helpful. */
export function inNepaliDigits(input: string | number): string {
  const digits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(input).replace(/\d/g, (d) => digits[Number(d)]);
}
