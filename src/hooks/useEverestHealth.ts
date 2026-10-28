import { useCallback, useEffect, useState } from 'react';
import { checkEverestHealth } from '@/services/ai/everestClient';
import type { EverestHealth } from '@/services/ai/everestClient';

export function useEverestHealth() {
  const [health, setHealth] = useState<EverestHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const next = await checkEverestHealth();
    setHealth(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    checkEverestHealth().then((next) => {
      if (!cancelled) {
        setHealth(next);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  return { health, loading, refresh, configured: health?.configured ?? false };
}
