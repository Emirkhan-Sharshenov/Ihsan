export type PrayerTime = {
  name: string;
  arabicName: string;
  time: string;
};

export type PrayerSchedule = {
  city: string;
  cityKy: string;
  method: string;
  methodKy: string;
  timings: PrayerTime[];
};

export const prayerSchedules: Record<string, PrayerSchedule> = {
  'Москва': {
    city: 'Москва',
    cityKy: 'Москва',
    method: 'Ханафитский метод',
    methodKy: 'Ханафий ыкмасы',
    timings: [
      { name: 'Фаджр', arabicName: 'الفجر', time: '04:18' },
      { name: 'Зухр', arabicName: 'الظهر', time: '13:07' },
      { name: 'Аср', arabicName: 'العصر', time: '17:11' },
      { name: 'Магриб', arabicName: 'المغرب', time: '20:34' },
      { name: 'Иша', arabicName: 'العشاء', time: '22:18' },
    ],
  },
  'Казань': {
    city: 'Казань',
    cityKy: 'Казань',
    method: 'Ханафитский метод',
    methodKy: 'Ханафий ыкмасы',
    timings: [
      { name: 'Фаджр', arabicName: 'الفجر', time: '03:42' },
      { name: 'Зухр', arabicName: 'الظهر', time: '12:51' },
      { name: 'Аср', arabicName: 'العصر', time: '16:48' },
      { name: 'Магриб', arabicName: 'المغرب', time: '20:12' },
      { name: 'Иша', arabicName: 'العشاء', time: '21:52' },
    ],
  },
  'Грозный': {
    city: 'Грозный',
    cityKy: 'Грозный',
    method: 'Шафиитский метод',
    methodKy: 'Шафий ыкмасы',
    timings: [
      { name: 'Фаджр', arabicName: 'الفجر', time: '04:01' },
      { name: 'Зухр', arabicName: 'الظهر', time: '12:35' },
      { name: 'Аср', arabicName: 'العصر', time: '16:18' },
      { name: 'Магриб', arabicName: 'المغرب', time: '19:48' },
      { name: 'Иша', arabicName: 'العشاء', time: '21:26' },
    ],
  },
  'Махачкала': {
    city: 'Махачкала',
    cityKy: 'Махачкала',
    method: 'Шафиитский метод',
    methodKy: 'Шафий ыкмасы',
    timings: [
      { name: 'Фаджр', arabicName: 'الفجر', time: '03:58' },
      { name: 'Зухр', arabicName: 'الظهر', time: '12:33' },
      { name: 'Аср', arabicName: 'العصر', time: '16:15' },
      { name: 'Магриб', arabicName: 'المغرب', time: '19:45' },
      { name: 'Иша', arabicName: 'العشاء', time: '21:23' },
    ],
  },
  'Уфа': {
    city: 'Уфа',
    cityKy: 'Уфа',
    method: 'Ханафитский метод',
    methodKy: 'Ханафий ыкмасы',
    timings: [
      { name: 'Фаджр', arabicName: 'الفجر', time: '04:08' },
      { name: 'Зухр', arabicName: 'الظهر', time: '13:12' },
      { name: 'Аср', arabicName: 'العصر', time: '17:21' },
      { name: 'Магриб', arabicName: 'المغرب', time: '20:42' },
      { name: 'Иша', arabicName: 'العشاء', time: '22:28' },
    ],
  },
  'Бишкек': {
    city: 'Бишкек',
    cityKy: 'Бишкек',
    method: 'Ханафитский метод',
    methodKy: 'Ханафий ыкмасы',
    timings: [
      { name: 'Фаджр', arabicName: 'الفجر', time: '04:35' },
      { name: 'Зухр', arabicName: 'الظهر', time: '13:15' },
      { name: 'Аср', arabicName: 'العصر', time: '17:45' },
      { name: 'Магриб', arabicName: 'المغرب', time: '20:18' },
      { name: 'Иша', arabicName: 'العشاء', time: '22:02' },
    ],
  },
  'Ош': {
    city: 'Ош',
    cityKy: 'Ош',
    method: 'Ханафитский метод',
    methodKy: 'Ханафий ыкмасы',
    timings: [
      { name: 'Фаджр', arabicName: 'الفجر', time: '04:28' },
      { name: 'Зухр', arabicName: 'الظهر', time: '13:08' },
      { name: 'Аср', arabicName: 'العصر', time: '17:38' },
      { name: 'Магриб', arabicName: 'المغرب', time: '20:10' },
      { name: 'Иша', arabicName: 'العشاء', time: '21:54' },
    ],
  },
  'Жалал-Абад': {
    city: 'Жалал-Абад',
    cityKy: 'Жалал-Абад',
    method: 'Ханафитский метод',
    methodKy: 'Ханафий ыкмасы',
    timings: [
      { name: 'Фаджр', arabicName: 'الفجر', time: '04:30' },
      { name: 'Зухр', arabicName: 'الظهر', time: '13:10' },
      { name: 'Аср', arabicName: 'العصر', time: '17:40' },
      { name: 'Магриб', arabicName: 'المغرب', time: '20:12' },
      { name: 'Иша', arabicName: 'العشاء', time: '21:56' },
    ],
  },
};

export const cityNames = Object.keys(prayerSchedules);

// Sentinel city value meaning "use the device's live GPS location" instead of a preset city.
export const GPS_CITY = '__gps__';

export function getNextPrayer(timings: PrayerTime[]): { prayer: PrayerTime; index: number; hoursUntil: number; minutesUntil: number } | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  for (let i = 0; i < timings.length; i++) {
    const [h, m] = timings[i].time.split(':').map(Number);
    const prayerMinutes = h * 60 + m;
    if (prayerMinutes > currentMinutes) {
      const diff = prayerMinutes - currentMinutes;
      return { prayer: timings[i], index: i, hoursUntil: Math.floor(diff / 60), minutesUntil: diff % 60 };
    }
  }
  const [h, m] = timings[0].time.split(':').map(Number);
  const fadjrMinutes = h * 60 + m + 24 * 60;
  const diff = fadjrMinutes - currentMinutes;
  return { prayer: timings[0], index: 0, hoursUntil: Math.floor(diff / 60), minutesUntil: diff % 60 };
}

export function getCurrentPrayerIndex(timings: PrayerTime[]): number {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let current = 0;
  for (let i = 0; i < timings.length; i++) {
    const [h, m] = timings[i].time.split(':').map(Number);
    const prayerMinutes = h * 60 + m;
    if (prayerMinutes <= currentMinutes) {
      current = i;
    }
  }
  return current;
}
