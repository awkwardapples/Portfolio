/**
 * Painting & decorating wizard configuration (Step 5.9).
 *
 * Instant-quote service. Pricing is placeholder (ADR-0021 Decision 5);
 * calibration is per-client at 5.12 and equivalent steps.
 *
 * PRICING NOTE — room_count as quantity:
 *   The pricing engine takes a single quantityFieldId. room_count is used as
 *   the primary quantity. Per-room modifiers for size and ceiling height apply
 *   uniformly across all rooms (a simplification appropriate for a template).
 *   A real client may want to break down rooms individually; that requires a
 *   richer field structure, which is a per-client 5.12 concern.
 *
 * MONEY: every monetary value is INTEGER PENCE. £275 = 27500.
 */

import type { WizardConfig } from '@/domain/config/wizard-config';
import type { PricingConfig } from '@/domain/config/pricing';

export const paintingWizardConfig: WizardConfig = {
  schemaVersion: 1,
  id: 'painting',
  quoteMode: 'instant',
  title: 'Painting & decorating',
  steps: [
    {
      id: 'rooms',
      title: 'Rooms',
      description: 'Tell us how many rooms need painting.',
      fields: [
        {
          id: 'room_count',
          key: 'room_count',
          type: 'number',
          label: 'Number of rooms',
          help: 'Count each bedroom, living room, kitchen, and bathroom as one room each.',
          required: true,
        },
        {
          id: 'what_to_paint',
          key: 'what_to_paint',
          type: 'checkbox',
          label: 'What needs painting?',
          required: true,
          options: [
            { value: 'walls', label: 'Walls' },
            { value: 'ceilings', label: 'Ceilings' },
            { value: 'skirting', label: 'Skirting boards' },
            { value: 'doors', label: 'Doors' },
            { value: 'windows', label: 'Window frames' },
          ],
        },
      ],
    },
    {
      id: 'details',
      title: 'Room details',
      description: 'Help us estimate the scale of the job.',
      fields: [
        {
          id: 'room_size',
          key: 'room_size',
          type: 'select',
          label: 'Room sizes',
          required: true,
          options: [
            { value: 'standard', label: 'Standard' },
            { value: 'large', label: 'Larger than average' },
            { value: 'small', label: 'Smaller than average' },
          ],
        },
        {
          id: 'ceiling_height',
          key: 'ceiling_height',
          type: 'select',
          label: 'Ceiling height',
          required: true,
          options: [
            { value: 'standard', label: 'Standard (up to 2.4m)' },
            { value: 'high', label: 'Higher than standard (above 2.4m)' },
          ],
        },
        {
          id: 'paint_type',
          key: 'paint_type',
          type: 'select',
          label: 'Paint type',
          required: true,
          options: [
            { value: 'water', label: 'Water-based (standard)' },
            { value: 'oil', label: 'Oil-based (premium finish)' },
          ],
        },
      ],
    },
    {
      id: 'site_photos',
      title: 'Photos',
      description: 'Add photos of the rooms so we can give a more accurate estimate.',
      fields: [
        {
          id: 'site_photos',
          key: 'site_photos',
          type: 'photo',
          label: 'Photos of the rooms (optional)',
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
 * Placeholder pricing for painting & decorating.
 * Base: £275 per room. Modifiers for large rooms, high ceilings, oil paint.
 * A real deployment calibrates these values for their local market.
 */
export const paintingPricingConfig: PricingConfig = {
  schemaVersion: 1,
  currency: 'GBP',
  base: {
    label: 'Base rate per room',
    perUnitPence: 27500, // £275.00 per room
    unit: 'item',
    quantityFieldId: 'room_count',
  },
  modifiers: [
    {
      id: 'room_size_large',
      label: 'Large rooms premium',
      appliesToFieldId: 'room_size',
      match: { kind: 'equals', value: 'large' },
      effect: { kind: 'multiply', factor: 1.2 },
    },
    {
      id: 'room_size_small',
      label: 'Small rooms discount',
      appliesToFieldId: 'room_size',
      match: { kind: 'equals', value: 'small' },
      effect: { kind: 'multiply', factor: 0.85 },
    },
    {
      id: 'ceiling_high',
      label: 'High ceiling premium',
      appliesToFieldId: 'ceiling_height',
      match: { kind: 'equals', value: 'high' },
      effect: { kind: 'multiply', factor: 1.15 },
    },
    {
      id: 'paint_oil',
      label: 'Oil-based paint premium',
      appliesToFieldId: 'paint_type',
      match: { kind: 'equals', value: 'oil' },
      effect: { kind: 'multiply', factor: 1.1 },
    },
  ],
  extras: [],
  bounds: {
    minPence: 15000, // £150 minimum job
    maxPence: 5000000, // £50,000 ceiling
    rounding: {
      mode: 'nearest',
      toPence: 5000, // round to nearest £50
    },
  },
  rangeSpreadBasisPoints: 1500, // ±15%
};
