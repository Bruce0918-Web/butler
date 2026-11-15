export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Day = (typeof DAYS)[number];

/** One line of a weekday's timeline template. */
export interface Slot {
  id: string;
  /** 'HH:MM', used for ordering. */
  time: string;
  /** 'HH:MM', optional: when a long session ends. */
  end?: string;
  /** Shown instead of the time when the item has no fixed clock time (e.g. "放学后"). */
  label?: string;
  title: string;
  detail?: string;
  /** What counts as done. */
  done?: string;
  tag?: string;
  /** Part of the school day (collapsed into one row on the Today page). */
  school?: boolean;
  /** One of the day's few must-do items. Everything else is optional and does not count towards completion. */
  must?: boolean;
}

export type Horizon = 'short' | 'mid' | 'long' | 'mission';

export interface Goal {
  id: string;
  title: string;
  horizon: Horizon;
  /** The goal one level up that this one serves. */
  parentId: string | null;
  note: string;
  due: string | null;
  done: boolean;
}

export interface Item {
  id: string;
  text: string;
}

export interface ChecklistItem extends Item {
  /** The mid-term goal (roadmap stage) this belongs to, for the timeline. */
  goalId: string | null;
  done: boolean;
}

export interface Area {
  id: string;
  name: string;
  /** One sentence on where this stands today. */
  status?: string;
  items: ChecklistItem[];
}

export interface Layer {
  id: string;
  name: string;
  gloss: string;
  items: Item[];
}

export interface Project {
  id: string;
  name: string;
  role: 'main' | 'side' | 'other';
  next: string;
  due: string | null;
  active: boolean;
  delivered: boolean;
  /** Set when the project was stopped to make room for another. */
  stoppedAt?: string;
}

export interface Three extends Item {
  done: boolean;
}

export interface DayLog {
  /** 兵卒任务： the most basic thing I least want to do, done first. */
  pawn: { text: string; done: boolean };
  three: Three[];
  /** slot id → ticked. */
  checks: Record<string, boolean>;
  /** Set when this day was reviewed the next morning. */
  review: { at: string; done: number; total: number } | null;
  night?: Night;
}

export interface School {
  /** date → rotation code or 'noschool'. Unlisted dates: Mon–Fri is school. */
  days: Record<string, string>;
  classes: Record<string, string>;
  /** The clock times of the five class periods. */
  periods: string[];
  /** Where homework can go, in a sentence. */
  rule?: string;
  /** The rest of the school day's fixed times. */
  note?: string;
}

export interface Assignment {
  id: string;
  subject: string;
  title: string;
  kind: 'homework' | 'exam';
  due: string | null;
  done: boolean;
}

/** An idea waiting in the parking lot. */
export interface Idea {
  id: string;
  text: string;
  addedAt: string;
}

export interface Lift {
  group: string;
  name: string;
  note: string;
}

/** One exercise. */
export interface Move {
  id: string;
  zh: string;
  en: string;
  /** Sets and reps as written, e.g. "4×6–8". */
  sets: string;
  /** Target weight or cue for today. */
  target: string;
}

/** One numbered step of a workout: a single exercise, or several done as a superset. */
export interface Block {
  id: string;
  /** 单独做， 超级组， 三连组 … */
  kind: string;
  /** Anything that applies to the whole block, such as rest times. */
  note: string;
  moves: Move[];
}

export interface BodyLog {
  date: string;
  weight: number | null;
  hrv: number | null;
}

export interface Training {
  /** What each weekday's training is, in a few words. A name that matches a key of `lifts` shows that workout. */
  plan: Record<Day, string>;
  workouts: Record<string, Block[]>;
  /** The old one-sentence form; converted to `workouts` on load and then removed. */
  lifts?: Record<string, Lift[]>;
  phase: { name: string; start: string | null; end: string | null; marks: { id: string; date: string | null; label: string }[] };
  log: BodyLog[];
}

/** The evening questions, answered the next morning. null = not answered. */
export interface Night {
  /** Did I do the hard thing first? */
  hard: boolean | null;
  /** Did I ask someone better than me? */
  asked: boolean | null;
  /** Did I waste time on face and socialising? */
  wasted: boolean | null;
  /** Was I asleep by 20:30? */
  slept: boolean | null;
  note: string;
  at: string;
}

export interface WeekReview {
  main: string;
  added: string;
  delivered: string;
  note: string;
  at: string;
}

export interface Track {
  id: string;
  name: string;
  note: string;
  steps: { id: string; text: string; done: boolean }[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  finishedAt: string | null;
}

export interface Reading {
  current: { title: string; author: string; daily: string };
  /** One sentence a day: what I took from that day's pages. */
  lines: { date: string; text: string }[];
  finished: Book[];
}

export interface ProtocolCard {
  id: string;
  part: number;
  zh: string;
  en: string;
  how: string;
  /** Written by me, never prefilled: behaviour → trigger → change → result. */
  chain: { act: string; trigger: string; change: string; result: string };
  systems: string[];
  evidence: string;
  view: string;
  page: string;
  /** Checked against the book. */
  checked: boolean;
}

export interface SystemCard {
  id: string;
  zh: string;
  en: string;
  senses: string;
  outputs: string;
  timescale: string;
  page: string;
  checked: boolean;
}

export interface Learning {
  tracks: Track[];
  parts: { id: number; zh: string; read: boolean }[];
  systems: SystemCard[];
  protocols: ProtocolCard[];
}

export interface State {
  version: 1;
  /** Ids of the one-off data changes already applied (see migrate.ts). */
  applied?: string[];
  learning: Learning;
  reading: Reading;
  /** Weekly reviews, keyed by the Monday of the week. */
  weeks: Record<string, WeekReview>;
  assignments: Assignment[];
  parking: Idea[];
  training: Training;
  profile: {
    mission: string;
    beliefs: Item[];
    principles: Item[];
    /** The school-application page: a short name for its tab and the sentence at its top. */
    target?: { short: string; title: string };
  };
  layers: Layer[];
  goals: Goal[];
  admissions: Area[];
  projects: Project[];
  schedule: Record<Day, Slot[]>;
  school: School;
  days: Record<string, DayLog>;
}
