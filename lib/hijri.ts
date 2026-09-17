export type HijriDate = { day: number; month: number; year: number };

// Tabular (arithmetical) Islamic calendar. The real start of a month depends on sighting the crescent,
// so the result can differ by a day from the local announcement; users can correct it with `adjustDays`.
export function toHijri(year: number, month: number, day: number, adjustDays = 0): HijriDate {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jd =
    day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045 + adjustDays;

  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l -= 10631 * n;
  const j =
    Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const hMonth = Math.floor((24 * l) / 709);
  const hDay = l - Math.floor((709 * hMonth) / 24);
  const hYear = 30 * n + j - 29;
  return { day: hDay, month: hMonth, year: hYear };
}
