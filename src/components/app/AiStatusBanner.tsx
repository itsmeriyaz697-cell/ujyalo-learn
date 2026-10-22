import { Link } from 'react-router-dom';
import { PlugZap, RefreshCw } from 'lucide-react';
import { InlineAlert } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import type { AiHealth } from '@/services/ai/types';

/**
 * Shown when the server has no AI provider configured. It explains exactly
 * what is missing instead of pretending the tutor is working.
 */
export function AiStatusBanner({
  health,
  loading,
  onRetry,
  compact,
}: {
  health: AiHealth | null;
  loading?: boolean;
  onRetry?: () => void;
  compact?: boolean;
}) {
  if (loading) return null;
  if (health?.configured) return null;

  return (
    <div className={compact ? 'mb-3' : 'mb-5'}>
      <InlineAlert
        tone="warning"
        title="The AI provider is not connected yet"
        action={
          <div className="flex gap-2">
            {onRetry && (
              <Button variant="secondary" size="sm" onClick={onRetry} icon={<RefreshCw className="h-3.5 w-3.5" />}>
                Recheck
              </Button>
            )}
            <Button asChild variant="ghost" size="sm">
              <Link to="/help">Setup help</Link>
            </Button>
          </div>
        }
      >
        <span className="inline-flex items-start gap-1.5">
          <PlugZap className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            AI answers, quiz generation and AI flashcards are unavailable until the site owner sets the server-side
            <code className="mx-1 rounded px-1">AI_API_KEY</code>, <code className="mx-1 rounded px-1">AI_API_BASE_URL</code>
            and <code className="mx-1 rounded px-1">AI_MODEL</code> environment variables. Notes, the planner and your
            existing records still work.
          </span>
        </span>
      </InlineAlert>
    </div>
  );
}
