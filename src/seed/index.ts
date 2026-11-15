/**
 * Where a brand-new copy of the app gets its starting data.
 *
 * The owner's own content lives in src/seed/personal/, which is kept out of the published program.
 * With that folder present (on the owner's computer) the app starts filled in; without it (the published
 * app) it starts empty, and the owner brings their content in by importing a backup.
 */
import { DAYS, type Day, type State } from '../state/types';

const found = import.meta.glob<{ seed: () => State }>('./personal/index.ts', { eager: true });
const personal = Object.values(found)[0];

const perDay = <T>(make: () => T) => Object.fromEntries(DAYS.map((d) => [d, make()])) as Record<Day, T>;

/** An empty app: every section exists and works, with nothing in it. */
export function blank(): State {
  return {
    version: 1,
    applied: [],
    profile: { mission: '', beliefs: [], principles: [], target: { short: '', title: '' } },
    layers: [],
    goals: [],
    admissions: [],
    projects: [],
    schedule: perDay(() => []),
    school: { days: {}, classes: {}, periods: [], rule: '', note: '' },
    assignments: [],
    parking: [],
    weeks: {},
    learning: { tracks: [], parts: [], systems: [], protocols: [] },
    reading: { current: { title: '', author: '', daily: '' }, lines: [], finished: [] },
    training: { plan: perDay(() => ''), workouts: {}, phase: { name: '', start: null, end: null, marks: [] }, log: [] },
    days: {},
  };
}

/** True when the published build is running, or when the personal content is deliberately left out to test it. */
export const isBlankBuild = !personal || import.meta.env.MODE === 'blank';

export function seed(): State {
  return isBlankBuild ? blank() : personal.seed();
}
