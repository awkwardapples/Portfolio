import { createContext, useContext, useEffect, type ReactNode } from 'react';

import type { WizardStore } from '@/runtime/WizardStore';
import type { PhotoStore } from '@/runtime/photos-store';

// ---------------------------------------------------------------------------
// Contexts
// ---------------------------------------------------------------------------

const WizardContext = createContext<WizardStore | null>(null);

/** Separate context so photo-store access does not re-render non-photo consumers. */
export const PhotoStoreContext = createContext<PhotoStore | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface WizardProviderProps {
  store: WizardStore;
  /** Volatile photo store scoped to this WizardProvider mount. When provided,
   *  PhotoField components can access it via usePhotoStore() to store base64. */
  photoStore?: PhotoStore;
  children: ReactNode;
}

/**
 * Provides a WizardStore (and optionally a PhotoStore) to the React tree and
 * triggers hydration once on mount.
 *
 * Pass the store created by createWizardStore(). When photo fields are present,
 * pass a PhotoStore created alongside the WizardStore so photo base64 data is
 * available at submission time via the enriched submission port.
 */
export function WizardProvider({ store, photoStore, children }: WizardProviderProps) {
  useEffect(() => {
    store.hydrate();
  }, [store]);

  return (
    <WizardContext.Provider value={store}>
      <PhotoStoreContext.Provider value={photoStore ?? null}>{children}</PhotoStoreContext.Provider>
    </WizardContext.Provider>
  );
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
