import { useCallback, useEffect, useState } from 'react';
import { checkAiHealth } from '@/services/ai/client';
import type { AiHealth } from '@/services/ai/types';

/** Checks whether the server has an AI provider configured. */
export function useAiHealth() {
  const [health, setHealth] = useState<AiHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const next = await checkAiHealth();
    setHealth(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    checkAiHealth().then((next) => {
      if (!cancelled) {
        setHealth(next);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { health, loading, refresh, configured: health?.configured ?? false };
}
