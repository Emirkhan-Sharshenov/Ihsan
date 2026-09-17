import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { cityById, GPS_CITY, isInKyrgyzstan, type CalcMethodId } from '@/data/cities';
import {
  applyAdjustments,
  computePrayerDay,
  fetchMuftiyatDays,
  localDateParts,
  type PrayerDay,
} from '@/lib/prayerTimes';
import { useSettings, type AppSettings } from './useSettings';
import { useNow } from './useNow';

export const DAYS_AHEAD = 7;
const OFFICIAL_FETCH_DAYS = 30;

const RUSSIAN_TIMEZONES = new Set([
  'Europe/Kaliningrad', 'Europe/Moscow', 'Europe/Simferopol', 'Europe/Kirov', 'Europe/Volgograd', 'Europe/Astrakhan',
  'Europe/Saratov', 'Europe/Ulyanovsk', 'Europe/Samara', 'Asia/Yekaterinburg', 'Asia/Omsk', 'Asia/Novosibirsk',
  'Asia/Barnaul', 'Asia/Tomsk', 'Asia/Novokuznetsk', 'Asia/Krasnoyarsk', 'Asia/Irkutsk', 'Asia/Chita', 'Asia/Yakutsk',
  'Asia/Khandyga', 'Asia/Vladivostok', 'Asia/Ust-Nera', 'Asia/Magadan', 'Asia/Sakhalin', 'Asia/Srednekolymsk',
  'Asia/Kamchatka', 'Asia/Anadyr',
]);

function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  } catch {
    return '';
  }
}

export type PrayerLocation = { lat: number; lon: number; utcOffset: number; isGps: boolean };

export function resolveMethod(settings: AppSettings, location: PrayerLocation | null): CalcMethodId {
  if (settings.method !== 'auto') return settings.method;
  const preset = cityById[settings.city];
  if (preset) return preset.method;
  if (location && isInKyrgyzstan(location.lat, location.lon)) return 'kyrgyzstan';
  if (RUSSIAN_TIMEZONES.has(deviceTimeZone())) return 'russia';
  return 'mwl';
}

export async function requestGpsCoords(): Promise<{ lat: number; lon: number } | null> {
  if (Platform.OS === 'web') {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return null;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 },
      );
    });
  }
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const last = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60000 });
    const pos = last ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    return { lat: pos.coords.latitude, lon: pos.coords.longitude };
  } catch {
    return null;
  }
}

// ---- Cache of the official Kyrgyz timetable, shared between hook instances ----

const officialMemory = new Map<string, PrayerDay[]>();
const inFlight = new Map<string, Promise<PrayerDay[]>>();
const cacheKey = (lat: number, lon: number) => `@muftiyat_${lat.toFixed(2)}_${lon.toFixed(2)}`;

async function loadOfficial(lat: number, lon: number, force: boolean): Promise<PrayerDay[]> {
  const key = cacheKey(lat, lon);
  let cached = officialMemory.get(key);
  if (!cached) {
    try {
      const raw = await AsyncStorage.getItem(key);
      cached = raw ? (JSON.parse(raw) as PrayerDay[]) : [];
    } catch {
      cached = [];
    }
    officialMemory.set(key, cached);
  }

  const today = localDateParts(360, 0);
  const lastNeeded = localDateParts(360, DAYS_AHEAD - 1);
  const keys = new Set(cached.map((d) => d.dateKey));
  const covered = [today, lastNeeded].every(
    (p) => keys.has(`${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`),
  );
  if (covered && !force) return cached;

  let request = inFlight.get(key);
  if (!request) {
    request = fetchMuftiyatDays(lat, lon, OFFICIAL_FETCH_DAYS)
      .then(async (fresh) => {
        if (fresh.length === 0) throw new Error('empty');
        officialMemory.set(key, fresh);
        await AsyncStorage.setItem(key, JSON.stringify(fresh)).catch(() => {});
        return fresh;
      })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, request);
  }
  try {
    return await request;
  } catch (e) {
    if (cached.length > 0) return cached;
    throw e;
  }
}

export type PrayerTimesState = {
  location: PrayerLocation | null;
  method: CalcMethodId;
  days: PrayerDay[]; // today first, adjusted by the user's minute corrections
  official: boolean;
  loading: boolean;
  error: 'gps' | 'network' | null;
  refresh: () => Promise<void>;
};

