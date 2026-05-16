/**
 * Typed access to the public config injected by the WordPress plugin.
 *
 * The plugin emits `window.GOQW_CONFIG` BEFORE the wizard bundle runs. This
 * module reads that global once at import time and exposes it via a typed
 * accessor with safe defaults.
 *
 * Why a module-level read rather than a runtime hook:
 * - The config doesn't change during a page's lifetime.
 * - Components shouldn't have to handle "config still loading" states.
 * - Snapshotting at module load means tests can set window.GOQW_CONFIG
 *   before importing this module.
 *
 * Defensive defaults: if the global is missing or partial, the loader returns
 * sensible empty strings rather than crashing.
 */
const CURRENT_CONTRACT_VERSION = 1 as const;

const DEFAULT_CONFIG: GoqwPublicConfig = {
  contractVersion: CURRENT_CONTRACT_VERSION,
  businessName: '',
  businessPhone: '',
  businessEmail: '',
  primaryColor: '#0F4C81',
  calendlyUrl: '',
  restNamespace: 'qw/v1',
  restUrl: '',
  restNonce: '',
  pluginVersion: '',
  buildTimestamp: '',
};

/**
 * Read window.GOQW_CONFIG with safe defaults.
 *
 * Never throws. Logs a console warning if the contract version differs
 * from what this build expects.
 */
function loadConfig(): GoqwPublicConfig {
  const injected = typeof window !== 'undefined' ? window.GOQW_CONFIG : undefined;

  if (!injected) {
    // Dev mode (Vite dev server) or misconfiguration — return safe defaults.
    return DEFAULT_CONFIG;
  }

  if (injected.contractVersion !== CURRENT_CONTRACT_VERSION) {
    console.warn(
      `[quote-wizard] Config contract version mismatch. ` +
        `Bundle expects ${CURRENT_CONTRACT_VERSION}, ` +
        `got ${String(injected.contractVersion ?? 'undefined')}. ` +
        `Some features may not work correctly.`,
    );
  }

  // Merge in case the server omitted optional fields.
  return { ...DEFAULT_CONFIG, ...injected };
}

/**
 * The resolved config for this page load. Frozen so it cannot drift.
 */
export const config: GoqwPublicConfig = Object.freeze(loadConfig());