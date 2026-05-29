/**
 * Pure vertical resolution.
 *
 * Total, deterministic, React-free. No I/O. Unknown ids return null; callers
 * decide whether to fall back (App.tsx falls back to FALLBACK_VERTICAL_ID).
 */

import type { SessionConfig, Vertical } from '@/domain/registry/types';
import { VERTICALS, FALLBACK_VERTICAL_ID } from '@/domain/registry/verticals';

/**
 * Resolve a vertical by id. Returns null for unknown ids.
 *
 * Exact match only — no string normalisation, no fuzzy matching. The id must
 * match a registry key exactly. This is deliberate: registry keys are stable
 * contracts (mirrors the 4.1 "stable IDs over labels" discipline).
 */
export function resolveVertical(wizardId: string): SessionConfig | null {
  const entry: Vertical | undefined = VERTICALS[wizardId];
  if (entry === undefined) return null;
  return verticalToSessionConfig(entry);
}

/**
 * Resolve the FALLBACK vertical. Used by callers that received null from
 * resolveVertical and have no other recovery. Returns null only in the
 * pathological case of a corrupt registry.
 */
export function resolveFallbackVertical(): SessionConfig | null {
  return resolveVertical(FALLBACK_VERTICAL_ID);
}

/** List registered vertical IDs. Diagnostic and test helper. Pure. */
export function listVerticalIds(): readonly string[] {
  return Object.freeze(Object.keys(VERTICALS));
}

function verticalToSessionConfig(v: Vertical): SessionConfig {
  return {
    id: v.id,
    label: v.label,
    schemaVersion: v.schemaVersion,
    wizard: v.wizard,
    pricing: v.pricing,
  };
}
