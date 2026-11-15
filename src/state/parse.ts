const p = (n: number) => String(n).padStart(2, '0');

// Written as escapes so the punctuation normaliser (tools/punct.mjs) can never touch these patterns.
const YEAR = '\\u5e74'; // 年
const MONTH = '\\u6708'; // 月
const DAY = '\\u65e5'; // 日
const FULL = new RegExp(`^(\\d{4})\\s*[-/.${YEAR}]\\s*(\\d{1,2})\\s*[-/.${MONTH}]\\s*(\\d{1,2})\\s*${DAY}?$`);
const SHORT = new RegExp(`^(\\d{1,2})\\s*[-/.${MONTH}]\\s*(\\d{1,2})\\s*${DAY}?$`);
const TIME = /^(\d{1,2})\s*[:.：]?\s*(\d{2})$/;

function valid(y: number, m: number, d: number): string | undefined {
  const date = new Date(y, m - 1, d, 12);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? `${y}-${p(m)}-${p(d)}` : undefined;
}

/**
 * Reads a date typed by hand, with or without a year, with dashes, slashes, dots or Chinese date words.
 * Returns the 'YYYY-MM-DD' key, null for an empty field (no date), or undefined if it cannot be read.
 * Without a year, the date is taken as this year, or next year if it is more than a month in the past.
 */
export function parseDate(text: string, today: string): string | null | undefined {
  const t = text.trim();
  if (!t) return null;
  const full = t.match(FULL);
  if (full) return valid(+full[1], +full[2], +full[3]);
  const short = t.match(SHORT);
  if (!short) return undefined;
  const year = +today.slice(0, 4);
  const thisYear = valid(year, +short[1], +short[2]);
  if (!thisYear) return undefined;
  const monthAgo = new Date(year, +today.slice(5, 7) - 2, +today.slice(8, 10), 12);
  const cutoff = `${monthAgo.getFullYear()}-${p(monthAgo.getMonth() + 1)}-${p(monthAgo.getDate())}`;
  return thisYear < cutoff ? valid(year + 1, +short[1], +short[2]) : thisYear;
}

/** Reads a clock time typed by hand, with or without a separator. Returns 'HH:MM' or undefined. */
export function parseTime(text: string): string | undefined {
  const m = text.trim().match(TIME);
  if (!m || +m[1] > 23 || +m[2] > 59) return undefined;
  return `${p(+m[1])}:${m[2]}`;
}
