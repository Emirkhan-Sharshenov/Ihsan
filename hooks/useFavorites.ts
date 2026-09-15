import { usePersistentState } from './usePersistentState';

export function useFavorites() {
  const [favorites, setFavorites] = usePersistentState<string[]>('@dua_favorites', []);
  const toggleFavorite = (slug: string) => {
    setFavorites((prev) => prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]);
  };
  return { favorites, toggleFavorite, setFavorites };
}
