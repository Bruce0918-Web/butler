import { seed } from '../seed';
import { dateKey } from './dates';
import { migrate } from './migrate';
import { DAYS, type State } from './types';
import { structure } from './workouts';

const KEY = 'life-butler-v1';

/** Reads a saved state or a backup file. Throws with a readable message; never returns partial data. */
export function parseState(text: string): State {
  let raw: any;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('这不是有效的 JSON 文件。');
  }
  const isObj = (v: unknown) => !!v && typeof v === 'object' && !Array.isArray(v);
  if (!isObj(raw) || raw.version !== 1) throw new Error('这不是管家的备份文件。');
  const ok =
    isObj(raw.profile) &&
    typeof raw.profile.mission === 'string' &&
    Array.isArray(raw.profile.beliefs) &&
    Array.isArray(raw.profile.principles) &&
    Array.isArray(raw.layers) &&
    Array.isArray(raw.goals) &&
    Array.isArray(raw.projects) &&
    isObj(raw.schedule) &&
    DAYS.every((d) => Array.isArray(raw.schedule[d])) &&
    isObj(raw.school) &&
    isObj(raw.school.days) &&
    isObj(raw.days);
  if (!ok) throw new Error('备份文件缺少内容或已损坏。');
  return normalize(raw as State);
}

/** Fills in parts of the data that did not exist when an older version saved it. Never touches what is there. */
export function normalize(state: State): State {
  const fresh = seed();
  state.assignments ??= [];
  state.parking ??= [];
  state.training ??= fresh.training;
  state.school.periods ??= fresh.school.periods;
  state.school.rule ??= fresh.school.rule;
  state.school.note ??= fresh.school.note;
  state.profile.target ??= fresh.profile.target;
  if (!state.training.workouts) state.training.workouts = state.training.lifts ? structure(state.training.lifts) : fresh.training.workouts;
  delete state.training.lifts;
  state.training.phase.marks ??= fresh.training.phase.marks;
  state.weeks ??= {};
  state.learning ??= fresh.learning;
  state.reading ??= fresh.reading;
  migrate(state, dateKey(new Date()));
  state.admissions ??= [];
  return state;
}

export const serialize = (state: State) => JSON.stringify(state, null, 2);

export interface Boot {
  state: State;
  /** Set when saved data existed but could not be read; `raw` is that data so it can still be exported. */
  error?: { message: string; raw: string };
}

export function load(): Boot {
  let text: string | null = null;
  try {
    text = localStorage.getItem(KEY);
  } catch {
    return { state: seed() };
  }
  if (!text) return { state: seed() };
  try {
    return { state: parseState(text) };
  } catch (e) {
    return { state: seed(), error: { message: (e as Error).message, raw: text } };
  }
}

/** Returns false if the browser refused to store the data. */
export function save(state: State): boolean {
  try {
    localStorage.setItem(KEY, serialize(state));
    return true;
  } catch {
    return false;
  }
}

export function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
