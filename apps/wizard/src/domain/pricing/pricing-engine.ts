import type {
  PricingConfig,
  PricingExtra,
  PricingModifier,
  PricingRuleMatch,
} from '@/domain/config/pricing';
import type { WizardConfig } from '@/domain/config/wizard-config';
import type { AnswerMap } from '@/domain/runtime/answer-types';
import { buildFieldKeyMap } from '@/domain/runtime/condition-evaluator';

import type { PricingBreakdown, PricingLineItem, PricingResult } from './pricing-types';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Fail-closed: false when the referenced field is not in the map. */
function evaluateMatch(
  match: PricingRuleMatch,
  appliesToFieldId: string,
  answers: AnswerMap,
  fieldKeyById: ReadonlyMap<string, string>,
): boolean {
  if (match.kind === 'always') return true;

  const key = fieldKeyById.get(appliesToFieldId);
  if (key === undefined) return false;

  const answer = answers[key];

  if (match.kind === 'equals') {
    return answer === match.value;
  }

  // 'in' kind — handle array answers (checkbox multi-select)
  if (Array.isArray(answer)) {
    return (answer as ReadonlyArray<string>).some((v) => match.values.includes(v));
  }
  return typeof answer === 'string' && match.values.includes(answer);
}

/**
 * Applies a single modifier to the current running total. Returns a
 * PricingLineItem recording whether it was applied and the net delta.
 * The caller is responsible for adding deltaAmountPence to its accumulator.
 */
function evalModifier(
  modifier: PricingModifier,
  runningPence: number,
  answers: AnswerMap,
  fieldKeyById: ReadonlyMap<string, string>,
): PricingLineItem {
  const applied = evaluateMatch(modifier.match, modifier.appliesToFieldId, answers, fieldKeyById);
  if (!applied) {
    return { id: modifier.id, label: modifier.label, applied: false, deltaAmountPence: 0 };
  }

  const penceBefore = runningPence;
  let penceAfter: number;
  if (modifier.effect.kind === 'multiply') {
    penceAfter = Math.round(penceBefore * modifier.effect.factor);
  } else {
    penceAfter = penceBefore + modifier.effect.amountPence;
  }

  return {
    id: modifier.id,
    label: modifier.label,
    applied: true,
    deltaAmountPence: penceAfter - penceBefore,
  };
}

function evalExtra(
  extra: PricingExtra,
  answers: AnswerMap,
  fieldKeyById: ReadonlyMap<string, string>,
): PricingLineItem {
  const applied = evaluateMatch(extra.match, extra.appliesToFieldId, answers, fieldKeyById);
  return {
    id: extra.id,
    label: extra.label,
    applied,
    deltaAmountPence: applied ? extra.amountPence : 0,
  };
}

const INVALID: PricingResult = {
  valid: false,
  totalPence: null,
  rangeMinPence: null,
  rangeMaxPence: null,
  breakdown: null,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Pure pricing computation. Given current answers and the session config,
 * returns a PricingResult.
 *
 * Returns valid: false when the quantity field is missing from the wizard
 * config or the answered quantity is not a non-negative number. All other
 * return paths produce valid: true with a complete breakdown.
 *
 * Evaluation order (per pricing.ts schema comment):
 *   1. base.perUnitPence * quantity
 *   2. modifiers in array order
 *   3. extras in array order
 *   4. clamp to [minPence, maxPence]
 *   5. round to nearest bounds.rounding.toPence
 *   6. derive display range from rangeSpreadBasisPoints
 */
export function computePrice(
  answers: AnswerMap,
  wizard: WizardConfig,
  pricing: PricingConfig,
): PricingResult {
  const fieldKeyById = buildFieldKeyMap(wizard);

  // Step 0: resolve the quantity field
  const quantityKey = fieldKeyById.get(pricing.base.quantityFieldId);
  if (quantityKey === undefined) return INVALID;

  const quantityAnswer = answers[quantityKey];
  if (typeof quantityAnswer !== 'number' || quantityAnswer < 0) return INVALID;

  // Step 1: base
  const basePence = Math.round(pricing.base.perUnitPence * quantityAnswer);
  let running = basePence;

  // Step 2: modifiers (in order)
  const modifierLines: PricingLineItem[] = [];
  for (const modifier of pricing.modifiers) {
    const line = evalModifier(modifier, running, answers, fieldKeyById);
    modifierLines.push(line);
    running += line.deltaAmountPence;
  }
  const subtotalAfterModifiersPence = running;

  // Step 3: extras (in order)
  const extraLines: PricingLineItem[] = [];
  for (const extra of pricing.extras) {
    const line = evalExtra(extra, answers, fieldKeyById);
    extraLines.push(line);
    running += line.deltaAmountPence;
  }
  const subtotalAfterExtrasPence = running;

  // Step 4: clamp
  const clampedPence = Math.max(
    pricing.bounds.minPence,
    Math.min(pricing.bounds.maxPence, subtotalAfterExtrasPence),
  );

  // Step 5: round to nearest toPence
  const { toPence } = pricing.bounds.rounding;
  const roundedPence = Math.round(clampedPence / toPence) * toPence;

  // Step 6: range spread
  const bps = pricing.rangeSpreadBasisPoints;
  const rangeMinPence = Math.round((roundedPence * (10000 - bps)) / 10000);
  const rangeMaxPence = Math.round((roundedPence * (10000 + bps)) / 10000);

  const breakdown: PricingBreakdown = {
    basePence,
    modifierLines,
    extraLines,
    subtotalAfterModifiersPence,
    subtotalAfterExtrasPence,
    clampedPence,
    roundedPence,
  };

  return { valid: true, totalPence: roundedPence, rangeMinPence, rangeMaxPence, breakdown };
}
