import { addDays } from './dates';

export interface Point {
  date: string;
  value: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * For each reading, the average of all readings in the `days` calendar days ending on it.
 * Daily weight and HRV are noisy; the average is the thing to watch.
 */
export function rolling(points: Point[], days = 7): Point[] {
  return points.map((p, i) => {
    const from = addDays(p.date, -(days - 1));
    const window = points.filter((q, j) => j <= i && q.date >= from);
    return { date: p.date, value: round1(window.reduce((sum, q) => sum + q.value, 0) / window.length) };
  });
}

/**
 * The vertical range to draw: centred on the data, with some air, and never narrower than `minSpan`,
 * so that a small wobble does not fill the whole height and look like a big swing.
 */
export function yRange(values: number[], minSpan: number): [number, number] {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = Math.max(minSpan, (hi - lo) * 1.2);
  const mid = (lo + hi) / 2;
  return [round1(mid - span / 2), round1(mid + span / 2)];
}

/** "+0.4" or "−0.6": the change from the first to the last value, with a real minus sign. */
export function change(points: Point[]): string {
  const d = round1(points[points.length - 1].value - points[0].value);
  return d === 0 ? '0' : d > 0 ? `+${d}` : `−${Math.abs(d)}`;
}
