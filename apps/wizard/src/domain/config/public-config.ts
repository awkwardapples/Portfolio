/**
 * Public runtime config schema.
 *
 * Mirrors the PHP `PublicConfig::build()` allowlist (ADR-0009) — the exact set
 * of values injected into the browser as `window.GOQW_CONFIG`. This is the
 * DEPLOYMENT contract: per-client values set in WordPress, not authored in the
 * wizard config.
 *
 * Kept deliberately separate from WizardConfig/PricingConfig: different source
 * (WordPress vs in-repo), different lifecycle (per-deployment vs per-vertical),
 * different validation flow (runtime fail-safe vs build-time fail-closed).
 *
 * The TypeScript shape here must stay in step with:
 *   - PHP:  plugins/quote-wizard/src/Frontend/PublicConfig.php
 *   - TS:   src/types/global.d.ts (the ambient window.GOQW_CONFIG declaration)
 *
 * `contractVersion` is the PHP<->JS boundary version (ADR-0009), distinct from
 * the config schemaVersion. This schema is NOT strict on unknown keys: the PHP
 * side may add forward-compatible fields, and the browser should tolerate them
 * rather than fail closed on a value it simply doesn't use yet.
 */

import { z } from 'zod';

export const CONTRACT_VERSION = 2 as const;

export const PublicConfigSchema = z.object({
  contractVersion: z.literal(CONTRACT_VERSION),
  wizardId: z.string().min(1, 'wizardId must be provided.'),
  enabledServiceIds: z
    .array(z.string().min(1, 'Service ids must be non-empty strings.'))
    .optional(),
  businessName: z.string(),
  businessPhone: z.string(),
  businessEmail: z.string(),
  primaryColor: z.string(),
  calendlyUrl: z.string(),
  restNamespace: z.literal('qw/v1'),
  restUrl: z.string(),
  restNonce: z.string(),
  pluginVersion: z.string(),
  buildTimestamp: z.string(),
});

export type PublicConfig = z.infer<typeof PublicConfigSchema>;
