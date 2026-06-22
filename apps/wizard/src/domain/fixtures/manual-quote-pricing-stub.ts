/**
 * Shared pricing config stub for manual-quote services (ADR-0021 Decision 2).
 *
 * The Vertical registry type requires a pricing: PricingConfig field. Manual-quote
 * services bypass the pricing gate entirely (quoteMode: 'manual' per ADR-0017),
 * so this config's values are never evaluated by the pricing engine at runtime.
 *
 * This stub satisfies the type contract. Do NOT call validatePricingConfig against
 * manual-quote wizard configs — the stub's quantityFieldId does not reference a
 * real field, so cross-reference validation would fail by design.
 */

import type { PricingConfig } from '@/domain/config/pricing';

export const manualQuotePricingStub: PricingConfig = {
  schemaVersion: 1,
  currency: 'GBP',
  base: {
    label: 'Manual quote — pricing not computed',
    perUnitPence: 1,
    unit: 'item',
    quantityFieldId: 'stub',
  },
  modifiers: [],
  extras: [],
  bounds: {
    minPence: 0,
    maxPence: 1,
    rounding: {
      mode: 'nearest',
      toPence: 1,
    },
  },
  rangeSpreadBasisPoints: 0,
};
