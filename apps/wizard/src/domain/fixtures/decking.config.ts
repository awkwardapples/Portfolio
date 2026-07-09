/**
 * CANONICAL REFERENCE CONFIG — Decking vertical.
 *
 * Redesigned in Step 5.13b to use the new step types introduced in 5.13a.
 * Pricing switches from linear metre (length only) to square metre (area).
 *
 * Flow: size → material → estimate → extras → site_photos → contact-and-address → optional-details
 * The pre-step (ADR-0022) collects postcode only (reduced in 5.13c).
 *
 * MONEY: every monetary value is INTEGER PENCE. £90.00/m² = 9000.
 */

import type { WizardConfig } from '@/domain/config/wizard-config';
import type { PricingConfig } from '@/domain/config/pricing';

export const deckingWizardConfig: WizardConfig = {
  schemaVersion: 1,
  id: 'decking',
  quoteMode: 'instant',
  title: 'Decking',
  steps: [
    {
      stepKind: 'size-bracket-selector',
      id: 'deck_size',
      title: 'How large is the deck?',
      description: 'Choose the approximate area, or enter the exact measurement.',
      answerKey: 'deck_size',
      brackets: [
        { id: 'small', label: 'Small', minValue: 0, maxValue: 10, unit: 'm²', typicalValue: 8 },
        { id: 'medium', label: 'Medium', minValue: 10, maxValue: 30, unit: 'm²', typicalValue: 20 },
        { id: 'large', label: 'Large', minValue: 30, maxValue: 60, unit: 'm²', typicalValue: 45 },
      ],
      exactPromptLabel: 'I know the exact area',
      exactFields: [{ id: 'area_m2', label: 'Area in square metres', unit: 'm²' }],
    },
    {
      stepKind: 'visual-card-selector',
      id: 'material_step',
      title: 'What material?',
      description: 'Choose the decking material.',
      answerKey: 'material',
      multiple: false,
      options: [
        { id: 'softwood', label: 'Softwood', description: 'Pine or spruce — cost-effective' },
        { id: 'hardwood', label: 'Hardwood', description: 'Oak or ipe — long lasting' },
        { id: 'composite', label: 'Composite', description: 'Low maintenance' },
      ],
    },
    {
      stepKind: 'estimate-display',
      id: 'estimate',
      title: 'Your estimate',
      description: 'Based on the details you have provided.',
      disclaimer: 'This is a guide price. We confirm exact costs after a site survey.',
      showRangeAsRange: true,
      onAdjustGoTo: 'deck_size',
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
          id: 'existing_deck_removal',
          key: 'existing_deck_removal',
          type: 'select',
          label: 'Is there an existing deck to remove first?',
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
 * Placeholder pricing for decking.
 * Base: £90/m² (softwood baseline). Material premiums as modifiers.
 *
 * Worked example: 20m² softwood, no extras
 *   base: 9000 × 20 = 180 000 p (£1 800)
 *   round to £5: 180 000
 *   range ±15%: £1 530 – £2 070
 */
export const deckingPricingConfig: PricingConfig = {
  schemaVersion: 1,
  currency: 'GBP',
  base: {
    label: 'Base rate per square metre (softwood)',
    perUnitPence: 9000, // £90.00 per m²
    unit: 'square_metre',
    quantityFieldId: 'area_m2',
  },
  modifiers: [
    {
      id: 'material_hardwood',
      label: 'Hardwood premium',
      appliesToFieldId: 'material',
      match: { kind: 'equals', value: 'hardwood' },
      effect: { kind: 'multiply', factor: 1.5 },
    },
    {
      id: 'material_composite',
      label: 'Composite premium',
      appliesToFieldId: 'material',
      match: { kind: 'equals', value: 'composite' },
      effect: { kind: 'multiply', factor: 1.8 },
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
      toPence: 500, // round to nearest £5
    },
  },
  rangeSpreadBasisPoints: 1500, // ±15%
};
