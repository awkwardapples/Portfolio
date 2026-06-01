/**
 * Ambient declaration for the global config injected by the WordPress plugin.
 *
 * The plugin's AssetLoader emits a small inline <script> setting
 *
 *   window.GOQW_CONFIG = { ... };
 *
 * before the wizard bundle runs. This file tells TypeScript what shape that
 * global has so we get type-checking when reading it.
 *
 * The contract on the PHP side lives in
 *   plugins/quote-wizard/src/Frontend/PublicConfig.php
 *
 * Keep this declaration in sync with that file. The `contractVersion` field
 * lets us detect drift at runtime (see config-loader.ts).
 */

declare global {
  interface GoqwPublicConfig {
    /** Hard-bumps when fields are renamed/removed or semantics change. */
    contractVersion: 2;

    /** Selects which wizard vertical this deployment runs. */
    wizardId: string;

    /**
     * Restricts the set of services offered by this deployment to a subset of
     * the registry. When absent or empty, all registered services are offered.
     * See ADR-0009 amendment and ADR-0013 amendment.
     */
    enabledServiceIds?: string[];

    /** Public business display info (appears in the wizard UI). */
    businessName: string;
    businessPhone: string;
    businessEmail: string;

    /** Branding — hex colour string, e.g. "#0F4C81". */
    primaryColor: string;

    /** CTA links — empty string when not configured. */
    calendlyUrl: string;

    /** REST contract for the future submission flow. */
    restNamespace: 'qw/v1';
    restUrl: string;
    restNonce: string;

    /** Build identity — useful in support / deployment debugging. */
    pluginVersion: string;
    buildTimestamp: string;
  }

  interface Window {
    /** Injected by the WordPress plugin before the wizard bundle runs. */
    GOQW_CONFIG?: GoqwPublicConfig;
  }
}

// Required so TS treats this file as a module rather than a script.
export {};
