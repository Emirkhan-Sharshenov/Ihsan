import { usePersistentState } from './usePersistentState';
import { DEFAULT_CITY_ID, type CalcMethodId } from '@/data/cities';
import { ZERO_ADJUSTMENTS, type Adjustments, type Madhhab } from '@/lib/prayerTimes';

export type AppSettings = {
  city: string; // city id or GPS_CITY
  gpsCoords: { lat: number; lon: number } | null;
  method: 'auto' | CalcMethodId;
  madhab: Madhhab;
  adjustments: Adjustments;
  notificationsEnabled: boolean;
  remindBeforeMinutes: 0 | 10 | 15 | 30;
  hijriAdjust: number;
  tasbihGoal: number;
  tasbihPhrases: string[];
};

export const defaultSettings: AppSettings = {
  city: DEFAULT_CITY_ID,
  gpsCoords: null,
  method: 'auto',
  madhab: 'hanafi',
  adjustments: ZERO_ADJUSTMENTS,
  // Off until the user turns it on, so the permission prompt appears in context rather than on first launch.
  notificationsEnabled: false,
  remindBeforeMinutes: 0,
  hijriAdjust: 0,
  tasbihGoal: 33,
  tasbihPhrases: ['Субханаллах', 'Альхамдулиллях', 'Аллаху акбар'],
};

export function useSettings() {
  return usePersistentState<AppSettings>('@app_settings_v2', defaultSettings);
}
