import { createContext, useContext, useEffect, type ReactNode } from 'react';

import type { WizardStore } from '@/runtime/WizardStore';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const WizardContext = createContext<WizardStore | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Provides a WizardStore to the React tree and triggers hydration once on
 * mount. Pass the store created by createWizardStore().
 *
 * No business logic here — this component only wires the store into context
 * and calls store.hydrate() once so the machine exits idle.
 */
export function WizardProvider({ store, children }: { store: WizardStore; children: ReactNode }) {
  useEffect(() => {
    store.hydrate();
  }, [store]);

  return <WizardContext.Provider value={store}>{children}</WizardContext.Provider>;
}

// ---------------------------------------------------------------------------
// Internal context accessor (used by hooks)
// ---------------------------------------------------------------------------

export function useWizardStore(): WizardStore {
  const store = useContext(WizardContext);
  if (store === null) {
    throw new Error('useWizardStore must be called inside <WizardProvider>.');
  }
  return store;
}
