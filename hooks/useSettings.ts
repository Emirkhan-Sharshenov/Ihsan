import { usePersistentState } from './usePersistentState';

export type AppSettings = {
  city: string;
  notificationsEnabled: boolean;
  tasbihGoal: number;
  tasbihPhrases: string[];
  madhab: 'shafi' | 'hanafi';
};

const defaultSettings: AppSettings = {
  city: 'Москва',
  notificationsEnabled: true,
  tasbihGoal: 33,
  tasbihPhrases: ['Субханаллах', 'Альхамдулиллях', 'Аллаху акбар'],
  madhab: 'hanafi',
};

export function useSettings() {
  return usePersistentState<AppSettings>('@app_settings', defaultSettings);
}
