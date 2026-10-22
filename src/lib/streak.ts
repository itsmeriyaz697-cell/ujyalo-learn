import { todayISO } from './utils';

export interface StreakResult {
  current: number;
  longest: number;
  lastActiveDate: string | null;
}

/**
 * Calculates learning streaks from real activity dates.
 * A streak stays "current" if the last activity was today or yesterday,
 * so students are not punished before their day has ended.
 */
export function computeStreak(activityDates: string[], now = new Date()): StreakResult {
  const days = Array.from(
    new Set(
      activityDates
        .filter((iso) => /^\d{4}-\d{2}-\d{2}$/.test(iso.slice(0, 10)))
        .map((iso) => iso.slice(0, 10)),
    ),
  ).sort();

  if (!days.length) return { current: 0, longest: 0, lastActiveDate: null };

  const today = todayISO(now);
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = todayISO(yesterdayDate);

  // Longest run.
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i += 1) {
    const prev = new Date(`${days[i - 1]}T00:00:00Z`).getTime();
    const next = new Date(`${days[i]}T00:00:00Z`).getTime();
    if (next - prev === 86400000) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
  }

  // Current run, walking backwards from today / yesterday.
  const last = days[days.length - 1];
  let current = 0;
  if (last === today || last === yesterday) {
    current = 1;
    for (let i = days.length - 1; i > 0; i -= 1) {
      const prev = new Date(`${days[i - 1]}T00:00:00Z`).getTime();
      const next = new Date(`${days[i]}T00:00:00Z`).getTime();
      if (next - prev === 86400000) current += 1;
      else break;
    }
  }

  return { current, longest, lastActiveDate: last };
}
