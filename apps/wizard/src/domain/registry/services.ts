/**
 * Service selection API (Step 4.7).
 *
 * Sits alongside the existing vertical API (4.5) and uses the same registry.
 * "Service" and "vertical" are synonyms; this module exposes the service-named
 * surface for use at the selection boundary (App.tsx, ServiceSelector).
 *
 * See ADR-0013 amendment for the synonymy rationale.
 */

import { VERTICALS } from '@/domain/registry/verticals';
import { resolveVertical } from '@/domain/registry/resolve';
import type { ServiceId, ServiceConfig } from '@/domain/registry/types';

/**
 * Return the ordered list of service IDs offered by this deployment.
 *
 * Behaviour:
 *   - override absent or empty array → all registered services (Object.keys order).
 *   - override present and non-empty → the override, filtered to IDs that
 *     actually exist in the registry. Order preserved from the override.
 *
 * Filtering of unknown IDs is deliberate: a configured `enabledServiceIds`
 * referencing a deleted vertical should not break the deployment. The result
 * is always a subset of the registry's actual keys.
 */
export function listEnabledServiceIds(override?: readonly string[]): readonly ServiceId[] {
  const registryIds = Object.keys(VERTICALS) as readonly ServiceId[];

  if (override === undefined || override.length === 0) {
    return registryIds;
  }

  const known = new Set(registryIds);
  return override.filter((id) => known.has(id));
}

/**
 * Resolve a service by id. Alias of resolveVertical for selection-layer code.
 * Returns null when the id is not in the registry.
 */
export function resolveService(id: ServiceId): ServiceConfig | null {
  return resolveVertical(id);
}
