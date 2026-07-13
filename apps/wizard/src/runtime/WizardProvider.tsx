import { createContext, useContext, useEffect, type ReactNode } from 'react';

import type { WizardStore } from '@/runtime/WizardStore';
import type { PhotoStore } from '@/runtime/photos-store';
import type { BotProtectionStore } from '@/runtime/bot-protection-store';

// ---------------------------------------------------------------------------
// Contexts
// ---------------------------------------------------------------------------

const WizardContext = createContext<WizardStore | null>(null);

/** Separate context so photo-store access does not re-render non-photo consumers. */
export const PhotoStoreContext = createContext<PhotoStore | null>(null);

/** Separate context so bot-protection access does not re-render unrelated consumers. */
export const BotProtectionStoreContext = createContext<BotProtectionStore | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface WizardProviderProps {
  store: WizardStore;
  /** Volatile photo store scoped to this WizardProvider mount. When provided,
   *  PhotoField components can access it via usePhotoStore() to store base64. */
  photoStore?: PhotoStore;
  /** Volatile bot-protection store scoped to this WizardProvider mount (Step
   *  5.13f). HoneypotField and TurnstileWidget access it via
   *  useBotProtectionStore() to record the honeypot value / Turnstile token. */
  botProtectionStore?: BotProtectionStore;
  children: ReactNode;
}

/**
 * Provides a WizardStore (and optionally a PhotoStore / BotProtectionStore)
 * to the React tree and triggers hydration once on mount.
 *
 * Pass the store created by createWizardStore(). When photo fields are present,
 * pass a PhotoStore created alongside the WizardStore so photo base64 data is
 * available at submission time via the enriched submission port. Always pass
 * a BotProtectionStore — every wizard gets the honeypot field regardless of
 * whether Turnstile is configured.
 */
export function WizardProvider({
  store,
  photoStore,
  botProtectionStore,
  children,
}: WizardProviderProps) {
  useEffect(() => {
    store.hydrate();
  }, [store]);

  return (
    <WizardContext.Provider value={store}>
      <PhotoStoreContext.Provider value={photoStore ?? null}>
        <BotProtectionStoreContext.Provider value={botProtectionStore ?? null}>
          {children}
        </BotProtectionStoreContext.Provider>
      </PhotoStoreContext.Provider>
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
