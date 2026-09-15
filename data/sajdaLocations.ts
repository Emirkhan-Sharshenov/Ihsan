export type SajdaInfo = { globalAyahNumber: number; surahNumber: number; ayahInSurah: number; obligatory: boolean };

// Global ayah numbers and positions per the Uthmani mushaf, matching the
// canonical 15 sajdah list (source: api.alquran.cloud /v1/sajda/quran-uthmani).
export const sajdaLocations: SajdaInfo[] = [
  { globalAyahNumber: 1160, surahNumber: 7, ayahInSurah: 206, obligatory: false },
  { globalAyahNumber: 1722, surahNumber: 13, ayahInSurah: 15, obligatory: false },
  { globalAyahNumber: 1951, surahNumber: 16, ayahInSurah: 50, obligatory: false },
  { globalAyahNumber: 2138, surahNumber: 17, ayahInSurah: 109, obligatory: false },
  { globalAyahNumber: 2308, surahNumber: 19, ayahInSurah: 58, obligatory: false },
  { globalAyahNumber: 2613, surahNumber: 22, ayahInSurah: 18, obligatory: false },
  { globalAyahNumber: 2672, surahNumber: 22, ayahInSurah: 77, obligatory: false },
  { globalAyahNumber: 2915, surahNumber: 25, ayahInSurah: 60, obligatory: false },
  { globalAyahNumber: 3185, surahNumber: 27, ayahInSurah: 26, obligatory: false },
  { globalAyahNumber: 3518, surahNumber: 32, ayahInSurah: 15, obligatory: true },
  { globalAyahNumber: 3994, surahNumber: 38, ayahInSurah: 24, obligatory: false },
  { globalAyahNumber: 4256, surahNumber: 41, ayahInSurah: 38, obligatory: true },
  { globalAyahNumber: 4846, surahNumber: 53, ayahInSurah: 62, obligatory: true },
  { globalAyahNumber: 5905, surahNumber: 84, ayahInSurah: 21, obligatory: false },
  { globalAyahNumber: 6125, surahNumber: 96, ayahInSurah: 19, obligatory: true },
];

export const sajdaByGlobalNumber: Record<number, SajdaInfo> = Object.fromEntries(
  sajdaLocations.map((s) => [s.globalAyahNumber, s]),
);
