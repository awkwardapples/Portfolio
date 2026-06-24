/**
 * Garden / external steps wizard configuration (Step 5.9).
 *
 * Instant-quote service. Priced per step with material premiums.
 * Placeholder pricing per ADR-0021 Decision 5.
 *
 * PRICING NOTE — step_count as quantity:
 *   step_length_m is collected for the contractor's reference but does not
 *   affect the quoted price in this template (same simplification as width_m
 *   in decking.config.ts). A real deployment may choose a more complex formula.
 *
 * MONEY: every monetary value is INTEGER PENCE.
 */

import type { WizardConfig } from '@/domain/config/wizard-config';
import type { PricingConfig } from '@/domain/config/pricing';

export const stepsWizardConfig: WizardConfig = {
  schemaVersion: 1,
  id: 'steps',
  quoteMode: 'instant',
  title: 'Garden steps',
  steps: [
    {
      id: 'design',
      title: 'Steps design',
      description: 'Tell us about the shape and material you have in mind.',
      fields: [
        {
          id: 'shape',
          key: 'shape',
          type: 'select',
          label: 'Step shape',
          required: true,
          options: [
            { value: 'straight', label: 'Straight' },
            { value: 'curved', label: 'Curved or semi-circular' },
            { value: 'not_sure', label: "Not sure — let's discuss" },
          ],
        },
        {
          id: 'material',
          key: 'material',
          type: 'select',
          label: 'Step material',
          required: true,
          options: [
            { value: 'brick', label: 'Brick' },
            { value: 'slate', label: 'Slate' },
            { value: 'portland_stone', label: 'Portland Stone' },
            { value: 'cast_stone', label: 'Cast Stone' },
            { value: 'granite', label: 'Granite' },
            { value: 'not_sure', label: "Not sure — let's discuss" },
          ],
        },
        {
          id: 'step_count',
          key: 'step_count',
          type: 'number',
          label: 'Number of steps',
          help: 'A rough estimate is fine.',
          required: true,
        },
      ],
    },
    {
      id: 'dimensions_and_extras',
      title: 'Dimensions & extras',
      description: 'Tell us the step width and whether you need threads or risers.',
      fields: [
        {
          id: 'step_length_m',
          key: 'step_length_m',
          type: 'number',
          label: 'Step width in metres',
          help: 'Collected for the contractor. Does not affect the quoted price in this template.',
          required: false,
        },
        {
          id: 'step_threads',
          key: 'step_threads',
          type: 'checkbox',
          label: 'Include step threads (horizontal face)',
          required: false,
          options: [{ value: 'yes', label: 'Yes, include step threads' }],
        },
        {
          id: 'step_risers',
          key: 'step_risers',
          type: 'checkbox',
          label: 'Include step risers (vertical face)',
          required: false,
          options: [{ value: 'yes', label: 'Yes, include step risers' }],
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
 * Placeholder pricing for garden steps.
 * Base: £200/step (brick). Material premiums as modifiers.
 */
export const stepsPricingConfig: PricingConfig = {
  schemaVersion: 1,
  currency: 'GBP',
  base: {
    label: 'Base rate per step (brick)',
    perUnitPence: 20000, // £200.00 per step
    unit: 'item',
    quantityFieldId: 'step_count',
  },
  modifiers: [
    {
      id: 'material_slate',
      label: 'Slate premium',
      appliesToFieldId: 'material',
      match: { kind: 'equals', value: 'slate' },
      effect: { kind: 'multiply', factor: 1.3 },
    },
    {
      id: 'material_portland',
      label: 'Portland stone premium',
      appliesToFieldId: 'material',
      match: { kind: 'equals', value: 'portland_stone' },
      effect: { kind: 'multiply', factor: 1.5 },
    },
    {
      id: 'material_cast_stone',
      label: 'Cast stone premium',
      appliesToFieldId: 'material',
      match: { kind: 'equals', value: 'cast_stone' },
      effect: { kind: 'multiply', factor: 1.8 },
    },
    {
      id: 'material_granite',
      label: 'Granite premium',
      appliesToFieldId: 'material',
      match: { kind: 'equals', value: 'granite' },
      effect: { kind: 'multiply', factor: 2.2 },
    },
  ],
  extras: [
    {
      id: 'step_threads',
      label: 'Step threads',
      appliesToFieldId: 'step_threads',
      match: { kind: 'equals', value: 'yes' },
      amountPence: 30000, // £300 flat
    },
    {
      id: 'step_risers',
      label: 'Step risers',
      appliesToFieldId: 'step_risers',
      match: { kind: 'equals', value: 'yes' },
      amountPence: 20000, // £200 flat
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
  rangeSpreadBasisPoints: 1500, // ±15%
};