export function usePrayerTimes(): PrayerTimesState {
  const [settings, setSettings, settingsLoaded] = useSettings();
  // Tagged with the location it belongs to, so a previous city's timetable is never applied to a new one.
  const [official, setOfficial] = useState<{ key: string; days: PrayerDay[] }>({ key: '', days: [] });
  const [error, setError] = useState<'gps' | 'network' | null>(null);
  const [locating, setLocating] = useState(false);
  // Re-render once a minute so "today" rolls over at midnight.
  const now = useNow(60000);

  const isGps = settings.city === GPS_CITY;
  const preset = cityById[settings.city];

  const location: PrayerLocation | null = useMemo(() => {
    if (preset) return { lat: preset.lat, lon: preset.lon, utcOffset: preset.utcOffset, isGps: false };
    if (isGps && settings.gpsCoords) {
      return { ...settings.gpsCoords, utcOffset: -new Date().getTimezoneOffset(), isGps: true };
    }
    return null;
  }, [preset, isGps, settings.gpsCoords]);

  const method = resolveMethod(settings, location);

  const locate = useCallback(async () => {
    setLocating(true);
    const coords = await requestGpsCoords();
    setLocating(false);
    if (coords) {
      setError(null);
      setSettings((prev) => ({ ...prev, gpsCoords: coords }));
    } else {
      setError('gps');
    }
  }, [setSettings]);

  // Ask for GPS only when the user picked "my location" and we have no coordinates yet.
  useEffect(() => {
    if (settingsLoaded && isGps && !settings.gpsCoords) locate();
  }, [settingsLoaded, isGps, settings.gpsCoords, locate]);

  // muftiyat.kg sends no CORS headers, so the official timetable is only requested from the native app.
  const useOfficial =
    Platform.OS !== 'web' && method === 'kyrgyzstan' && location !== null && isInKyrgyzstan(location.lat, location.lon);

  const syncOfficial = useCallback(
    async (force: boolean) => {
      if (!useOfficial || !location) return;
      try {
        const days = await loadOfficial(location.lat, location.lon, force);
        setOfficial({ key: cacheKey(location.lat, location.lon), days });
        setError((e) => (e === 'network' ? null : e));
      } catch {
        setError((e) => e ?? 'network');
      }
    },
    [useOfficial, location],
  );

  const todayKey = location ? JSON.stringify(localDateParts(location.utcOffset, 0, now)) : '';

  useEffect(() => {
    if (!useOfficial) setError((e) => (e === 'network' ? null : e));
    syncOfficial(false);
  }, [syncOfficial, useOfficial, todayKey]);

  const days = useMemo(() => {
    if (!location) return [];
    const officialDays = useOfficial && official.key === cacheKey(location.lat, location.lon) ? official.days : [];
    const officialByDate = new Map(officialDays.map((d) => [d.dateKey, d]));
    const result: PrayerDay[] = [];
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const { year, month, day } = localDateParts(location.utcOffset, i, now);
      const computed = computePrayerDay(location.lat, location.lon, year, month, day, method, settings.madhab);
      const fromMuftiyat = officialByDate.get(computed.dateKey);
      let base = computed;
      if (fromMuftiyat) {
        // The Muftiyat publishes Hanafi Asr; for the Shafi'i Asr keep the calculated value.
        base = settings.madhab === 'hanafi' ? fromMuftiyat : { ...fromMuftiyat, times: { ...fromMuftiyat.times, asr: computed.times.asr } };
      }
      result.push(applyAdjustments(base, settings.adjustments));
    }
    return result;
    // `todayKey` changes at local midnight; `now` itself is intentionally not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, official, useOfficial, method, settings.madhab, settings.adjustments, todayKey]);

  const refresh = useCallback(async () => {
    if (isGps) await locate();
    await syncOfficial(true);
  }, [isGps, locate, syncOfficial]);

  return {
    location,
    method,
    days,
    official: days[0]?.official ?? false,
    loading: locating || (isGps && !settings.gpsCoords && error !== 'gps'),
    // A failed GPS refresh is harmless while the last known coordinates are still available.
    error: error === 'gps' && location ? null : error,
    refresh,
  };
}
