/**
 * CANONICAL REFERENCE CONFIG — Painting & decorating vertical.
 *
 * Redesigned in Step 5.13b to use the new step types introduced in 5.13a:
 *   - SizeBracketSelectorStep for room count (bracket or exact)
 *   - VisualCardSelectorStep for what to paint (multiple selection)
 *   - EstimateDisplayStep mid-wizard with accept/adjust decision
 *
 * Flow: rooms → what to paint → estimate → extras → site_photos → contact-and-address → optional-details
 * The pre-step (ADR-0022) collects postcode only (reduced in 5.13c).
 *
 * MONEY: every monetary value is INTEGER PENCE. £300.00/room = 30000.
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
      stepKind: 'size-bracket-selector',
      id: 'rooms_step',
      title: 'How many rooms need painting?',
      description: 'Choose an approximate room count, or enter the exact number.',
      answerKey: 'room_count_bracket',
      brackets: [
        {
          id: 'few',
          label: 'A few rooms',
          minValue: 1,
          maxValue: 3,
          unit: 'rooms',
          typicalValue: 2,
        },
        {
          id: 'several',
          label: 'Several rooms',
          minValue: 3,
          maxValue: 6,
          unit: 'rooms',
          typicalValue: 4,
        },
        {
          id: 'many',
          label: 'Many rooms',
          minValue: 6,
          maxValue: 15,
          unit: 'rooms',
          typicalValue: 6,
        },
      ],
      exactPromptLabel: 'I know the exact number of rooms',
      exactFields: [{ id: 'room_count', label: 'Number of rooms', unit: 'rooms' }],
    },
    {
      stepKind: 'visual-card-selector',
      id: 'what_to_paint_step',
      title: 'What needs painting?',
      description: 'Select all that apply.',
      answerKey: 'what_to_paint',
      multiple: true,
      options: [
        { id: 'walls', label: 'Walls' },
        { id: 'ceilings', label: 'Ceilings' },
        { id: 'skirting', label: 'Skirting boards' },
        { id: 'doors', label: 'Doors' },
        { id: 'windows', label: 'Window frames' },
      ],
    },
    {
      stepKind: 'estimate-display',
      id: 'estimate',
      title: 'Your estimate',
      description: 'Based on the details you have provided.',
      disclaimer: 'This is a guide price. We confirm exact costs after a site survey.',
      showRangeAsRange: true,
      onAdjustGoTo: 'rooms_step',
    },
    {
      id: 'extras',
      title: 'Additional details',
      description: 'Optional information to help us prepare your quote.',
      fields: [
        {
          id: 'repairs_needed',
          key: 'repairs_needed',
          type: 'checkbox',
          label: 'Surface repairs needed',
          required: false,
          options: [{ value: 'yes', label: 'Yes, some walls or ceilings need patching' }],
        },
        {
          id: 'customer_paints',
          key: 'customer_paints',
          type: 'checkbox',
          label: 'Customer supplying paint',
          required: false,
          options: [{ value: 'yes', label: 'Yes, I will supply the paint' }],
        },
      ],
    },
    {
      id: 'site_photos',
      title: 'Photos',
      description: 'Add photos of the project area.',
      fields: [
        {
          id: 'site_photos',
          key: 'site_photos',
          type: 'photo',
          label:
            'Upload 2–5 photos so we can usually confirm the estimate without arranging a site visit',
          maxCount: 5,
          required: false,
          help: 'Up to 5 photos. We accept JPEG, PNG, and WebP.',
        },
      ],
    },
    {
      id: 'contact-and-address',
      title: 'Almost done!',
      description: 'Enter your details so we can send you your personalised quote.',
      fields: [
        {
          id: 'contact_name',
          key: 'contact_name',
          type: 'text',
          label: 'Your name',
          required: true,
        },
        {
          id: 'contact_phone',
          key: 'contact_phone',
          type: 'text',
          label: 'Phone number',
          help: 'e.g. 07712 345 678',
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
          id: 'full_address',
          key: 'full_address',
          type: 'text',
          label: 'Full address',
          help: 'e.g. 12 Main Street, Guildford, GU1 3AA',
          required: true,
        },
      ],
    },
    {
      id: 'optional-details',
      title: 'Anything else? (Optional)',
      description:
        "These details help us prepare the best possible quote. Fill in what you'd like, or skip and submit.",
      allowSkip: true,
      fields: [
        {
          id: 'preferred_timeframe',
          key: 'preferred_timeframe',
          type: 'select',
          label: 'When would you like the work done?',
          required: false,
          options: [
            { value: 'next_week', label: 'Next week' },
            { value: 'next_month', label: 'Next month' },
            { value: '2_3_months', label: '2–3 months' },
            { value: 'flexible', label: 'Flexible' },
          ],
        },
        {
          id: 'furniture_handling',
          key: 'furniture_handling',
          type: 'select',
          label: 'Do you need furniture moved or covered?',
          required: false,
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ],
        },
        {
          id: 'pets',
          key: 'pets',
          type: 'select',
          label: 'Are there pets in the property?',
          required: false,
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ],
        },
        {
          id: 'customer_supplies_paint',
          key: 'customer_supplies_paint',
          type: 'select',
          label: 'Will you supply the paint?',
          required: false,
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ],
        },
        {
          id: 'additional_notes',
          key: 'additional_notes',
          type: 'textarea',
          label: 'Anything else we should know?',
          required: false,
        },
      ],
    },
  ],
};

/**
 * Placeholder pricing for painting & decorating.
 * Base: £300/room. Informational extras (repairs, customer paint) do not affect price.
 * A real deployment calibrates these values for their local market.
 */
export const paintingPricingConfig: PricingConfig = {
  schemaVersion: 1,
  currency: 'GBP',
  base: {
    label: 'Base rate per room',
    perUnitPence: 30000, // £300.00 per room
    unit: 'item',
    quantityFieldId: 'room_count',
  },
  modifiers: [],
  extras: [],
  bounds: {
    minPence: 15000, // £150 minimum job
    maxPence: 5000000, // £50,000 ceiling
    rounding: {
      mode: 'nearest',
      toPence: 500, // round to nearest £5
    },
  },
  rangeSpreadBasisPoints: 1500, // ±15%
};
