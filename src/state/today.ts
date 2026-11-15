import { addDays, dayOf } from './dates';
import { DAYS, type DayLog, type School, type Slot, type State } from './types';

export const emptyDay = (): DayLog => ({ pawn: { text: '', done: false }, three: [], checks: {}, review: null });

/** A listed date follows the calendar; any other date counts as school on Mon–Fri. */
export function isSchoolDay(key: string, school: School): boolean {
  const code = school.days[key];
  if (code !== undefined) return code !== 'noschool';
  return DAYS.indexOf(dayOf(key)) < 5;
}

/** "A1 日 · 历史 · 生物 …", "放假", or '' when the calendar says nothing about the date. */
export function schoolLabel(key: string, school: School): string {
  const code = school.days[key];
  if (code === undefined) return '';
  if (code === 'noschool') return '放假';
  return `${code} 日 · ${school.classes[code] ?? ''}`;
}

/** The day's timeline. School-time items are left out on days without school. */
export function slotsFor(state: State, key: string): Slot[] {
  const slots = [...state.schedule[dayOf(key)]].sort((a, b) => a.time.localeCompare(b.time));
  return isSchoolDay(key, state.school) ? slots : slots.filter((s) => !s.school);
}

export interface DayPart {
  name: string;
  slots: Slot[];
  /** Relative to the current time. */
  status: 'past' | 'now' | 'later';
  /** The school day itself: shown collapsed, fragments only. */
  school: boolean;
}

const PARTS = [
  { name: '早上', from: '00:00', to: '08:00' },
  { name: '白天', from: '08:00', to: '15:30' },
  { name: '下午', from: '15:30', to: '19:30' },
  { name: '晚上', from: '19:30', to: '24:00' },
];

/** Splits the day's timeline into four stretches. School-time items always belong to the daytime stretch. */
export function dayParts(slots: Slot[], hm: string, schoolDay: boolean): DayPart[] {
  return PARTS.map((p) => {
    const mine = slots.filter((s) => (s.school ? p.name === '白天' : s.time >= p.from && s.time < p.to));
    const status: DayPart['status'] = hm >= p.to ? 'past' : hm >= p.from ? 'now' : 'later';
    return { name: p.name, slots: mine, status, school: schoolDay && p.name === '白天' && mine.some((s) => s.school) };
  }).filter((p) => p.slots.length > 0);
}

/** The first unticked item that is not more than 20 minutes in the past. */
export function nextSlot(slots: Slot[], hm: string, checks: Record<string, boolean>): Slot | null {
  const [h, m] = hm.split(':').map(Number);
  const t = Math.max(0, h * 60 + m - 20);
  const from = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  // An item with an end time stays "next" until it ends, so a long session is not skipped once it has begun.
  return slots.find((s) => !checks[s.id] && (s.end ? s.end > hm : s.time >= from)) ?? null;
}

/** Yesterday's key if it has top-three items that were never reviewed, else null. */
export function needsReview(state: State, today: string): string | null {
  const y = addDays(today, -1);
  const log = state.days[y];
  return log && !log.review && log.three.some((t) => t.text.trim()) ? y : null;
}

export interface ReviewAnswer {
  id: string;
  done: boolean;
  /** For an unfinished item: carry it into today's three, or let it go. */
  carry: boolean;
}

/** Records the review of `yKey` and carries unfinished items into `today`. Mutates `state`. */
export function applyReview(state: State, today: string, yKey: string, answers: ReviewAnswer[], at: string): void {
  const y = state.days[yKey];
  if (!y) return;
  const t = (state.days[today] ??= emptyDay());
  let done = 0;
  for (const item of y.three) {
    const a = answers.find((x) => x.id === item.id);
    if (!a) continue;
    item.done = a.done;
    if (a.done) done++;
    else if (a.carry && !t.three.some((x) => x.text === item.text)) t.three.push({ id: `${item.id}-c`, text: item.text, done: false });
  }
  y.review = { at, done, total: y.three.filter((x) => x.text.trim()).length };
}
