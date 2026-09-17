import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Lang } from '@/data/translations';
import { usePersistentState } from './usePersistentState';

export type Ayah = {
  number: number; // global number in the mushaf (1..6236), used for audio and sajda lookup
  numberInSurah: number;
  arabic: string;
  transliteration: string;
  translation: string;
};

type SurahDetailState = { ayahs: Ayah[]; loading: boolean; error: boolean };

const CACHE_VERSION = 1;
const cacheKey = (surah: number, lang: Lang) => `@surah_v${CACHE_VERSION}_${lang}_${surah}`;

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

type CloudEdition = { ayahs: { number: number; numberInSurah: number; text: string }[] };

const HARAKAT = /[ؐ-ًؚ-ٰٟۖ-ۭـ﻿]/g;
const skeleton = (word: string) => word.replace(HARAKAT, '').replace(/ٱ/g, 'ا');
const BASMALA_SKELETON = ['بسم', 'الله', 'الرحمن', 'الرحيم'];

// The Uthmani edition prepends the basmala to the first ayah of every surah except 1 and 9.
// It is not part of that ayah, so it is removed here and shown separately above the surah.
function stripBasmala(text: string): string {
  const clean = text.replace(/^﻿/, '');
  const words = clean.split(' ');
  if (words.length > 4 && words.slice(0, 4).every((w, i) => skeleton(w) === BASMALA_SKELETON[i])) {
    return words.slice(4).join(' ');
  }
  return clean;
}

async function downloadSurah(surah: number, lang: Lang): Promise<Ayah[]> {
  const editions = lang === 'ru' ? 'quran-uthmani,en.transliteration,ru.kuliev' : 'quran-uthmani,en.transliteration';
  const cloud = await fetchJson<{ data: CloudEdition[] }>(`https://api.alquran.cloud/v1/surah/${surah}/editions/${editions}`);
  const [arabic, transliteration, kuliev] = cloud.data;

  let translations: string[];
  if (lang === 'ky') {
    // Kyrgyz translation of the meanings by Shamsuddin Hakimov (QuranEnc.com, Rowwad Translation Center).
    const enc = await fetchJson<{ result: { aya: string; translation: string }[] }>(
      `https://quranenc.com/api/v1/translation/sura/kyrgyz_hakimov/${surah}`,
    );
    // Footnote markers like "[1]" refer to notes that are not shown in the app.
    const byAya = new Map(enc.result.map((r) => [Number(r.aya), r.translation.replace(/\s*\[\d+\]/g, '').trim()]));
    translations = arabic.ayahs.map((a) => byAya.get(a.numberInSurah) ?? '');
  } else {
    translations = kuliev.ayahs.map((a) => a.text);
  }

  if (arabic.ayahs.length === 0 || translations.length !== arabic.ayahs.length) throw new Error('Incomplete surah');
  return arabic.ayahs.map((a, i) => ({
    number: a.number,
    numberInSurah: a.numberInSurah,
    arabic: surah !== 1 && a.numberInSurah === 1 ? stripBasmala(a.text) : a.text.replace(/^﻿/, ''),
    transliteration: transliteration?.ayahs[i]?.text ?? '',
    translation: translations[i],
  }));
}

// Loads a surah with translation; every surah opened once is stored so it can be read offline.
export function useSurahDetail(surahNumber: number, lang: Lang): SurahDetailState & { refresh: () => void } {
  const [state, setState] = useState<SurahDetailState>({ ayahs: [], loading: true, error: false });

  const load = useCallback(async () => {
    setState({ ayahs: [], loading: true, error: false });
    const key = cacheKey(surahNumber, lang);
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        setState({ ayahs: JSON.parse(cached) as Ayah[], loading: false, error: false });
        return;
      }
    } catch {
      // fall through to network
    }
    try {
      const ayahs = await downloadSurah(surahNumber, lang);
      setState({ ayahs, loading: false, error: false });
      AsyncStorage.setItem(key, JSON.stringify(ayahs)).catch(() => {});
    } catch {
      setState({ ayahs: [], loading: false, error: true });
    }
  }, [surahNumber, lang]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}

export function useSurahFavorites() {
  const [favorites, setFavorites] = usePersistentState<number[]>('@surah_favorites', []);
  const toggleFavorite = (number: number) => {
    setFavorites((prev) => (prev.includes(number) ? prev.filter((n) => n !== number) : [...prev, number]));
  };
  return { favorites, toggleFavorite };
}

export type LastRead = { surahNumber: number; ayahNumber: number } | null;

export function useLastRead() {
  return usePersistentState<LastRead>('@quran_last_read_v2', null);
}
