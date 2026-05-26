/**
 * Pricing configuration schema.
 *
 * This is the most safety-critical, most-audited part of the config. It is
 * deliberately isolated so the audit surface stays small and the 4.5 pricing
 * engine imports only what it needs.
 *
 * DESIGN PRINCIPLES (binding):
 *
 *   1. Declarative data, never code. A pricing config is an ordered list of
 *      named, labelled rules — not a formula language, not expressions, no
 *      eval. A reviewer audits prices by reading labelled rules, not by
 *      mentally executing a DSL.
 *
 *   2. Deterministic. The 4.5 engine evaluates rules in array order with
 *      fixed arithmetic. Same config + same answers => same output, always.
 *
 *   3. Integer pence internally (ADR / 4.1 precision rule). All monetary
 *      amounts in this config are expressed in INTEGER PENCE (e.g. £45.50 is
 *      4550). There is NO floating-point money anywhere in the model. The
 *      engine accumulates in integer pence and applies a single explicit
 *      rounding phase ONLY at the output boundary (see `bounds.rounding`).
 *      This schema enforces integer-ness on every monetary field.
 *
 *   4. No presentation. No class names, colours, spacing, or copy beyond the
 *      human `label` used for auditing/debugging. Display formatting of money
 *      (currency symbol, thousands separators, the range string) is the UI
 *      layer's job, not this schema's.
 *
 * All cross-references here use stable IDs (`appliesToFieldId`), never labels.
 */

import { z } from 'zod';

/** A non-negative integer number of pence. The money primitive of the system. */
const pence = z
  .number()
  .int('Monetary amounts must be integer pence (no fractional pence, no floats).')
  .nonnegative('Monetary amounts must not be negative.');

/** A positive integer number of pence (for base rates that must be > 0). */
const positivePence = z
  .number()
  .int('Monetary amounts must be integer pence (no fractional pence, no floats).')
  .positive('This amount must be greater than zero.');

/**
 * How a rule matches an answer. Declarative only.
 *   - equals: the answer for the referenced field equals `value`
 *   - in:     the answer is one of `values`
 *   - always: the rule always applies (e.g. a flat base addition)
 */
const ruleMatch = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('equals'),
    value: z.string().min(1),
  }),
  z.strictObject({
    kind: z.literal('in'),
    values: z.array(z.string().min(1)).min(1),
  }),
  z.strictObject({
    kind: z.literal('always'),
  }),
]);

/**
 * A modifier multiplies or adds to the running subtotal when its match holds.
 *
 *   - multiply: subtotal *= factor  (factor is a plain ratio, e.g. 1.2 = +20%)
 *   - add:      subtotal += amountPence
 *
 * `factor` is the one intentional non-pence number: it is a dimensionless
 * ratio, not money. It is bounded to a sane range to catch typos (a 100x
 * multiplier is almost certainly a mistake).
 */
const modifier = z.strictObject({
  id: z.string().min(1),
  label: z.string().min(1),
  appliesToFieldId: z.string().min(1),
  match: ruleMatch,
  effect: z.discriminatedUnion('kind', [
    z.strictObject({
      kind: z.literal('multiply'),
      factor: z
        .number()
        .gt(0, 'A multiply factor must be greater than zero.')
        .lte(10, 'A multiply factor above 10x is almost certainly a configuration error.'),
    }),
    z.strictObject({
      kind: z.literal('add'),
      amountPence: pence,
    }),
  ]),
});

/**
 * An extra is an additive line item (gate, removal of old fence, etc.) applied
 * when its match holds. Always additive; kept separate from modifiers so the
 * audit reads clearly ("base + modifiers + extras").
 */
const extra = z.strictObject({
  id: z.string().min(1),
  label: z.string().min(1),
  appliesToFieldId: z.string().min(1),
  match: ruleMatch,
  amountPence: pence,
});

/**
 * Output bounds + rounding. Rounding is the SINGLE explicit phase applied at
 * the output boundary, after all integer-pence accumulation.
 *
 *   - min/max clamp the final figure (integer pence).
 *   - rounding.toPence rounds the final figure to the nearest multiple of
 *     `toPence` (e.g. 5000 = round to nearest £50). mode is fixed to 'nearest'
 *     in v1; the field exists so future modes don't restructure the schema.
 */
const bounds = z.strictObject({
  minPence: pence,
  maxPence: pence,
  rounding: z.strictObject({
    mode: z.literal('nearest'),
    toPence: positivePence,
  }),
});

/**
 * The pricing config.
 *
 * Evaluation order (defined here, implemented in 4.5):
 *   1. start from base.perUnitPence * quantity(from base.quantityFieldId)
 *   2. apply modifiers in array order
 *   3. add extras in array order
 *   4. clamp to [minPence, maxPence]
 *   5. round to nearest bounds.rounding.toPence
 *   6. derive the display range using rangeSpreadBasisPoints (UI formats it)
 *
 * rangeSpreadBasisPoints expresses the +/- spread used to present a quote
 * RANGE rather than a single figure (e.g. 1500 = +/-15%). Basis points keep it
 * an integer (no float). The spread is applied to the rounded figure by the
 * engine; the UI renders "from X to Y".
 */
export const PricingConfigSchema = z.strictObject({
  schemaVersion: z.literal(1),
  currency: z.literal('GBP'),
  base: z.strictObject({
    label: z.string().min(1),
    perUnitPence: positivePence,
    unit: z.enum(['linear_metre', 'square_metre', 'item']),
    /** The field whose numeric answer is the quantity multiplier. */
    quantityFieldId: z.string().min(1),
  }),
  modifiers: z.array(modifier),
  extras: z.array(extra),
  bounds,
  rangeSpreadBasisPoints: z
    .number()
    .int('Range spread must be an integer number of basis points.')
    .min(0)
    .max(5000, 'A range spread above 50% is almost certainly a configuration error.'),
});

export type PricingConfig = z.infer<typeof PricingConfigSchema>;
export type PricingModifier = z.infer<typeof modifier>;
export type PricingExtra = z.infer<typeof extra>;
export type PricingRuleMatch = z.infer<typeof ruleMatch>;
