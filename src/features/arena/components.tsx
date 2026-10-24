/**
 * Arena presentation components.
 *
 * Everything here is dumb: it renders what it is given. The one piece of real
 * logic is the avatar, which is generated from the handle so that no student
 * ever has to upload a photo — no moderation burden, no personal image on a
 * public leaderboard, and it looks identical everywhere.
 */
import { Link } from 'react-router-dom';
import { Crown, Loader2, Medal, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORY_META, percent, type ArenaCategory, type BadgeId } from '../../../shared/arena/scoring';
import { avatarInitials, avatarStyle } from './avatar';

export function Avatar({ handle, size = 'md' }: { handle: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = avatarInitials(handle);
  const dimensions = size === 'lg' ? 'h-16 w-16 text-xl' : size === 'sm' ? 'h-8 w-8 text-[11px]' : 'h-10 w-10 text-sm';
  return (
    <span
      aria-hidden="true"
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-bold tracking-wide', dimensions)}
      style={avatarStyle(handle)}
    >
      {initials}
    </span>
  );
}

export function RankMedal({ rank, className }: { rank: number; className?: string }) {
  if (rank === 1) {
    return (
      <span className={cn('inline-flex items-center gap-1 font-semibold', className)} style={{ color: 'var(--accent-text)' }}>
        <Trophy className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">First place, gold: </span>1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className={cn('inline-flex items-center gap-1 font-semibold', className)} style={{ color: 'var(--muted)' }}>
        <Medal className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Second place, silver: </span>2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className={cn('inline-flex items-center gap-1 font-semibold', className)} style={{ color: '#b26a3a' }}>
        <Medal className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Third place, bronze: </span>3
      </span>
    );
  }
  return <span className={cn('tabular-nums', className)}>{rank}</span>;
}

export function StatTile({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
          {label}
        </p>
        {icon && <span style={{ color: 'var(--primary)' }} aria-hidden="true">{icon}</span>}
      </div>
      <p className="mt-1.5 text-2xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[12px]" style={{ color: 'var(--muted)' }}>{hint}</p>}
    </div>
  );
}

export function CategoryTile({
  id,
  selected,
  onSelect,
  disabled,
}: {
  id: ArenaCategory;
  selected?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
}) {
  const meta = CATEGORY_META[id];
  const Comp = onSelect ? 'button' : 'div';
  return (
    <Comp
      {...(onSelect ? { type: 'button' as const, onClick: onSelect, disabled } : {})}
      aria-pressed={onSelect ? selected : undefined}
      className={cn(
        'card flex h-full flex-col items-start gap-1 p-3.5 text-left transition',
        onSelect && 'card-hover cursor-pointer',
        selected && 'ring-2',
      )}
      style={selected ? { borderColor: 'var(--primary)', background: 'var(--primary-soft)' } : undefined}
    >
      <span className="text-lg" aria-hidden="true">{meta.icon}</span>
      <span className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--text)' }}>
        {meta.label}
      </span>
      <span className="text-[11px] leading-snug" style={{ color: 'var(--muted)' }}>
        {meta.blurb}
      </span>
    </Comp>
  );
}

export function DifficultyPill({ difficulty }: { difficulty: 'easy' | 'medium' | 'hard' }) {
  const style =
    difficulty === 'easy'
      ? { background: 'var(--success-soft)', color: 'var(--success)' }
      : difficulty === 'hard'
        ? { background: 'var(--danger-soft)', color: 'var(--danger)' }
        : { background: 'var(--accent-soft)', color: 'var(--accent-text)' };
  return (
    <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize" style={style}>
      {difficulty}
    </span>
  );
}

export function BadgeChip({
  badge,
  earned = true,
}: {
  badge: { id: BadgeId; label: string; icon: string };
  earned?: boolean;
}) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium')}
      style={
        earned
          ? { borderColor: 'var(--border-strong)', background: 'var(--surface-2)', color: 'var(--text)' }
          : { borderColor: 'var(--border)', background: 'transparent', color: 'var(--muted)', opacity: 0.65 }
      }
    >
      <span aria-hidden="true">{badge.icon}</span>
      {badge.label}
      {!earned && <span className="sr-only"> (not earned yet)</span>}
    </span>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm" style={{ color: 'var(--muted)' }} role="status">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

