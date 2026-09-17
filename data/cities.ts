export type CalcMethodId = 'kyrgyzstan' | 'russia' | 'mwl' | 'ummalqura';

export type City = {
  id: string;
  ru: string;
  ky: string;
  lat: number;
  lon: number;
  // Fixed UTC offset in minutes. Kyrgyzstan and Russia do not observe DST.
  utcOffset: number;
  method: CalcMethodId;
};

// Sentinel city value meaning "use the device's GPS location" instead of a preset city.
export const GPS_CITY = '__gps__';

export const cities: City[] = [
  { id: 'bishkek', ru: 'Бишкек', ky: 'Бишкек', lat: 42.8746, lon: 74.5698, utcOffset: 360, method: 'kyrgyzstan' },
  { id: 'osh', ru: 'Ош', ky: 'Ош', lat: 40.5283, lon: 72.7985, utcOffset: 360, method: 'kyrgyzstan' },
  { id: 'jalal-abad', ru: 'Джалал-Абад', ky: 'Жалал-Абад', lat: 40.9333, lon: 73.0, utcOffset: 360, method: 'kyrgyzstan' },
  { id: 'karakol', ru: 'Каракол', ky: 'Каракол', lat: 42.4907, lon: 78.3936, utcOffset: 360, method: 'kyrgyzstan' },
  { id: 'tokmok', ru: 'Токмок', ky: 'Токмок', lat: 42.842, lon: 75.3015, utcOffset: 360, method: 'kyrgyzstan' },
  { id: 'naryn', ru: 'Нарын', ky: 'Нарын', lat: 41.4287, lon: 75.9911, utcOffset: 360, method: 'kyrgyzstan' },
  { id: 'talas', ru: 'Талас', ky: 'Талас', lat: 42.5228, lon: 72.2427, utcOffset: 360, method: 'kyrgyzstan' },
  { id: 'batken', ru: 'Баткен', ky: 'Баткен', lat: 40.0628, lon: 70.8194, utcOffset: 360, method: 'kyrgyzstan' },
  { id: 'uzgen', ru: 'Узген', ky: 'Өзгөн', lat: 40.77, lon: 73.3, utcOffset: 360, method: 'kyrgyzstan' },
  { id: 'kara-balta', ru: 'Кара-Балта', ky: 'Кара-Балта', lat: 42.8142, lon: 73.8481, utcOffset: 360, method: 'kyrgyzstan' },
  { id: 'cholpon-ata', ru: 'Чолпон-Ата', ky: 'Чолпон-Ата', lat: 42.649, lon: 77.082, utcOffset: 360, method: 'kyrgyzstan' },
  { id: 'moscow', ru: 'Москва', ky: 'Москва', lat: 55.7558, lon: 37.6173, utcOffset: 180, method: 'russia' },
  { id: 'spb', ru: 'Санкт-Петербург', ky: 'Санкт-Петербург', lat: 59.9343, lon: 30.3351, utcOffset: 180, method: 'russia' },
  { id: 'kazan', ru: 'Казань', ky: 'Казань', lat: 55.7963, lon: 49.1088, utcOffset: 180, method: 'russia' },
  { id: 'ufa', ru: 'Уфа', ky: 'Уфа', lat: 54.7388, lon: 55.9721, utcOffset: 300, method: 'russia' },
  { id: 'grozny', ru: 'Грозный', ky: 'Грозный', lat: 43.3179, lon: 45.6985, utcOffset: 180, method: 'russia' },
  { id: 'makhachkala', ru: 'Махачкала', ky: 'Махачкала', lat: 42.9849, lon: 47.5047, utcOffset: 180, method: 'russia' },
  { id: 'yekaterinburg', ru: 'Екатеринбург', ky: 'Екатеринбург', lat: 56.8389, lon: 60.6057, utcOffset: 300, method: 'russia' },
  { id: 'novosibirsk', ru: 'Новосибирск', ky: 'Новосибирск', lat: 55.0084, lon: 82.9357, utcOffset: 420, method: 'russia' },
];

export const cityById: Record<string, City> = Object.fromEntries(cities.map((c) => [c.id, c]));

export const DEFAULT_CITY_ID = 'bishkek';

// Rough bounding box of Kyrgyzstan. Used only to pick a sensible default method for GPS locations;
// the user can always override the method in settings.
export function isInKyrgyzstan(lat: number, lon: number): boolean {
  return lat >= 39.15 && lat <= 43.3 && lon >= 69.2 && lon <= 80.3;
}
