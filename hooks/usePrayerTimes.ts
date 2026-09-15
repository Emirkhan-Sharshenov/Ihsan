import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { prayerSchedules, cityNames, GPS_CITY, type PrayerTime } from '@/data/prayerTimes';

type CityCoords = { lat: number; lon: number; method: number };

const GPS_METHOD = 3;

async function resolveGpsCoords(): Promise<CityCoords | null> {
  if (Platform.OS === 'web') {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return null;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, method: GPS_METHOD }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 },
      );
    });
  }

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: pos.coords.latitude, lon: pos.coords.longitude, method: GPS_METHOD };
  } catch {
    return null;
  }
}

const cityCoords: Record<string, CityCoords> = {
  'Москва': { lat: 55.7558, lon: 37.6173, method: 2 },
  'Казань': { lat: 55.8304, lon: 49.0661, method: 2 },
  'Грозный': { lat: 43.3179, lon: 45.6985, method: 3 },
  'Махачкала': { lat: 42.9849, lon: 47.5047, method: 3 },
  'Уфа': { lat: 54.7388, lon: 55.9721, method: 2 },
  'Бишкек': { lat: 42.8746, lon: 74.5698, method: 2 },
  'Ош': { lat: 40.5283, lon: 72.7985, method: 2 },
  'Жалал-Абад': { lat: 40.9333, lon: 73.0, method: 2 },
};

export type HijriDate = {
  day: string;
  monthNumber: number;
  monthEn: string;
  year: string;
} | null;

type PrayerState = {
  timings: PrayerTime[];
  loading: boolean;
  error: boolean;
  hijri: HijriDate;
};

function parseTimings(data: Record<string, string>): PrayerTime[] {
  const order: [string, string, string][] = [
    ['Fajr', 'الفجر', 'Фаджр'],
    ['Dhuhr', 'الظهر', 'Зухр'],
    ['Asr', 'العصر', 'Аср'],
    ['Maghrib', 'المغرب', 'Магриб'],
    ['Isha', 'العشاء', 'Иша'],
  ];
  return order.map(([key, arabic, name]) => ({
    name,
    arabicName: arabic,
    time: (data[key] || '00:00').split(' ')[0],
  }));
}

export function usePrayerTimes(city: string, madhab: 'shafi' | 'hanafi' = 'shafi'): PrayerState & { refresh: () => void } {
  const [state, setState] = useState<PrayerState>({
    timings: prayerSchedules[city]?.timings ?? prayerSchedules['Москва'].timings,
    loading: false,
    error: false,
    hijri: null,
  });

  const fetchTimes = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: false }));

    const coords = city === GPS_CITY ? await resolveGpsCoords() : cityCoords[city];
    if (!coords) {
      if (city === GPS_CITY) {
        setState((prev) => ({ ...prev, loading: false, error: true }));
      } else {
        setState((prev) => ({ ...prev, timings: prayerSchedules[city]?.timings ?? [], loading: false, error: false }));
      }
      return;
    }

    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    const school = madhab === 'hanafi' ? 1 : 0;

    try {
      const res = await fetch(
        `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${coords.lat}&longitude=${coords.lon}&method=${coords.method}&school=${school}`,
      );
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      const timings = parseTimings(json.data.timings);
      const hijri: HijriDate = json.data.date?.hijri
        ? {
            day: json.data.date.hijri.day,
            monthNumber: Number(json.data.date.hijri.month?.number ?? 0),
            monthEn: json.data.date.hijri.month?.en ?? '',
            year: json.data.date.hijri.year,
          }
        : null;
      setState({ timings, loading: false, error: false, hijri });
    } catch {
      setState((prev) => ({ ...prev, loading: false, error: true }));
    }
  }, [city, madhab]);

  useEffect(() => {
    fetchTimes();
  }, [fetchTimes]);

  return { ...state, refresh: fetchTimes };
}
