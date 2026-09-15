import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Listener<T> = (value: T) => void;
const listeners = new Map<string, Set<Listener<unknown>>>();

function notify<T>(key: string, value: T) {
  const set = listeners.get(key);
  if (set) {
    set.forEach((fn) => fn(value));
  }
}

export function usePersistentState<T>(key: string, initial: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(state);
  ref.current = state;

  useEffect(() => {
    AsyncStorage.getItem(key).then((stored) => {
      if (stored !== null) {
        try {
          const parsed = JSON.parse(stored) as T;
          setState(parsed);
        } catch {
          // ignore parse errors
        }
      }
      setLoaded(true);
    });

    const listener: Listener<T> = (value) => {
      setState(value);
    };

    let set = listeners.get(key) as Set<Listener<T>> | undefined;
    if (!set) {
      set = new Set<Listener<T>>();
      listeners.set(key, set as unknown as Set<Listener<unknown>>);
    }
    set.add(listener as unknown as Listener<unknown>);

    return () => {
      set?.delete(listener as unknown as Listener<unknown>);
    };
  }, [key]);

  const update = (value: T | ((prev: T) => T)) => {
    const next = typeof value === 'function' ? (value as (prev: T) => T)(ref.current) : value;
    ref.current = next;
    setState(next);
    AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {});
    notify(key, next);
  };

  return [state, update];
}
