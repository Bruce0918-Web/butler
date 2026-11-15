import type { State } from './types';

export { MAX_MUST } from './limits';

interface Change {
  id: string;
  apply: (state: State, today: string) => void;
}

/**
 * One-off changes to the data live with the owner's personal content (src/seed/personal/changes.ts),
 * which is not part of the published program. Without that file there is simply nothing to apply.
 */
const found = import.meta.glob<{ changes: Change[] }>('../seed/personal/changes.ts', { eager: true });
const CHANGES: Change[] = import.meta.env.MODE === 'blank' ? [] : Object.values(found).flatMap((m) => m.changes);

/** Applies each change exactly once, remembering in the data which ones have been applied. */
export function migrate(state: State, today: string): State {
  state.applied ??= [];
  for (const change of CHANGES)
    if (!state.applied.includes(change.id)) {
      change.apply(state, today);
      state.applied.push(change.id);
    }
  return state;
}