export function Podium({ rows }: { rows: Array<{ handle: string; points: number; flag: string; rank: number }> }) {
  if (!rows.length) {
    return (
      <p className="text-[13px]" style={{ color: 'var(--muted)' }}>
        Nobody has scored yet. The first person to finish a quiz takes this spot.
      </p>
    );
  }
  const order = [1, 0, 2];
  const heights = ['mt-6', 'mt-0', 'mt-8'];
  return (
    <div className="grid grid-cols-3 items-end gap-2 sm:gap-3">
      {order.map((index, slot) => {
        const row = rows[index];
        if (!row) return <div key={`empty-${slot}`} />;
        return (
          <Link
            key={row.handle}
            to={`/global-quiz/player/${row.handle}`}
            className={cn('card flex flex-col items-center gap-1.5 p-3 text-center transition hover:-translate-y-0.5', heights[slot])}
            style={row.rank === 1 ? { borderColor: 'var(--accent)' } : undefined}
          >
            {row.rank === 1 && <Crown className="h-4 w-4" style={{ color: 'var(--accent-text)' }} aria-hidden="true" />}
            <Avatar handle={row.handle} size={row.rank === 1 ? 'lg' : 'md'} />
            <span className="max-w-full truncate text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
              {row.handle}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
              <span aria-hidden="true">{row.flag}</span> {row.points.toLocaleString()} pts
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function LeaderboardRows({
  rows,
  showRank = true,
}: {
  rows: Array<{
    rank: number;
    handle: string;
    country: string;
    flag: string;
    points: number;
    quizzes: number;
    accuracy: number;
    isYou?: boolean;
  }>;
  showRank?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
            {showRank && <th scope="col" className="py-2 pr-2 font-semibold">Rank</th>}
            <th scope="col" className="py-2 pr-2 font-semibold">Student</th>
            <th scope="col" className="py-2 pr-2 font-semibold">Country</th>
            <th scope="col" className="py-2 pr-2 text-right font-semibold">Points</th>
            <th scope="col" className="py-2 pr-2 text-right font-semibold">Quizzes</th>
            <th scope="col" className="py-2 text-right font-semibold">Accuracy</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.rank}-${row.handle}`}
              className="border-t"
              style={{
                borderColor: 'var(--border)',
                background: row.isYou ? 'var(--primary-soft)' : undefined,
              }}
            >
              {showRank && (
                <td className="py-2.5 pr-2">
                  <RankMedal rank={row.rank} />
                </td>
              )}
              <td className="py-2.5 pr-2">
                <Link to={`/global-quiz/player/${row.handle}`} className="flex items-center gap-2 font-medium">
                  <Avatar handle={row.handle} size="sm" />
                  <span className="truncate" style={{ color: 'var(--text)' }}>
                    {row.handle}
                  </span>
                  {row.isYou && <span className="badge badge-brand">You</span>}
                </Link>
              </td>
              <td className="py-2.5 pr-2" style={{ color: 'var(--text-soft)' }}>
                <span aria-hidden="true">{row.flag}</span> <span className="text-[12px]">{row.country}</span>
              </td>
              <td className="py-2.5 pr-2 text-right font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                {row.points.toLocaleString()}
              </td>
              <td className="py-2.5 pr-2 text-right tabular-nums" style={{ color: 'var(--text-soft)' }}>
                {row.quizzes}
              </td>
              <td className="py-2.5 text-right tabular-nums" style={{ color: 'var(--text-soft)' }}>
                {percent(Math.round((row.accuracy / 100) * 100), 100)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DemoNotice({ children }: { children?: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border p-3 text-[13px] leading-relaxed"
      style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)', color: 'var(--text)' }}
      role="note"
    >
      <strong className="font-semibold">Demo mode.</strong>{' '}
      {children ?? (
        <>
          The Arena database is not connected on this deployment, so everything here is stored only in this browser.
          These are <em>not</em> real global rankings and nothing is shared with other students.
        </>
      )}
    </div>
  );
}
