/**
 * Output types for the pricing engine.
 *
 * All types are fully serialisable (no class instances, no functions, no
 * circular refs). Monetary values are always integer pence — never floats.
 */

/**
 * One line in the pricing breakdown — a modifier or extra that was evaluated
 * and either applied or skipped.
 *
 * deltaAmountPence reflects the actual change in pence this line contributed:
 *   - 0 when applied is false.
 *   - For multiply effects: (penceAfter - penceBefore).
 *   - For add effects: amountPence if applied.
 */
export interface PricingLineItem {
  readonly id: string;
  readonly label: string;
  /** Whether the rule's match condition was met for the current answers. */
  readonly applied: boolean;
  /** Net change in pence from this line. Zero when not applied. */
  readonly deltaAmountPence: number;
}

/**
 * Step-by-step breakdown of how the final price was reached.
 * Useful for debugging, audit, and detailed UI display.
 */
export interface PricingBreakdown {
  /** base.perUnitPence * quantity, before any modifiers. */
  readonly basePence: number;
  /** Running total after all modifiers have been evaluated. */
  readonly subtotalAfterModifiersPence: number;
  /** Running total after all extras have been added. */
  readonly subtotalAfterExtrasPence: number;
  /** After applying min/max clamp from bounds. */
  readonly clampedPence: number;
  /** After rounding to nearest bounds.rounding.toPence — equals totalPence. */
  readonly roundedPence: number;
  readonly modifierLines: ReadonlyArray<PricingLineItem>;
  readonly extraLines: ReadonlyArray<PricingLineItem>;
}

/**
 * The complete output of computePrice().
 *
 * valid: false means the quantity field could not be resolved to a
 * non-negative number; all other fields are null in that case. This is the
 * only failure mode — the engine never throws.
 */
export interface PricingResult {
  readonly valid: boolean;
  /** Rounded final price in pence. Null when valid is false. */
  readonly totalPence: number | null;
  /** Lower bound of the display range (after rangeSpread). Null when valid is false. */
  readonly rangeMinPence: number | null;
  /** Upper bound of the display range (after rangeSpread). Null when valid is false. */
  readonly rangeMaxPence: number | null;
  /** Full computation breakdown. Null when valid is false. */
  readonly breakdown: PricingBreakdown | null;
}
