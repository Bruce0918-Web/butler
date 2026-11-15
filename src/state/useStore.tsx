import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { load, save, type Boot } from './store';
import type { State } from './types';

interface Store {
  state: State;
  /** Change the data: the recipe edits a private copy, which then replaces the state and is saved. */
  update: (recipe: (draft: State) => void) => void;
  replace: (next: State) => void;
  saveFailed: boolean;
  bootError: Boot['error'];
  clearBootError: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [boot] = useState(load);
  const [state, setState] = useState(boot.state);
  const [bootError, setBootError] = useState(boot.error);
  const [saveFailed, setSaveFailed] = useState(false);

  // While unreadable saved data is on screen, do not overwrite it.
  useEffect(() => {
    if (!bootError) setSaveFailed(!save(state));
  }, [state, bootError]);

  // Ask the browser, once there is something worth keeping, not to clear this site's data on its own.
  const asked = useRef(false);
  useEffect(() => {
    if (asked.current || Object.keys(state.days).length === 0) return;
    asked.current = true;
    void navigator.storage?.persist?.().catch(() => undefined);
  }, [state]);

  const update = useCallback((recipe: (draft: State) => void) => {
    setState((prev) => {
      const next = structuredClone(prev);
      recipe(next);
      return next;
    });
  }, []);

  return (
    <Ctx.Provider value={{ state, update, replace: setState, saveFailed, bootError, clearBootError: () => setBootError(undefined) }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
