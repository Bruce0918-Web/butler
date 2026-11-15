import { addDays, dayOf } from './dates';
import { DAYS, type DayLog, type State } from './types';
import { mainSlot } from './workouts';

const READING = /读纸质书|阅读/;

/** Whether that day's reading slot was ticked. null when the day has no reading slot. */
export function readingDone(state: State, key: string): boolean | null {
  const slot = state.schedule[dayOf(key)].find((s) => READING.test(s.title));
  return slot ? !!state.days[key]?.checks[slot.id] : null;
}

/** Whether that day's main training session was ticked. null when the day has none. */
export function trainingDone(state: State, key: string): boolean | null {
  const slot = mainSlot(state.schedule[dayOf(key)]);
  return slot ? !!state.days[key]?.checks[slot.id] : null;
}

type Test = (log: DayLog, key: string) => boolean | null;

/**
 * How many days in a row, ending yesterday, the test gave `want`.
 * A day with no record, or where the test does not apply (null), ends the run.
 */
export function run(state: State, today: string, test: Test, want: boolean): number {
  let n = 0;
  for (let key = addDays(today, -1); ; key = addDays(key, -1)) {
    const log = state.days[key];
    if (!log || test(log, key) !== want) return n;
    n++;
  }
}

export const tests = {
  pawn: ((log) => (log.pawn.text ? log.pawn.done : null)) as Test,
  /** Only days I answered the question count; an unanswered day ends the run. */
  slept: ((log) => log.night?.slept ?? null) as Test,
  /** Only counts on days when the timeline was used at all, so not ticking anything is not "skipped reading". */
  reading: (state: State): Test => (log, key) => (Object.values(log.checks).some(Boolean) ? readingDone(state, key) : null),
};

export const mondayOf = (key: string) => addDays(key, -DAYS.indexOf(dayOf(key)));

export interface WeekStats {
  /** Days with any record. */
  logged: number;
  slept: number;
  training: number;
  reading: number;
  pawn: number;
  threeDone: number;
  threeTotal: number;
}

/** What actually happened in the week starting on `monday`, counted from the records. */
export function weekStats(state: State, monday: string): WeekStats {
  const s: WeekStats = { logged: 0, slept: 0, training: 0, reading: 0, pawn: 0, threeDone: 0, threeTotal: 0 };
  for (let i = 0; i < 7; i++) {
    const key = addDays(monday, i);
    const log = state.days[key];
    if (!log) continue;
    s.logged++;
    if (log.night?.slept) s.slept++;
    if (trainingDone(state, key)) s.training++;
    if (readingDone(state, key)) s.reading++;
    if (log.pawn.done) s.pawn++;
    const three = log.three.filter((t) => t.text.trim());
    s.threeTotal += three.length;
    s.threeDone += three.filter((t) => t.done).length;
  }
  return s;
}
