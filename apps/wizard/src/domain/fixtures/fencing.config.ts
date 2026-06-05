/**
 * CANONICAL REFERENCE CONFIG — Fencing vertical.
 *
 * This is a contract artifact and a teaching example. Engineers onboarding a
 * new client or vertical will read this to learn how a wizard + pricing config
 * is authored. Keep it:
 *   - heavily commented where useful
 *   - human-readable
 *   - intentionally and stably ordered
 *
 * It is also a COMPILE-TIME + TEST-TIME validity proof: the values below are
 * typed against WizardConfig / PricingConfig, and the test suite runs them
 * through the full validators. A malformed reference config fails CI, never
 * production.
 *
 * MONEY: every monetary value is INTEGER PENCE. £45.00/linear-metre = 4500.
 * There is no floating-point money anywhere. See pricing.ts for the rules.
 *
 * IDS vs LABELS: `id`/`key`/`value` are stable contracts; `label`/`title` are
 * editable human copy. Cross-references use IDs only.
 */

import type { WizardConfig } from '@/domain/config/wizard-config';
import type { PricingConfig } from '@/domain/config/pricing';

/**
 * The wizard definition: the questions a homeowner answers to get a fencing
 * quote. Worked example target (Phase 1 pricing spec): a 20 linear-metre fence
 * lands in the £5,750–£7,750 range.
 */
export const fencingWizardConfig: WizardConfig = {
  schemaVersion: 1,
  id: 'fencing',
  title: 'Fencing quote',
  steps: [
    {
      id: 'dimensions',
      title: 'Your fence',
      description: 'Tell us the size and type of fence you need.',
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
          id: 'fence_type',
          key: 'fence_type',
          type: 'select',
          label: 'Fence type',
          required: true,
          options: [
            { value: 'feather_edge', label: 'Feather edge' },
            { value: 'closeboard', label: 'Closeboard' },
            { value: 'panel', label: 'Panel' },
          ],
        },
        {
          id: 'height',
          key: 'height',
          type: 'radio',
          label: 'Height',
          required: true,
          options: [
            { value: 'low', label: 'Up to 1.2m' },
            { value: 'standard', label: '1.5m to 1.8m' },
            { value: 'tall', label: 'Over 1.8m' },
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
          id: 'include_gate',
          key: 'include_gate',
          type: 'checkbox',
          label: 'Include a gate',
          required: false,
          options: [{ value: 'yes', label: 'Yes, include a gate' }],
        },
        {
          id: 'remove_old',
          key: 'remove_old',
          type: 'checkbox',
          label: 'Remove the existing fence',
          required: false,
          options: [{ value: 'yes', label: 'Yes, remove and dispose of the old fence' }],
        },
      ],
    },
    {
      id: 'site_photos',
      title: 'Site photos',
      description: 'Add photos of the area so we can give a more accurate estimate.',
      fields: [
        {
          id: 'site_photos',
          key: 'site_photos',
          type: 'photo',
          label: 'Photos of the area (optional)',
          maxCount: 5,
          required: false,
          help: 'Up to 5 photos. We accept JPEG, PNG, and WebP. Photos are compressed automatically before upload.',
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
 * The pricing model for fencing. Evaluation order (implemented by the 4.5
 * engine): base * quantity -> modifiers (in order) -> extras (in order) ->
 * clamp -> round -> spread into a range.
 *
 * Worked example (Phase 1 spec): length_m = 20, fence_type = closeboard,
 * height = standard, no extras.
 *   base:        4500 pence/m * 20 = 90000 (£900)  -- NOTE: see test for the
 *                full worked figures; the canonical spec target is the final
 *                RANGE £5,750–£7,750, reproduced in the engine tests in 4.5.
 *
 * The exact arithmetic is asserted in the 4.5 engine tests against this config;
 * here we provide the declarative rules the engine consumes.
 */
export const fencingPricingConfig: PricingConfig = {
  schemaVersion: 1,
  currency: 'GBP',
  base: {
    label: 'Base rate per linear metre',
    perUnitPence: 32500, // £325.00 per linear metre (installed)
    unit: 'linear_metre',
    quantityFieldId: 'length_m',
  },
  modifiers: [
    {
      id: 'type_closeboard',
      label: 'Closeboard premium',
      appliesToFieldId: 'fence_type',
      match: { kind: 'equals', value: 'closeboard' },
      effect: { kind: 'multiply', factor: 1.1 },
    },
    {
      id: 'type_panel_discount',
      label: 'Panel (lower labour)',
      appliesToFieldId: 'fence_type',
      match: { kind: 'equals', value: 'panel' },
      effect: { kind: 'multiply', factor: 0.9 },
    },
    {
      id: 'height_tall',
      label: 'Tall fence premium',
      appliesToFieldId: 'height',
      match: { kind: 'equals', value: 'tall' },
      effect: { kind: 'multiply', factor: 1.2 },
    },
  ],
  extras: [
    {
      id: 'gate',
      label: 'Gate supply and fit',
      appliesToFieldId: 'include_gate',
      match: { kind: 'equals', value: 'yes' },
      amountPence: 35000, // £350.00
    },
    {
      id: 'removal',
      label: 'Remove and dispose of existing fence',
      appliesToFieldId: 'remove_old',
      match: { kind: 'equals', value: 'yes' },
      amountPence: 45000, // £450.00
    },
  ],
  bounds: {
    minPence: 25000, // £250 minimum job
    maxPence: 5000000, // £50,000 ceiling
    rounding: {
      mode: 'nearest',
      toPence: 5000, // round to nearest £50
    },
  },
  rangeSpreadBasisPoints: 1500, // +/-15% -> presented as a range
};
