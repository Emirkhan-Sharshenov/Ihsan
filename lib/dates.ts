import type { Lang } from '@/data/translations';

// Formatted by hand: Hermes on Android does not ship locale data for Kyrgyz.
const WEEKDAYS: Record<Lang, string[]> = {
  ru: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'],
  ky: ['жекшемби', 'дүйшөмбү', 'шейшемби', 'шаршемби', 'бейшемби', 'жума', 'ишемби'],
};

const MONTHS: Record<Lang, string[]> = {
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  ky: ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'],
};

export function formatGregorian(lang: Lang, year: number, month: number, day: number): string {
  const weekday = WEEKDAYS[lang][new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  if (lang === 'ky') return `${day}-${MONTHS.ky[month - 1]}, ${weekday}`;
  return `${day} ${MONTHS.ru[month - 1]}, ${weekday}`;
}

export function formatDuration(ms: number, hoursShort: string, minutesShort: string): string {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h} ${hoursShort} ${m} ${minutesShort}` : `${m} ${minutesShort}`;
}
