/**
 * CANONICAL REFERENCE CONFIG — Driveway vertical.
 *
 * Redesigned in Step 5.13b to use the new step types introduced in 5.13a:
 *   - SizeBracketSelectorStep for driveway area (bracket or exact)
 *   - VisualCardSelectorStep for driveway material
 *   - EstimateDisplayStep mid-wizard with accept/adjust decision
 *
 * Flow: size → material → estimate → extras → site_photos → contact-and-address → optional-details
 * The pre-step (ADR-0022) collects postcode only (reduced in 5.13c).
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
      stepKind: 'size-bracket-selector',
      id: 'driveway_size',
      title: 'How large is the driveway area?',
      description: 'Choose an approximate size, or enter the exact measurement.',
      answerKey: 'driveway_size',
      brackets: [
        { id: 'small', label: 'Small', minValue: 0, maxValue: 30, unit: 'm²', typicalValue: 20 },
        { id: 'medium', label: 'Medium', minValue: 30, maxValue: 60, unit: 'm²', typicalValue: 45 },
        { id: 'large', label: 'Large', minValue: 60, maxValue: 150, unit: 'm²', typicalValue: 80 },
      ],
      exactPromptLabel: 'I know the exact area',
      exactFields: [{ id: 'area_m2', label: 'Area in square metres', unit: 'm²' }],
    },
    {
      stepKind: 'visual-card-selector',
      id: 'material_step',
      title: 'What driveway material?',
      description: 'Choose the material for your driveway.',
      answerKey: 'material',
      multiple: false,
      options: [
        { id: 'driveline_50', label: 'Driveline 50 (block paving)' },
        { id: 'tegula', label: 'Tegula Style (textured block paving)' },
        { id: 'resin_bound', label: 'Resin bound' },
        { id: 'drivesys', label: 'Marshall Drivesys (permeable)' },
      ],
    },
    {
      stepKind: 'estimate-display',
      id: 'estimate',
      title: 'Your estimate',
      description: 'Based on the details you have provided.',
      disclaimer: 'This is a guide price. We confirm exact costs after a site survey.',
      showRangeAsRange: true,
      onAdjustGoTo: 'driveway_size',
    },
    {
      id: 'extras',
      title: 'Extras',
      description: 'Optional additions to your quote.',
      fields: [
        {
          id: 'kerb_edging',
          key: 'kerb_edging',
          type: 'checkbox',
          label: 'Kerb edging',
          required: false,
          options: [{ value: 'yes', label: 'Yes, include kerb edging' }],
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
        {
          id: 'data_processing_consent',
          key: 'data_processing_consent',
          type: 'checkbox',
          label: 'Data processing consent',
          required: true,
          options: [
            {
              value: 'agreed',
              label:
                'I agree to my personal data being processed to provide this quote, as described in our Privacy Policy (see the link in the site footer).',
            },
          ],
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
          id: 'existing_driveway_removal',
          key: 'existing_driveway_removal',
          type: 'select',
          label: 'Is there an existing driveway to remove first?',
          required: false,
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ],
        },
        {
          id: 'parking_during_work',
          key: 'parking_during_work',
          type: 'select',
          label: 'Parking access during the work',
          required: false,
          options: [
            { value: 'blocked', label: 'Driveway will be blocked' },
            { value: 'street', label: 'Street parking available' },
            { value: 'limited', label: 'Limited parking' },
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
 * Placeholder pricing for driveways.
 * Base: £80/m² (Driveline 50). Material premiums as modifiers. Extras for kerb edging and steps.
 * Resin bound option added in 5.13b redesign.
 * A real deployment calibrates these values for their local market.
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
      id: 'material_resin_bound',
      label: 'Resin bound premium',
      appliesToFieldId: 'material',
      match: { kind: 'equals', value: 'resin_bound' },
      effect: { kind: 'multiply', factor: 1.25 },
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
      match: { kind: 'equals', value: 'yes' },
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
      toPence: 500, // round to nearest £5
    },
  },
  rangeSpreadBasisPoints: 1500, // ±15%
};
