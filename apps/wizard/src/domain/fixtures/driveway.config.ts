/**
 * Driveway wizard configuration (Step 5.9).
 *
 * Instant-quote service. Structurally similar to patio.config.ts but with
 * driveway-specific materials. Placeholder pricing per ADR-0021 Decision 5.
 *
 * MONEY: every monetary value is INTEGER PENCE.
 */

import type { WizardConfig } from '@/domain/config/wizard-config';
import type { PricingConfig } from '@/domain/config/pricing';

export const drivewayWizardConfig: WizardConfig = {
  schemaVersion: 1,
  id: 'driveway',
  quoteMode: 'instant',
  title: 'Driveway',
  steps: [
    {
      id: 'area_and_material',
      title: 'Driveway size & material',
      description: 'Tell us the approximate size and your preferred material.',
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
          label: 'Driveway material',
          required: true,
          options: [
            { value: 'driveline_50', label: 'Driveline 50 (block paving)' },
            { value: 'tegula', label: 'Tegula Style (textured block paving)' },
            { value: 'drivesys', label: 'Marshall Drivesys (permeable)' },
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
          label: 'Drainage channel required (linear metres)',
          help: 'Enter 0 if no drainage channel is needed.',
          required: false,
        },
        {
          id: 'kerb_edging',
          key: 'kerb_edging',
          type: 'select',
          label: 'Kerb edging',
          required: true,
          options: [
            { value: 'yes_edging', label: 'Yes, include kerb edging' },
            { value: 'not_sure', label: "Not sure — let's discuss" },
            { value: 'no_edging', label: 'No kerb edging needed' },
          ],
        },
        {
          id: 'include_steps',
          key: 'include_steps',
          type: 'checkbox',
          label: 'Include steps',
          required: false,
          options: [{ value: 'yes', label: 'Yes, include steps to the driveway' }],
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
 * Placeholder pricing for driveways.
 * Base: £80/m² block paving (Driveline 50). Material premiums as modifiers.
 */
export const drivewayPricingConfig: PricingConfig = {
  schemaVersion: 1,
  currency: 'GBP',
  base: {
    label: 'Base rate per square metre (Driveline 50)',
    perUnitPence: 8000, // £80.00 per m²
    unit: 'square_metre',
    quantityFieldId: 'area_m2',
  },
  modifiers: [
    {
      id: 'material_tegula',
      label: 'Tegula premium',
      appliesToFieldId: 'material',
      match: { kind: 'equals', value: 'tegula' },
      effect: { kind: 'multiply', factor: 1.2 },
    },
    {
      id: 'material_drivesys',
      label: 'Drivesys permeable premium',
      appliesToFieldId: 'material',
      match: { kind: 'equals', value: 'drivesys' },
      effect: { kind: 'multiply', factor: 1.35 },
    },
  ],
  extras: [
    {
      id: 'kerb_edging',
      label: 'Kerb edging supply and fit',
      appliesToFieldId: 'kerb_edging',
      match: { kind: 'equals', value: 'yes_edging' },
      amountPence: 35000, // £350
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
    minPence: 75000, // £750 minimum job
    maxPence: 5000000, // £50,000 ceiling
    rounding: {
      mode: 'nearest',
      toPence: 5000, // round to nearest £50
    },
  },
  rangeSpreadBasisPoints: 1500, // ±15%
};
