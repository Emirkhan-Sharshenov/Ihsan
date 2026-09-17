import type { TranslationKeys } from './translations';
import type { Madhhab } from '@/lib/prayerTimes';

// The 15 places of prostration of recitation, by global ayah number in the Uthmani mushaf.
// Hanafis prostrate at 14 of them (not the second one in al-Hajj, 22:77); Shafi'is at 14 as well
// (not Sad 38:24, where they regard it as a prostration of gratitude outside prayer).
const SAJDA_AYAHS: Record<number, { surah: number; ayah: number }> = {
  1160: { surah: 7, ayah: 206 },
  1722: { surah: 13, ayah: 15 },
  1951: { surah: 16, ayah: 50 },
  2138: { surah: 17, ayah: 109 },
  2308: { surah: 19, ayah: 58 },
  2613: { surah: 22, ayah: 18 },
  2672: { surah: 22, ayah: 77 },
  2915: { surah: 25, ayah: 60 },
  3185: { surah: 27, ayah: 26 },
  3518: { surah: 32, ayah: 15 },
  3994: { surah: 38, ayah: 24 },
  4256: { surah: 41, ayah: 38 },
  4846: { surah: 53, ayah: 62 },
  5905: { surah: 84, ayah: 21 },
  6125: { surah: 96, ayah: 19 },
};

export function sajdaLabel(globalAyahNumber: number, madhab: Madhhab, t: TranslationKeys): string | null {
  const place = SAJDA_AYAHS[globalAyahNumber];
  if (!place) return null;
  if (place.surah === 22 && place.ayah === 77) return madhab === 'hanafi' ? t.quranSajdaNotHanafi : t.quranSajdaShafi;
  if (place.surah === 38) return madhab === 'hanafi' ? t.quranSajdaHanafi : t.quranSajdaSadShafi;
  return madhab === 'hanafi' ? t.quranSajdaHanafi : t.quranSajdaShafi;
}
