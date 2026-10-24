/**
 * Deterministic avatar colours.
 *
 * Kept out of the components file so that file only exports components (the
 * fast-refresh rule), and so the same handle always gets the same colour
 * wherever it appears — leaderboard, profile, results.
 */
const AVATAR_HUES = [212, 232, 262, 286, 322, 348, 8, 30, 44, 160, 184];

export function avatarStyle(handle: string): { background: string; color: string } {
  let hash = 0;
  for (const ch of handle) hash = (hash * 31 + ch.charCodeAt(0)) % 100000;
  const hue = AVATAR_HUES[hash % AVATAR_HUES.length];
  return {
    background: `linear-gradient(140deg, hsl(${hue} 72% 46%), hsl(${(hue + 38) % 360} 78% 34%))`,
    color: '#fff',
  };
}

export function avatarInitials(handle: string): string {
  return handle.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || '?';
}
