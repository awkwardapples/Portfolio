import { createContext, useContext, type ReactNode } from 'react';

/**
 * Deployment facts the wizard's components need (portfolio spec I.6 item 1,
 * ADR-0042): the public Turnstile site key and, optionally, the Turnstile
 * action the server verifies.
 *
 * The SCB quote page provides these from window.GOQW_CONFIG (QuotePage.tsx),
 * so it behaves exactly as before. The portfolio's contact island provides
 * its own. Components read the context instead of importing config-loader,
 * which would pull every SCB trade configuration into any host's bundle.
 */
export interface WizardEnvironment {
  /** Public Turnstile site key; '' means Turnstile is not configured. */
  readonly turnstileSiteKey: string;
  /** Turnstile action sent with the token, e.g. 'contact-submit'. */
  readonly turnstileAction?: string | undefined;
}

/** Without a provider, Turnstile is simply not configured. */
const NO_ENVIRONMENT: WizardEnvironment = Object.freeze({ turnstileSiteKey: '' });

const WizardEnvironmentContext = createContext<WizardEnvironment>(NO_ENVIRONMENT);

export function WizardEnvironmentProvider({
  value,
  children,
}: {
  value: WizardEnvironment;
  children: ReactNode;
}): JSX.Element {
  return (
    <WizardEnvironmentContext.Provider value={value}>{children}</WizardEnvironmentContext.Provider>
  );
}

export function useWizardEnvironment(): WizardEnvironment {
  return useContext(WizardEnvironmentContext);
}
