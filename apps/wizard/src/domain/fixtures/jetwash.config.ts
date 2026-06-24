/**
 * Pressure washing (jetwash) wizard configuration (Step 5.9).
 *
 * Instant-quote service. Simple area-based pricing.
 * Placeholder pricing per ADR-0021 Decision 5.
 *
 * MONEY: every monetary value is INTEGER PENCE.
 */

import type { WizardConfig } from '@/domain/config/wizard-config';
import type { PricingConfig } from '@/domain/config/pricing';

export const jetwashWizardConfig: WizardConfig = {
  schemaVersion: 1,
  id: 'jetwash',
  quoteMode: 'instant',
  title: 'Pressure washing',
  steps: [
    {
      id: 'area',
      title: 'Area to clean',
      description: 'Tell us the approximate area that needs pressure washing.',
      fields: [
        {
          id: 'area_m2',
          key: 'area_m2',
          type: 'number',
          label: 'Approximate area in square metres',
          help: 'A rough estimate is fine. Measure the length × width of the surface.',
          required: true,
        },
        {
          id: 'surface_type',
          key: 'surface_type',
          type: 'select',
          label: 'Surface type',
          required: true,
          options: [
            { value: 'patio', label: 'Patio or paving' },
            { value: 'driveway', label: 'Driveway' },
            { value: 'decking', label: 'Decking or timber' },
            { value: 'path', label: 'Path or steps' },
            { value: 'other', label: 'Other outdoor surface' },
          ],
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
 * Placeholder pricing for pressure washing.
 * Base: £4/m². Small premium for decking (more care required).
 */
export const jetwashPricingConfig: PricingConfig = {
  schemaVersion: 1,
  currency: 'GBP',
  base: {
    label: 'Base rate per square metre',
    perUnitPence: 400, // £4.00 per m²
    unit: 'square_metre',
    quantityFieldId: 'area_m2',
  },
  modifiers: [
    {
      id: 'surface_decking',
      label: 'Decking treatment premium',
      appliesToFieldId: 'surface_type',
      match: { kind: 'equals', value: 'decking' },
      effect: { kind: 'multiply', factor: 1.3 },
    },
  ],
  extras: [],
  bounds: {
    minPence: 5000, // £50 minimum job
    maxPence: 500000, // £5,000 ceiling
    rounding: {
      mode: 'nearest',
      toPence: 500, // round to nearest £5
    },
  },
  rangeSpreadBasisPoints: 1500, // ±15%
};
