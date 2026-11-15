import { daysBetween, uid } from './dates';
import type { Project, State } from './types';

/** A new idea waits this many days before it may become a project. */
export const WAIT_DAYS = 14;

export const daysParked = (addedAt: string, today: string) => Math.max(0, daysBetween(addedAt, today));
export const canActivate = (addedAt: string, today: string) => daysParked(addedAt, today) >= WAIT_DAYS;

/** The main and side slots: the active project in each, or null when the slot is empty. */
export function slots(state: State): { main: Project | null; side: Project | null } {
  const active = state.projects.filter((p) => p.active);
  return { main: active.find((p) => p.role === 'main') ?? null, side: active.find((p) => p.role === 'side') ?? null };
}

/**
 * Turns a parked idea into the project in one slot. Whatever was in that slot is stopped, never kept alongside.
 * Returns false (and changes nothing) if the idea has not waited long enough or does not exist. Mutates `state`.
 */
export function activate(state: State, ideaId: string, role: 'main' | 'side', today: string): boolean {
  const idea = state.parking.find((i) => i.id === ideaId);
  if (!idea || !canActivate(idea.addedAt, today)) return false;
  for (const p of state.projects)
    if (p.active && p.role === role) {
      p.active = false;
      p.stoppedAt = today;
    }
  state.projects.push({ id: uid(), name: idea.text, role, next: '', due: null, active: true, delivered: false });
  state.parking = state.parking.filter((i) => i.id !== ideaId);
  return true;
}
