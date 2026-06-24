/**
 * Patio / paving wizard configuration (Step 5.9).
 *
 * Instant-quote service. Placeholder pricing per ADR-0021 Decision 5.
 *
 * PRICING NOTE — area_m2 as quantity:
 *   The pricing engine uses a single quantityFieldId. area_m2 is the primary
 *   quantity (square metres of paving). Drainage metres are collected
 *   informally and passed to the contractor; they are not priced by the engine
 *   in this template (per-metre drainage pricing requires the richer DSL
 *   deferred to a future calibration step).
 *
 * MONEY: every monetary value is INTEGER PENCE.
 */

import type { WizardConfig } from '@/domain/config/wizard-config';
import type { PricingConfig } from '@/domain/config/pricing';

export const patioWizardConfig: WizardConfig = {
  schemaVersion: 1,
  id: 'patio',
  quoteMode: 'instant',
  title: 'Patio & paving',
  steps: [
    {
      id: 'area_and_material',
      title: 'Patio size & material',
      description: 'Tell us the approximate size and what material you would like.',
      fields: [
        {
          id: 'area_m2',
          key: 'area_m2',
          type: 'number',
          label: 'Approximate area in square metres',
          help: 'A rough estimate is fine. We confirm exact measurements on site.',
          required: true,
        },
        {
          id: 'material',
          key: 'material',
          type: 'select',
          label: 'Paving material',
          required: true,
          options: [
            { value: 'riven_slabs', label: '450×450 Riven Slabs' },
            { value: 'sandstone_indian', label: 'Indian Sandstone' },
            { value: 'sandstone_sawn', label: 'Sawn Sandstone' },
          ],
        },
      ],
    },
    {
      id: 'extras',
      title: 'Extras',
      description: 'Tell us about any additional features.',
      fields: [
        {
          id: 'drainage_m',
          key: 'drainage_m',
          type: 'number',
          label: 'Drainage required (linear metres)',
          help: 'Enter 0 if no drainage channel is needed.',
          required: false,
        },
        {
          id: 'edging',
          key: 'edging',
          type: 'select',
          label: 'Patio edging',
          required: true,
          options: [
            { value: 'block_edging', label: 'Block edging' },
            { value: 'kerb_edging', label: 'Kerb edging' },
            { value: 'none', label: 'No edging' },
          ],
        },
        {
          id: 'include_steps',
          key: 'include_steps',
          type: 'checkbox',
          label: 'Include steps',
          required: false,
          options: [{ value: 'yes', label: 'Yes, include steps to the patio' }],
        },
      ],
    },
    {
      id: 'site_photos',
      title: 'Photos',
      description: 'Add photos of the area so we can give a more accurate estimate.',
      fields: [
        {
          id: 'site_photos',
          key: 'site_photos',
          type: 'photo',
          label: 'Photos of the area (optional)',
          maxCount: 5,
          required: false,
          help: 'Up to 5 photos. We accept JPEG, PNG, and WebP.',
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
 * Placeholder pricing for patio & paving.
 * Base: £75/m² riven slabs. Material premiums as modifiers. Edging and steps as extras.
 */
export const patioPricingConfig: PricingConfig = {
  schemaVersion: 1,
  currency: 'GBP',
  base: {
    label: 'Base rate per square metre (riven slabs)',
    perUnitPence: 7500, // £75.00 per m²
    unit: 'square_metre',
    quantityFieldId: 'area_m2',
  },
  modifiers: [
    {
      id: 'material_sandstone_indian',
      label: 'Indian sandstone premium',
      appliesToFieldId: 'material',
      match: { kind: 'equals', value: 'sandstone_indian' },
      effect: { kind: 'multiply', factor: 1.25 },
    },
    {
      id: 'material_sandstone_sawn',
      label: 'Sawn sandstone premium',
      appliesToFieldId: 'material',
      match: { kind: 'equals', value: 'sandstone_sawn' },
      effect: { kind: 'multiply', factor: 1.4 },
    },
  ],
  extras: [
    {
      id: 'edging_block',
      label: 'Block edging',
      appliesToFieldId: 'edging',
      match: { kind: 'equals', value: 'block_edging' },
      amountPence: 20000, // £200
    },
    {
      id: 'edging_kerb',
      label: 'Kerb edging',
      appliesToFieldId: 'edging',
      match: { kind: 'equals', value: 'kerb_edging' },
      amountPence: 30000, // £300
    },
    {
      id: 'steps',
      label: 'Steps supply and fit',
      appliesToFieldId: 'include_steps',
      match: { kind: 'equals', value: 'yes' },
      amountPence: 65000, // £650
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
