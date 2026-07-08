/**
 * CANONICAL REFERENCE CONFIG — Patio & paving vertical.
 *
 * Redesigned in Step 5.13b to use the new step types introduced in 5.13a:
 *   - SizeBracketSelectorStep for patio area (bracket or exact)
 *   - VisualCardSelectorStep for paving material
 *   - EstimateDisplayStep mid-wizard with accept/adjust decision
 *
 * Flow: size → material → estimate → contact → extras
 * The pre-step (ADR-0022) collects name/postcode/phone/email first.
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
      stepKind: 'size-bracket-selector',
      id: 'patio_size',
      title: 'How large is the patio area?',
      description: 'Choose an approximate size, or enter the exact measurement.',
      answerKey: 'patio_size',
      brackets: [
        { id: 'small', label: 'Small', minValue: 0, maxValue: 15, unit: 'm²', typicalValue: 10 },
        { id: 'medium', label: 'Medium', minValue: 15, maxValue: 35, unit: 'm²', typicalValue: 25 },
        { id: 'large', label: 'Large', minValue: 35, maxValue: 80, unit: 'm²', typicalValue: 48 },
      ],
      exactPromptLabel: 'I know the exact area',
      exactFields: [{ id: 'area_m2', label: 'Area in square metres', unit: 'm²' }],
    },
    {
      stepKind: 'visual-card-selector',
      id: 'material_step',
      title: 'What paving material?',
      description: 'Choose the material for your patio.',
      answerKey: 'material',
      options: [
        { id: 'riven_slabs', label: '450×450 Riven Slabs' },
        { id: 'sandstone_indian', label: 'Indian Sandstone' },
        { id: 'sandstone_sawn', label: 'Sawn Sandstone' },
        { id: 'porcelain', label: 'Porcelain' },
      ],
    },
    {
      stepKind: 'estimate-display',
      id: 'estimate',
      title: 'Your estimate',
      description: 'Based on the details you have provided.',
      disclaimer: 'This is a guide price. We confirm exact costs after a site survey.',
      onAdjustGoTo: 'patio_size',
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
      id: 'extras',
      title: 'Extras',
      description: 'Optional additions to your quote.',
      fields: [
        {
          id: 'edging',
          key: 'edging',
          type: 'select',
          label: 'Patio edging',
          required: true,
          options: [
            { value: 'none', label: 'No edging' },
            { value: 'block_edging', label: 'Block edging' },
            { value: 'kerb_edging', label: 'Kerb edging' },
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
  ],
};

/**
 * Placeholder pricing for patio & paving.
 * Base: £75/m² (riven slabs). Material premiums as modifiers. Edging and steps as extras.
 * Porcelain option added in 5.13b redesign.
 * A real deployment calibrates these values for their local market.
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
    {
      id: 'material_porcelain',
      label: 'Porcelain premium',
      appliesToFieldId: 'material',
      match: { kind: 'equals', value: 'porcelain' },
      effect: { kind: 'multiply', factor: 1.65 },
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
      toPence: 500, // round to nearest £5
    },
  },
  rangeSpreadBasisPoints: 1500, // ±15%
};
