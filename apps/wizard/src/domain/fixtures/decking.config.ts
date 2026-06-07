/**
 * CANONICAL REFERENCE CONFIG — Decking vertical.
 *
 * Second reference vertical (added in Step 4.7) alongside fencing.config.ts.
 * Its primary purpose is to prove the abstraction: the wizard engine, pricing
 * engine, FSM, validation, and submission pipeline run identically regardless
 * of which service produced the config. Only the data differs.
 *
 * Read alongside fencing.config.ts to understand the two-vertical pattern.
 *
 * MONEY: every monetary value is INTEGER PENCE. £250 = 25000.
 *
 * IDS vs LABELS: `id`/`key`/`value` are stable contracts; `label`/`title` are
 * editable human copy. Cross-references use IDs only.
 *
 * PRICING NOTE — width is informational only:
 *   The `width_m` field collects the approximate deck width for the contractor's
 *   reference, but it does NOT affect the quoted price in this template. The
 *   base rate is per linear metre of decking run; material premiums are the
 *   primary differentiator. A real client deployment may choose to incorporate
 *   width into the pricing formula, but doing so requires a richer pricing DSL
 *   (e.g. a computed quantity field) that is out of scope for this reference.
 *   This is documented here so engineers cloning the template understand the
 *   simplification.
 */

import type { WizardConfig } from '@/domain/config/wizard-config';
import type { PricingConfig } from '@/domain/config/pricing';

/**
 * The wizard definition for decking quotes. A homeowner answers questions about
 * their planned deck; the wizard collects dimensions, material, optional extras,
 * and contact details.
 */
export const deckingWizardConfig: WizardConfig = {
  schemaVersion: 1,
  id: 'decking',
  quoteMode: 'instant',
  title: 'Decking quote',
  steps: [
    {
      id: 'dimensions',
      title: 'Your deck',
      description: 'Tell us the approximate size and material you have in mind.',
      fields: [
        {
          id: 'length_m',
          key: 'length_m',
          type: 'number',
          label: 'Approximate length in metres',
          help: 'A rough estimate is fine. We confirm exact measurements on site.',
          required: true,
        },
        {
          id: 'width_m',
          key: 'width_m',
          type: 'number',
          label: 'Approximate width in metres',
          help: 'Collected for the contractor. Does not affect the quoted price in this template.',
          required: false,
        },
        {
          id: 'material',
          key: 'material',
          type: 'select',
          label: 'Decking material',
          required: true,
          options: [
            { value: 'softwood', label: 'Softwood (pine/spruce)' },
            { value: 'hardwood', label: 'Hardwood (oak/ipe)' },
            { value: 'composite', label: 'Composite (low maintenance)' },
          ],
        },
      ],
    },
    {
      id: 'extras',
      title: 'Extras',
      description: 'Optional additions to your quote.',
      fields: [
        {
          id: 'include_steps',
          key: 'include_steps',
          type: 'checkbox',
          label: 'Include steps',
          required: false,
          options: [{ value: 'yes', label: 'Yes, include steps up to deck level' }],
        },
        {
          id: 'include_lighting',
          key: 'include_lighting',
          type: 'checkbox',
          label: 'Include integrated lighting',
          required: false,
          options: [{ value: 'yes', label: 'Yes, include integrated deck lighting' }],
        },
      ],
    },
    {
      id: 'contact',
      title: 'Your details',
      description: 'Where should we send your quote?',
      fields: [
        {
          id: 'contact_name',
          key: 'contact_name',
          type: 'text',
          label: 'Your name',
          required: true,
        },
        {
          id: 'contact_email',
          key: 'contact_email',
          type: 'text',
          label: 'Email address',
          required: true,
        },
        {
          id: 'contact_phone',
          key: 'contact_phone',
          type: 'text',
          label: 'Phone number',
          required: false,
        },
      ],
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Check your answers before we prepare your quote.',
      fields: [
        {
          id: 'review_summary',
          key: 'review_summary',
          type: 'review',
          label: 'Your answers',
          required: false,
        },
      ],
    },
  ],
};

/**
 * The pricing model for decking. Base rate is per linear metre of decking run
 * (softwood). Material premiums are applied as modifiers. Steps and lighting
 * are fixed-amount extras.
 *
 * Worked example: 10m softwood, no extras.
 *   base: 25000 pence/m × 10 = 250000 (£2,500)
 *   no modifiers apply (softwood = default)
 *   no extras
 *   clamp: within bounds
 *   round: nearest £50 → £2,500
 *   range: ±15% → £2,125–£2,875
 */
export const deckingPricingConfig: PricingConfig = {
  schemaVersion: 1,
  currency: 'GBP',
  base: {
    label: 'Base rate per linear metre (softwood)',
    perUnitPence: 25000, // £250.00 per linear metre installed
    unit: 'linear_metre',
    quantityFieldId: 'length_m',
  },
  modifiers: [
    {
      id: 'material_hardwood',
      label: 'Hardwood premium',
      appliesToFieldId: 'material',
      match: { kind: 'equals', value: 'hardwood' },
      effect: { kind: 'multiply', factor: 1.4 },
    },
    {
      id: 'material_composite',
      label: 'Composite premium',
      appliesToFieldId: 'material',
      match: { kind: 'equals', value: 'composite' },
      effect: { kind: 'multiply', factor: 1.6 },
    },
  ],
  extras: [
    {
      id: 'steps_extra',
      label: 'Steps supply and fit',
      appliesToFieldId: 'include_steps',
      match: { kind: 'equals', value: 'yes' },
      amountPence: 45000, // £450.00
    },
    {
      id: 'lighting_extra',
      label: 'Integrated deck lighting',
      appliesToFieldId: 'include_lighting',
      match: { kind: 'equals', value: 'yes' },
      amountPence: 35000, // £350.00
    },
  ],
  bounds: {
    minPence: 50000, // £500 minimum job
    maxPence: 5000000, // £50,000 ceiling
    rounding: {
      mode: 'nearest',
      toPence: 5000, // round to nearest £50
    },
  },
  rangeSpreadBasisPoints: 1500, // ±15%
};
