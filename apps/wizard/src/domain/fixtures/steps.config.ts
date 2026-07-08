/**
 * CANONICAL REFERENCE CONFIG — Garden steps vertical.
 *
 * Redesigned in Step 5.13b to use the new step types introduced in 5.13a:
 *   - VisualCardSelectorStep for shape and material selection
 *   - SizeBracketSelectorStep for step count (bracket or exact)
 *   - EstimateDisplayStep mid-wizard with accept/adjust decision
 *
 * Flow: shape → material → count → estimate → contact → extras
 * The pre-step (ADR-0022) collects name/postcode/phone/email first.
 *
 * MONEY: every monetary value is INTEGER PENCE. £200/step = 20000.
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
      stepKind: 'visual-card-selector',
      id: 'shape_step',
      title: 'What shape are the steps?',
      description: 'Choose the step layout that matches your project.',
      answerKey: 'shape',
      options: [
        { id: 'straight', label: 'Straight' },
        { id: 'curved', label: 'Curved or semi-circular' },
        { id: 'not_sure', label: "Not sure — let's discuss" },
      ],
    },
    {
      stepKind: 'visual-card-selector',
      id: 'material_step',
      title: 'What material?',
      description: 'Choose the material for your steps.',
      answerKey: 'material',
      options: [
        { id: 'brick', label: 'Brick' },
        { id: 'slate', label: 'Slate' },
        { id: 'portland_stone', label: 'Portland Stone' },
        { id: 'cast_stone', label: 'Cast Stone' },
        { id: 'granite', label: 'Granite' },
      ],
    },
    {
      stepKind: 'size-bracket-selector',
      id: 'step_count_step',
      title: 'How many steps?',
      description: 'Choose an approximate count, or enter the exact number.',
      answerKey: 'step_count_bracket',
      brackets: [
        {
          id: 'few',
          label: 'A few steps',
          minValue: 1,
          maxValue: 3,
          unit: 'steps',
          typicalValue: 2,
        },
        {
          id: 'several',
          label: 'Several steps',
          minValue: 3,
          maxValue: 7,
          unit: 'steps',
          typicalValue: 5,
        },
        {
          id: 'many',
          label: 'Many steps',
          minValue: 7,
          maxValue: 20,
          unit: 'steps',
          typicalValue: 9,
        },
      ],
      exactPromptLabel: 'I know the exact number of steps',
      exactFields: [{ id: 'step_count', label: 'Number of steps', unit: 'steps' }],
    },
    {
      stepKind: 'estimate-display',
      id: 'estimate',
      title: 'Your estimate',
      description: 'Based on the details you have provided.',
      disclaimer: 'This is a guide price. We confirm exact costs after a site survey.',
      onAdjustGoTo: 'shape_step',
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
  ],
};

/**
 * Placeholder pricing for garden steps.
 * Base: £200/step (brick, straight). Shape and material premiums as modifiers.
 * Threads and risers as flat-rate extras.
 * A real deployment calibrates these values for their local market.
 */
export const stepsPricingConfig: PricingConfig = {
  schemaVersion: 1,
  currency: 'GBP',
  base: {
    label: 'Base rate per step (brick, straight)',
    perUnitPence: 20000, // £200.00 per step
    unit: 'item',
    quantityFieldId: 'step_count',
  },
  modifiers: [
    {
      id: 'shape_curved',
      label: 'Curved steps premium',
      appliesToFieldId: 'shape',
      match: { kind: 'equals', value: 'curved' },
      effect: { kind: 'multiply', factor: 1.4 },
    },
    {
      id: 'shape_not_sure',
      label: 'Uncertain shape allowance',
      appliesToFieldId: 'shape',
      match: { kind: 'equals', value: 'not_sure' },
      effect: { kind: 'multiply', factor: 1.2 },
    },
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
      label: 'Step threads supply and fit',
      appliesToFieldId: 'step_threads',
      match: { kind: 'equals', value: 'yes' },
      amountPence: 30000, // £300 flat
    },
    {
      id: 'step_risers',
      label: 'Step risers supply and fit',
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
      toPence: 500, // round to nearest £5
    },
  },
  rangeSpreadBasisPoints: 1500, // ±15%
};
