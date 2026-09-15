import { usePersistentState } from './usePersistentState';

export function useTasbihCount() {
  const [count, setCount] = usePersistentState<number>('@tasbih_count', 0);
  const [total, setTotal] = usePersistentState<number>('@tasbih_total', 0);

  const increment = () => {
    setCount((prev) => prev + 1);
    setTotal((prev) => prev + 1);
  };
  const reset = () => setCount(0);

  return { count, total, increment, reset, setCount };
}
