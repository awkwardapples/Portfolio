/**
 * Vertical registry types.
 *
 * A Vertical is one immutable, in-repo wizard bundle. The registry is a typed,
 * closed Record<string, Vertical>; resolveVertical performs the lookup.
 *
 * Scope intentionally minimal (ADR-0013): id + label + wizard + pricing only.
 * Branding, theme, content, and site templates are NOT part of a Vertical —
 * those belong to the site-template layer (Phase 5).
 */

import type { WizardConfig } from '@/domain/config/wizard-config';
import type { PricingConfig } from '@/domain/config/pricing';

export interface Vertical {
  /** Stable registry key. Must match the key it lives under. Used as wizardId. */
  readonly id: string;
  /** Human-readable label. Diagnostic use only — never UI copy. */
  readonly label: string;
  readonly wizard: WizardConfig;
  readonly pricing: PricingConfig;
  /** Matches the 4.1 schema version; bumps if and when those schemas bump. */
  readonly schemaVersion: 1;
}

/**
 * Session-scoped resolved config. Returned by resolveVertical and threaded into
 * App.tsx. Structurally identical to Vertical today; kept as a separate name so
 * future divergence (e.g. runtime-scoped session data) does not force a rename.
 */
export interface SessionConfig {
  readonly id: string;
  readonly label: string;
  readonly schemaVersion: 1;
  readonly wizard: WizardConfig;
  readonly pricing: PricingConfig;
}
