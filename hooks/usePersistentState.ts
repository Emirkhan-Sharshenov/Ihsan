import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Listener<T> = (value: T) => void;
const listeners = new Map<string, Set<Listener<unknown>>>();
// Values already read from storage, so hooks mounted later start with the stored value instead of the default.
const memoryCache = new Map<string, unknown>();

function notify<T>(key: string, value: T) {
  listeners.get(key)?.forEach((fn) => fn(value));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Stored objects are merged over the defaults so settings added in a new app version get their default value.
function withDefaults<T>(stored: T, initial: T): T {
  if (isPlainObject(stored) && isPlainObject(initial)) return { ...initial, ...stored } as T;
  return stored;
}

export function usePersistentState<T>(
  key: string,
  initial: T,
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [state, setState] = useState<T>(() => (memoryCache.has(key) ? (memoryCache.get(key) as T) : initial));
  const [loaded, setLoaded] = useState(memoryCache.has(key));
  const ref = useRef(state);
  ref.current = state;

  useEffect(() => {
    let active = true;
    if (!memoryCache.has(key)) {
      AsyncStorage.getItem(key)
        .then((stored) => {
          if (!active) return;
          // Another instance may have written in the meantime; that value wins.
          if (memoryCache.has(key)) {
            setState(memoryCache.get(key) as T);
          } else if (stored !== null) {
            try {
              const parsed = withDefaults(JSON.parse(stored) as T, initial);
              memoryCache.set(key, parsed);
              setState(parsed);
              notify(key, parsed);
            } catch {
              // ignore corrupted value, keep default
            }
          }
        })
        .catch(() => {})
        .finally(() => active && setLoaded(true));
    }

    const listener: Listener<T> = (value) => {
      setState(value);
      setLoaded(true);
    };
    let set = listeners.get(key);
    if (!set) {
      set = new Set();
      listeners.set(key, set);
    }
    set.add(listener as Listener<unknown>);

    return () => {
      active = false;
      set?.delete(listener as Listener<unknown>);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = (value: T | ((prev: T) => T)) => {
    const next = typeof value === 'function' ? (value as (prev: T) => T)(ref.current) : value;
    ref.current = next;
    memoryCache.set(key, next);
    setState(next);
    AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {});
    notify(key, next);
  };

  return [state, update, loaded];
}
