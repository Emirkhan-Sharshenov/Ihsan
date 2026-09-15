import { usePersistentState } from './usePersistentState';

export function useSurahFavorites() {
  const [favorites, setFavorites] = usePersistentState<number[]>('@surah_favorites', []);
  const toggleFavorite = (number: number) => {
    setFavorites((prev) => (prev.includes(number) ? prev.filter((n) => n !== number) : [...prev, number]));
  };
  return { favorites, toggleFavorite, setFavorites };
}

export type LastRead = { surahNumber: number; surahName: string; ayahNumber: number } | null;

export function useLastRead() {
  return usePersistentState<LastRead>('@quran_last_read', null);
}
