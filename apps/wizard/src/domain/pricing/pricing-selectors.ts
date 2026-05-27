import type { SessionConfig, WizardState } from '@/domain/runtime/state';

import { computePrice } from './pricing-engine';
import type { PricingBreakdown, PricingResult } from './pricing-types';

/**
 * Computes the full pricing result from the current session state.
 * Pure function of (state.answers, config.wizard, config.pricing).
 */
export function selectPrice(state: WizardState, config: SessionConfig): PricingResult {
  return computePrice(state.answers, config.wizard, config.pricing);
}

/**
 * Returns the breakdown portion of the pricing result, or null when pricing
 * is invalid (quantity field missing or not a non-negative number).
 */
export function selectPricingBreakdown(
  state: WizardState,
  config: SessionConfig,
): PricingBreakdown | null {
  return selectPrice(state, config).breakdown;
}

/**
 * Returns true when the current answers produce a valid price.
 * False means the quantity field has not been answered or is invalid.
 */
export function selectIsPricingValid(state: WizardState, config: SessionConfig): boolean {
  return selectPrice(state, config).valid;
}
