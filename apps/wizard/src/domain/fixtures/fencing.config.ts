/**
 * CANONICAL REFERENCE CONFIG — Fencing vertical.
 *
 * Redesigned in Step 5.13b to use the new step types introduced in 5.13a:
 *   - SizeBracketSelectorStep for fence length (bracket or exact)
 *   - VisualCardSelectorStep for fence type and height
 *   - EstimateDisplayStep mid-wizard with accept/adjust decision
 *
 * Flow: size → type → height → estimate → extras → site_photos → contact-and-address → optional-details
 * The pre-step (ADR-0022) collects postcode only (reduced in 5.13c).
 *
 * MONEY: every monetary value is INTEGER PENCE. £75.00/m = 7500.
 *
 * IDS vs LABELS: `id`/`key`/`answerKey`/`value` are stable contracts;
 * `label`/`title` are editable human copy.
 */

import type { WizardConfig } from '@/domain/config/wizard-config';
import type { PricingConfig } from '@/domain/config/pricing';

export const fencingWizardConfig: WizardConfig = {
  schemaVersion: 1,
  id: 'fencing',
  quoteMode: 'instant',
  title: 'Fencing',
  steps: [
    {
      stepKind: 'size-bracket-selector',
      id: 'fence_size',
      title: 'How much fencing do you need?',
      description: 'Choose the approximate length, or enter the exact measurement.',
      answerKey: 'fence_size',
      brackets: [
        { id: 'small', label: 'Small', minValue: 0, maxValue: 10, unit: 'm', typicalValue: 8 },
        { id: 'medium', label: 'Medium', minValue: 10, maxValue: 30, unit: 'm', typicalValue: 20 },
        { id: 'large', label: 'Large', minValue: 30, maxValue: 60, unit: 'm', typicalValue: 45 },
      ],
      exactPromptLabel: 'I know the exact length',
      exactFields: [{ id: 'length_m', label: 'Length in metres', unit: 'm' }],
    },
    {
      stepKind: 'visual-card-selector',
      id: 'fence_type_step',
      title: 'What type of fence?',
      description: 'Choose the fencing style that suits your property.',
      answerKey: 'fence_type',
      options: [
        { id: 'feather_edge', label: 'Feather Edge' },
        { id: 'closeboard', label: 'Closeboard' },
        { id: 'panel', label: 'Panel' },
        { id: 'chain_link', label: 'Chain Link' },
      ],
    },
    {
      stepKind: 'visual-card-selector',
      id: 'fence_height_step',
      title: 'What height?',
      description: 'Choose the approximate fence height.',
      answerKey: 'height',
      options: [
        { id: 'low', label: 'Up to 1.2m' },
        { id: 'standard', label: '1.5m to 1.8m' },
        { id: 'tall', label: 'Over 1.8m' },
      ],
    },
    {
      stepKind: 'estimate-display',
      id: 'estimate',
      title: 'Your estimate',
      description: 'Based on the details you have provided.',
      disclaimer: 'This is a guide price. We confirm exact costs after a site survey.',
      onAdjustGoTo: 'fence_size',
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
            { value: 'urgent', label: 'Urgent' },
            { value: 'next_week', label: 'Next week' },
            { value: 'next_month', label: 'Next month' },
            { value: '2_3_months', label: '2–3 months' },
            { value: 'flexible', label: 'Flexible' },
          ],
        },
        {
          id: 'gate_needed',
          key: 'gate_needed',
          type: 'select',
          label: 'Do you need a gate?',
          required: false,
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
          ],
        },
        {
          id: 'gate_width',
          key: 'gate_width',
          type: 'select',
          label: 'Approximate gate width',
          required: false,
          condition: { operator: 'equals', fieldId: 'gate_needed', value: 'yes' },
          options: [
            { value: 'small', label: 'Small (~1m)' },
            { value: 'medium', label: 'Medium (~2m)' },
            { value: 'large', label: 'Large (~3m+)' },
            { value: 'not_sure', label: 'Not sure' },
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
 * Placeholder pricing for fencing.
 *
 * Base: £75/m (feather edge baseline). Fence type and height modifiers applied
 * to the length_m quantity, which is populated either by bracket typicalValue
 * or by the user entering the exact length.
 *
 * Worked example: 20m feather_edge standard
 *   base: 7500 × 20 = 150 000 p (£1 500)
 *   no modifiers match (feather_edge and standard have no modifier)
 *   round to £5: 150 000
 *   range ±15%: £1 275 – £1 725
 *
 * A real deployment calibrates these values for their local market.
 */
export const fencingPricingConfig: PricingConfig = {
  schemaVersion: 1,
  currency: 'GBP',
  base: {
    label: 'Base rate per linear metre (feather edge)',
    perUnitPence: 7500, // £75.00 per linear metre
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
      id: 'type_panel',
      label: 'Panel premium',
      appliesToFieldId: 'fence_type',
      match: { kind: 'equals', value: 'panel' },
      effect: { kind: 'multiply', factor: 1.2 },
    },
    {
      id: 'type_chain_link',
      label: 'Chain link discount',
      appliesToFieldId: 'fence_type',
      match: { kind: 'equals', value: 'chain_link' },
      effect: { kind: 'multiply', factor: 0.55 },
    },
    {
      id: 'height_tall',
      label: 'Tall fence premium',
      appliesToFieldId: 'height',
      match: { kind: 'equals', value: 'tall' },
      effect: { kind: 'multiply', factor: 1.3 },
    },
    {
      id: 'height_low',
      label: 'Low fence discount',
      appliesToFieldId: 'height',
      match: { kind: 'equals', value: 'low' },
      effect: { kind: 'multiply', factor: 0.8 },
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
      amountPence: 40000, // £400.00
    },
  ],
  bounds: {
    minPence: 20000, // £200 minimum job
    maxPence: 5000000, // £50,000 ceiling
    rounding: {
      mode: 'nearest',
      toPence: 500, // round to nearest £5
    },
  },
  rangeSpreadBasisPoints: 1500, // ±15%
};
