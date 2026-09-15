import { useCallback, useEffect, useState } from 'react';
import { usePersistentState } from './usePersistentState';

export type AsmaName = {
  number: number;
  name: string;
  transliteration: string;
  en: { meaning: string };
};

export function useAsmaHusna() {
  const [cached, setCached] = usePersistentState<AsmaName[]>('@asma_husna', []);
  const [loading, setLoading] = useState(cached.length === 0);
  const [error, setError] = useState(false);

  const fetchNames = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('https://api.aladhan.com/v1/asmaAlHusna');
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setCached(json.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchNames();
  }, [fetchNames]);

  return { names: cached, loading: loading && cached.length === 0, error, refresh: fetchNames };
}

// Deterministic "name of the day" so every user sees the same name on a given date.
export function nameOfTheDayIndex(total: number): number {
  const today = new Date();
  const dayOfYear = Math.floor(
    (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) -
      Date.UTC(today.getFullYear(), 0, 0)) /
      86400000,
  );
  return total > 0 ? dayOfYear % total : 0;
}
