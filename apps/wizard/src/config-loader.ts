/**
 * Typed access to the public config injected by the WordPress plugin.
 *
 * The plugin emits `window.GOQW_CONFIG` BEFORE the wizard bundle runs.
 */

/* eslint-disable @typescript-eslint/restrict-template-expressions */

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
 * Load config from window.GOQW_CONFIG with safe defaults.
 */
function loadConfig(): GoqwPublicConfig {
  const injected = typeof window !== 'undefined' ? window.GOQW_CONFIG : undefined;

  if (!injected) {
    return DEFAULT_CONFIG;
  }

  const receivedVersion = String(injected.contractVersion ?? 'undefined');

  if (injected.contractVersion !== CURRENT_CONTRACT_VERSION) {
    console.warn(
      `[quote-wizard] Config contract version mismatch. ` +
        `Bundle expects ${CURRENT_CONTRACT_VERSION}, ` +
        `got ${receivedVersion}. ` +
        `Some features may not work correctly.`,
    );
  }

  return { ...DEFAULT_CONFIG, ...injected };
}

/**
 * The resolved config for this page load. Frozen so it cannot drift.
 */
export const config: GoqwPublicConfig = Object.freeze(loadConfig());
