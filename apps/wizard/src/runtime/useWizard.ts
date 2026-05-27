import { useSyncExternalStore } from 'react';

import type { WizardEvent } from '@/domain/runtime/events';
import type { SessionConfig, WizardState } from '@/domain/runtime/state';

import { useWizardStore } from '@/runtime/WizardProvider';

// ---------------------------------------------------------------------------
// useWizard
// ---------------------------------------------------------------------------

/**
 * Returns the full wizard state and a dispatch function.
 *
 * The component re-renders on every state transition. Use useWizardSelector
 * to subscribe to a derived slice if you want to narrow re-renders.
 *
 * No business logic here — state is read via useSyncExternalStore and dispatch
 * is delegated straight to the store.
 */
export function useWizard(): {
  state: WizardState;
  dispatch: (event: WizardEvent) => void;
} {
  const store = useWizardStore();
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return { state, dispatch: store.dispatch };
}

// ---------------------------------------------------------------------------
// useWizardSelector
// ---------------------------------------------------------------------------

/**
 * Subscribes to a derived slice of wizard state.
 *
 * The selector receives both WizardState and SessionConfig so it can call any
 * selector from selectors.ts. The component re-renders only when
 * useSyncExternalStore notifies a change (on every dispatch, since wizardState
 * is a new object). Memoisation of the selector result can be added by the
 * caller if needed.
 *
 * Example:
 *   const visible = useWizardSelector(selectVisibleSteps);
 */
export function useWizardSelector<T>(
  selector: (state: WizardState, config: SessionConfig) => T,
): T {
  const store = useWizardStore();
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return selector(state, store.getConfig());
}
