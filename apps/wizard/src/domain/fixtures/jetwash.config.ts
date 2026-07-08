/**
 * CANONICAL REFERENCE CONFIG — Pressure washing (jetwash) vertical.
 *
 * Redesigned in Step 5.13b to use the new step types introduced in 5.13a:
 *   - SizeBracketSelectorStep for area size (bracket or exact)
 *   - VisualCardSelectorStep for surface type
 *   - EstimateDisplayStep mid-wizard with accept/adjust decision
 *
 * Flow: size → surface type → estimate → site_photos → contact-and-address → optional-details
 * No extras step — jetwash is a simple two-factor quote.
 * The pre-step (ADR-0022) collects postcode only (reduced in 5.13c).
 *
 * MONEY: every monetary value is INTEGER PENCE. £4/m² = 400.
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
      stepKind: 'size-bracket-selector',
      id: 'area_size',
      title: 'How large is the area to clean?',
      description: 'Choose an approximate size, or enter the exact measurement.',
      answerKey: 'area_size',
      brackets: [
        {
          id: 'small',
          label: 'Small',
          minValue: 0,
          maxValue: 25,
          unit: 'm²',
          typicalValue: 15,
        },
        {
          id: 'medium',
          label: 'Medium',
          minValue: 25,
          maxValue: 55,
          unit: 'm²',
          typicalValue: 35,
        },
        {
          id: 'large',
          label: 'Large',
          minValue: 55,
          maxValue: 150,
          unit: 'm²',
          typicalValue: 75,
        },
      ],
      exactPromptLabel: 'I know the exact area',
      exactFields: [{ id: 'area_m2', label: 'Area in square metres', unit: 'm²' }],
    },
    {
      stepKind: 'visual-card-selector',
      id: 'surface_type_step',
      title: 'What type of surface?',
      description: 'Choose the surface that needs cleaning.',
      answerKey: 'surface_type',
      options: [
        { id: 'patio', label: 'Patio or paving' },
        { id: 'driveway', label: 'Driveway' },
        { id: 'decking', label: 'Decking or timber' },
        { id: 'path', label: 'Path or steps' },
      ],
    },
    {
      stepKind: 'estimate-display',
      id: 'estimate',
      title: 'Your estimate',
      description: 'Based on the details you have provided.',
      disclaimer: 'This is a guide price. We confirm exact costs after a site survey.',
      onAdjustGoTo: 'area_size',
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
          id: 'specific_stains',
          key: 'specific_stains',
          type: 'textarea',
          label: 'Any specific stains or marks to focus on?',
          required: false,
        },
        {
          id: 'time_preference',
          key: 'time_preference',
          type: 'select',
          label: 'Do you prefer weekday or weekend appointments?',
          required: false,
          options: [
            { value: 'weekday', label: 'Weekday' },
            { value: 'weekend', label: 'Weekend' },
            { value: 'flexible', label: 'Flexible' },
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
 * Placeholder pricing for pressure washing.
 * Base: £4/m². Small premium for decking (more care required).
 * A real deployment calibrates these values for their local market.
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
