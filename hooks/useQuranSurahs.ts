import { useCallback, useEffect, useState } from 'react';
import { usePersistentState } from './usePersistentState';

export type Surah = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
};

type SurahState = {
  surahs: Surah[];
  loading: boolean;
  error: boolean;
};

export function useQuranSurahs(): SurahState & { refresh: () => void } {
  const [cached, setCached] = usePersistentState<Surah[]>('@quran_surah_list', []);
  const [loading, setLoading] = useState(cached.length === 0);
  const [error, setError] = useState(false);

  const fetchSurahs = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('https://api.alquran.cloud/v1/surah');
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      const list: Surah[] = json.data;
      setCached(list);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchSurahs();
  }, [fetchSurahs]);

  return { surahs: cached, loading: loading && cached.length === 0, error, refresh: fetchSurahs };
}

export type Ayah = {
  number: number;
  numberInSurah: number;
  text: string;
};

type SurahDetail = {
  arabicAyahs: Ayah[];
  transliterationAyahs: Ayah[];
  translationAyahs: Ayah[];
  loading: boolean;
  error: boolean;
};

const TRANSLATION_EDITION: Record<string, string> = {
  ru: 'ru.kuliev',
  ky: 'ru.kuliev',
};

const TRANSLITERATION_EDITION = 'en.transliteration';

export function useSurahDetail(surahNumber: number | null, lang: 'ru' | 'ky'): SurahDetail & { refresh: () => void } {
  const [state, setState] = useState<SurahDetail>({ arabicAyahs: [], transliterationAyahs: [], translationAyahs: [], loading: false, error: false });

  const fetchDetail = useCallback(async () => {
    if (surahNumber === null) return;
    setState((prev) => ({ ...prev, loading: true, error: false }));
    try {
      const edition = TRANSLATION_EDITION[lang] ?? 'ru.kuliev';
      const res = await fetch(
        `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,${TRANSLITERATION_EDITION},${edition}`,
      );
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      const [arabic, transliteration, translation] = json.data;
      setState({
        arabicAyahs: arabic.ayahs,
        transliterationAyahs: transliteration?.ayahs ?? [],
        translationAyahs: translation.ayahs,
        loading: false,
        error: false,
      });
    } catch {
      setState({ arabicAyahs: [], transliterationAyahs: [], translationAyahs: [], loading: false, error: true });
    }
  }, [surahNumber, lang]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { ...state, refresh: fetchDetail };
}
