import { cityById, GPS_CITY } from '@/data/cities';
import { useLanguage } from './useLanguage';
import { useSettings } from './useSettings';

export function useLocationLabel(): string {
  const { t, lang } = useLanguage();
  const [settings] = useSettings();
  if (settings.city === GPS_CITY) return t.cityGpsOption;
  const city = cityById[settings.city];
  return city ? (lang === 'ky' ? city.ky : city.ru) : '';
}
