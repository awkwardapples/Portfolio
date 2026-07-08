import { describe, it, expect } from 'vitest';

import { validateWizardConfig } from '@/domain/validation/validate';
import { asFieldStep } from './_helpers';
import { generalRepairsWizardConfig } from '@/domain/fixtures/general-repairs.config';
import { plumbingWizardConfig } from '@/domain/fixtures/plumbing.config';
import { electricalWizardConfig } from '@/domain/fixtures/electrical.config';
import { carpentryWizardConfig } from '@/domain/fixtures/carpentry.config';

const MANUAL_CONFIGS = [
  { id: 'general-repairs', config: generalRepairsWizardConfig },
  { id: 'plumbing', config: plumbingWizardConfig },
  { id: 'electrical', config: electricalWizardConfig },
  { id: 'carpentry', config: carpentryWizardConfig },
];

const EXPECTED_STEP_IDS = [
  'description',
  'urgency',
  'property',
  'site_photos',
  'contact_preference',
  'contact',
  'address',
];

describe('manual-quote services — shared structural contract', () => {
  it.each(MANUAL_CONFIGS)('$id passes wizard validation', ({ config }) => {
    expect(validateWizardConfig(config).ok).toBe(true);
  });

  it.each(MANUAL_CONFIGS)('$id has quoteMode: manual', ({ config }) => {
    expect(config.quoteMode).toBe('manual');
  });

  it.each(MANUAL_CONFIGS)('$id has exactly 7 steps in the standard order', ({ config }) => {
    expect(config.steps.map((s) => s.id)).toEqual(EXPECTED_STEP_IDS);
  });

  it.each(MANUAL_CONFIGS)('$id description step has a required textarea field', ({ config }) => {
    const step = asFieldStep(config.steps.find((s) => s.id === 'description'));
    const field = step.fields.find((f) => f.type === 'textarea');
    expect(field).toBeDefined();
    expect(field!.required).toBe(true);
  });

  it.each(MANUAL_CONFIGS)('$id has a photo field with maxCount 5 (not required)', ({ config }) => {
    const step = asFieldStep(config.steps.find((s) => s.id === 'site_photos'));
    const photo = step.fields.find((f) => f.type === 'photo');
    expect(photo?.maxCount).toBe(5);
    expect(photo?.required).toBe(false);
  });
});

describe('manual-quote services — no optional-details step (regression)', () => {
  it.each(MANUAL_CONFIGS)('$id does not have an optional-details step', ({ config }) => {
    expect(config.steps.map((s) => s.id)).not.toContain('optional-details');
  });
});

describe('manual-quote services — service-specific description prompts', () => {
  it('general-repairs description field label does not mention a specific trade', () => {
    const step = asFieldStep(generalRepairsWizardConfig.steps.find((s) => s.id === 'description'));
    expect(step.fields[0]!.label.toLowerCase()).toContain('repair');
  });

  it('plumbing description field label mentions plumbing', () => {
    const step = asFieldStep(plumbingWizardConfig.steps.find((s) => s.id === 'description'));
    expect(step.fields[0]!.label.toLowerCase()).toContain('plumbing');
  });

  it('electrical description field label mentions electrical', () => {
    const step = asFieldStep(electricalWizardConfig.steps.find((s) => s.id === 'description'));
    expect(step.fields[0]!.label.toLowerCase()).toContain('electrical');
  });

  it('carpentry description field label mentions carpentry', () => {
    const step = asFieldStep(carpentryWizardConfig.steps.find((s) => s.id === 'description'));
    expect(step.fields[0]!.label.toLowerCase()).toContain('carpentry');
  });
});
