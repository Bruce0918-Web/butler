import { DAYS, type Day } from './types';

const p = (n: number) => String(n).padStart(2, '0');

/** Dates are local-time 'YYYY-MM-DD' keys everywhere. */
export const dateKey = (d: Date) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
export const hmOf = (d: Date) => `${p(d.getHours())}:${p(d.getMinutes())}`;

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(key: string, n: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

export const dayOf = (key: string): Day => DAYS[(parseKey(key).getDay() + 6) % 7];

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export const daysBetween = (from: string, to: string) => Math.round((parseKey(to).getTime() - parseKey(from).getTime()) / 86400000);

export const DAY_ZH: Record<Day, string> = { mon: '周一', tue: '周二', wed: '周三', thu: '周四', fri: '周五', sat: '周六', sun: '周日' };

export function longDate(key: string): string {
  const d = parseKey(key);
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

export const uid = () => Math.random().toString(36).slice(2, 10);
