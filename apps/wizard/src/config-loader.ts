/**
 * Typed access to the public config injected by the WordPress plugin.
 *
 * The plugin emits `window.GOQW_CONFIG` BEFORE the wizard bundle runs. This
 * module reads that global once at import time and exposes it via a typed
 * accessor with safe defaults.
 *
 * Why a module-level read rather than a runtime hook:
 *   - The config doesn't change during a page's lifetime.
 *   - Components shouldn't have to handle "config still loading" states.
 *   - Snapshotting at module load means tests can set window.GOQW_CONFIG
 *     before importing this module.
 *
 * 4.1 upgrade: the injected global is now validated against PublicConfigSchema
 * (the same shape mirrored from the PHP PublicConfig allowlist). Validation is
 * fail-SAFE here (not fail-closed): if the global is missing, partial, or
 * malformed, we log and fall back to safe defaults so the wizard still renders.
 * This preserves the original behaviour while making the shape check
 * schema-backed and consistent with the rest of the domain layer.
 *
 * Note: PublicConfig validation is intentionally non-strict on unknown keys —
 * the PHP side may add forward-compatible fields, which the browser tolerates.
 */

import { validatePublicConfig } from '@/domain/validation/validate-public';
import { CONTRACT_VERSION } from '@/domain/config/public-config';
import { FALLBACK_VERTICAL_ID } from '@/domain/registry';

const DEFAULT_CONFIG: GoqwPublicConfig = {
  contractVersion: CONTRACT_VERSION,
  wizardId: FALLBACK_VERTICAL_ID,
  enableCategoryNavigation: false,
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
 * Never throws. Validates the injected global against the schema; on any
 * failure, logs and returns safe defaults. On success, merges over defaults so
 * a forward-compatible-but-incomplete payload still yields a complete config.
 */
function loadConfig(): GoqwPublicConfig {
  const injected = typeof window !== 'undefined' ? window.GOQW_CONFIG : undefined;

  if (!injected) {
    // Dev mode (Vite dev server) or no plugin present — safe defaults.
    return DEFAULT_CONFIG;
  }

  const result = validatePublicConfig(injected);

  if (!result.ok) {
    // Malformed injected config: log operationally and fall back. The wizard
    // still renders with defaults rather than failing the whole page.
    console.warn(
      '[quote-wizard] window.GOQW_CONFIG failed validation; using safe defaults. Issues:',
      result.issues.map((i) => `${i.path}: ${i.message}`).join('; '),
    );
    return DEFAULT_CONFIG;
  }

  // Valid. Merge over defaults so any field the server omitted is still
  // present (the schema requires all fields, but the merge is harmless and
  // keeps behaviour robust if the schema ever relaxes a field to optional).
  return { ...DEFAULT_CONFIG, ...result.value };
}

/**
 * The resolved config for this page load. Frozen so it cannot drift.
 */
export const config: GoqwPublicConfig = Object.freeze(loadConfig());
