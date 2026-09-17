import { CalculationParameters, Coordinates, HighLatitudeRule, Madhab, PrayerTimes, Rounding } from 'adhan';
import type { CalcMethodId } from '@/data/cities';

export const PRAYER_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type PrayerKey = (typeof PRAYER_KEYS)[number];
export type PrayerTimesMap = Record<PrayerKey, number>; // epoch milliseconds
export type Adjustments = Record<PrayerKey, number>; // minutes

export type PrayerDay = {
  dateKey: string; // YYYY-MM-DD in the location's local time
  times: PrayerTimesMap;
  official: boolean; // true when the times come from the Muftiyat of Kyrgyzstan
};

export type Madhhab = 'hanafi' | 'shafi';

export const ZERO_ADJUSTMENTS: Adjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };

type MethodSpec = {
  fajrAngle: number;
  ishaAngle: number;
  ishaInterval?: number;
  // Precautionary minutes (ihtiyat) so that Dhuhr is not prayed at the exact zenith and
  // Maghrib/iftar never falls before the sun has fully set.
  ihtiyat: Adjustments;
};

export const METHODS: Record<CalcMethodId, MethodSpec> = {
  // Muftiyat of Kyrgyzstan: 18° / 16°, Maghrib = sunset + 7 min. These parameters reproduce the official
  // timetable (muftiyat.kg) within ±1 minute; checked for Bishkek, Osh and Karakol across all seasons.
  kyrgyzstan: { fajrAngle: 18, ishaAngle: 16, ihtiyat: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 1, maghrib: 7, isha: 0 } },
  // Spiritual Administration of Muslims of the Russian Federation: 16° / 15°.
  russia: { fajrAngle: 16, ishaAngle: 15, ihtiyat: { fajr: 0, sunrise: 0, dhuhr: 3, asr: 1, maghrib: 3, isha: 0 } },
  mwl: { fajrAngle: 18, ishaAngle: 17, ihtiyat: { fajr: 0, sunrise: 0, dhuhr: 3, asr: 1, maghrib: 3, isha: 0 } },
  ummalqura: { fajrAngle: 18.5, ishaAngle: 0, ishaInterval: 90, ihtiyat: { fajr: 0, sunrise: 0, dhuhr: 3, asr: 1, maghrib: 3, isha: 0 } },
};

export function computePrayerDay(
  lat: number,
  lon: number,
  year: number,
  month: number, // 1-12
  day: number,
  method: CalcMethodId,
  madhab: Madhhab,
): PrayerDay {
  const spec = METHODS[method];
  const params = new CalculationParameters('Other', spec.fajrAngle, spec.ishaAngle, spec.ishaInterval ?? 0);
  const coordinates = new Coordinates(lat, lon);
  params.madhab = madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  // Above ~48° latitude twilight never ends in summer; the "seventh of the night" rule keeps Fajr/Isha defined.
  params.highLatitudeRule = HighLatitudeRule.recommended(coordinates);
  params.rounding = Rounding.Nearest;
  params.methodAdjustments = { ...spec.ihtiyat };

  const pt = new PrayerTimes(coordinates, new Date(year, month - 1, day, 12), params);
  return {
    dateKey: toDateKey(year, month, day),
    times: {
      fajr: pt.fajr.getTime(),
      sunrise: pt.sunrise.getTime(),
      dhuhr: pt.dhuhr.getTime(),
      asr: pt.asr.getTime(),
      maghrib: pt.maghrib.getTime(),
      isha: pt.isha.getTime(),
    },
    official: false,
  };
}

export function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Calendar date (y, m, d) at the given UTC offset, `daysAhead` days from now.
export function localDateParts(utcOffsetMinutes: number, daysAhead = 0, now = Date.now()) {
  const shifted = new Date(now + utcOffsetMinutes * 60000 + daysAhead * 86400000);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
}

export function formatTime(epochMs: number, utcOffsetMinutes: number): string {
  const d = new Date(epochMs + utcOffsetMinutes * 60000);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

export function applyAdjustments(day: PrayerDay, adjustments: Adjustments): PrayerDay {
  const times = { ...day.times };
  for (const key of PRAYER_KEYS) times[key] += (adjustments[key] ?? 0) * 60000;
  return { ...day, times };
}

// ---- Official timetable of the Muftiyat of Kyrgyzstan (public API, https://muftiyat.kg/ru/calendar/api/) ----

type MuftiyatRow = { date: string; fajr: string; sunrise: string; dhuhr: string; asr: string; maghrib: string; isha: string };

const KG_UTC_OFFSET = 360;

function parseKgTime(date: string, time: string): number {
  const [d, m, y] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return Date.UTC(y, m - 1, d, hh, mm) - KG_UTC_OFFSET * 60000;
}

export async function fetchMuftiyatDays(lat: number, lon: number, days: number): Promise<PrayerDay[]> {
  const fmt = (p: { year: number; month: number; day: number }) =>
    `${String(p.day).padStart(2, '0')}-${String(p.month).padStart(2, '0')}-${p.year}`;
  const start = fmt(localDateParts(KG_UTC_OFFSET, 0));
  const end = fmt(localDateParts(KG_UTC_OFFSET, days - 1));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(
      `https://muftiyat.kg/ru/api/v1/calendar/?lat=${lat.toFixed(1)}&lng=${lon.toFixed(1)}&start=${start}&end=${end}`,
      { signal: controller.signal },
    );
    if (!res.ok) throw new Error(`Muftiyat API ${res.status}`);
    const json = (await res.json()) as { prayertimes?: MuftiyatRow[] };
    const rows = json.prayertimes ?? [];
    const valid = /^\d{1,2}:\d{2}$/;
    return rows
      .filter((r) => PRAYER_KEYS.every((k) => valid.test(r[k])))
      .map((r) => {
        const [d, m, y] = r.date.split('-').map(Number);
        return {
          dateKey: toDateKey(y, m, d),
          official: true,
          times: {
            fajr: parseKgTime(r.date, r.fajr),
            sunrise: parseKgTime(r.date, r.sunrise),
            dhuhr: parseKgTime(r.date, r.dhuhr),
            asr: parseKgTime(r.date, r.asr),
            maghrib: parseKgTime(r.date, r.maghrib),
            isha: parseKgTime(r.date, r.isha),
          },
        };
      });
  } finally {
    clearTimeout(timer);
  }
}

// ---- Next / current prayer ----

export const FARD_KEYS: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

// Returns the next fard prayer across today and tomorrow, or null when no future time is known.
export function getNextPrayer(days: PrayerDay[], now = Date.now()): { key: PrayerKey; time: number } | null {
  for (const day of days) {
    for (const key of FARD_KEYS) {
      if (day.times[key] > now) return { key, time: day.times[key] };
    }
  }
  return null;
}

// The prayer whose time is currently running. Between sunrise and Dhuhr no fard prayer is due,
// so 'sunrise' is returned for that window.
export function getCurrentPrayerKey(today: PrayerDay, now = Date.now()): PrayerKey | null {
  let current: PrayerKey | null = null;
  for (const key of PRAYER_KEYS) {
    if (today.times[key] <= now) current = key;
  }
  return current;
}
