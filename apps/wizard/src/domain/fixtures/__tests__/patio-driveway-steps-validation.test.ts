import { describe, it, expect } from 'vitest';

import { validateWizardConfig, validatePricingConfig } from '@/domain/validation/validate';
import { patioWizardConfig, patioPricingConfig } from '@/domain/fixtures/patio.config';
import { drivewayWizardConfig, drivewayPricingConfig } from '@/domain/fixtures/driveway.config';
import { stepsWizardConfig, stepsPricingConfig } from '@/domain/fixtures/steps.config';
import { isFieldStep } from '@/domain/config/wizard-config';
import { asFieldStep } from './_helpers';

// ---------------------------------------------------------------------------
// Patio
// ---------------------------------------------------------------------------

describe('patio reference config', () => {
  it('passes wizard validation', () => {
    expect(validateWizardConfig(patioWizardConfig).ok).toBe(true);
  });

  it('passes pricing validation against the wizard', () => {
    expect(validatePricingConfig(patioPricingConfig, patioWizardConfig).ok).toBe(true);
  });

  it('contains exactly 5 steps in expected order', () => {
    expect(patioWizardConfig.steps.map((s) => s.id)).toEqual([
      'patio_size',
      'material_step',
      'estimate',
      'contact',
      'extras',
    ]);
  });

  it('patio_size is a size-bracket-selector with 3 brackets and area_m2 exact field', () => {
    const step = patioWizardConfig.steps[0];
    if (!step || isFieldStep(step) || step.stepKind !== 'size-bracket-selector')
      throw new Error('expected size-bracket-selector');
    expect(step.brackets).toHaveLength(3);
    expect(step.exactFields.map((f) => f.id)).toEqual(['area_m2']);
  });

  it('material_step is a visual-card-selector with 4 material options including porcelain', () => {
    const step = patioWizardConfig.steps[1];
    if (!step || isFieldStep(step) || step.stepKind !== 'visual-card-selector')
      throw new Error('expected visual-card-selector');
    expect(step.answerKey).toBe('material');
    expect(step.options.map((o) => o.id)).toEqual([
      'riven_slabs',
      'sandstone_indian',
      'sandstone_sawn',
      'porcelain',
    ]);
  });

  it('pricing base uses area_m2 as quantity field', () => {
    expect(patioPricingConfig.base.quantityFieldId).toBe('area_m2');
    expect(patioPricingConfig.base.unit).toBe('square_metre');
  });
});

// ---------------------------------------------------------------------------
// Driveway
// ---------------------------------------------------------------------------

describe('driveway reference config', () => {
  it('passes wizard validation', () => {
    expect(validateWizardConfig(drivewayWizardConfig).ok).toBe(true);
  });

  it('passes pricing validation against the wizard', () => {
    expect(validatePricingConfig(drivewayPricingConfig, drivewayWizardConfig).ok).toBe(true);
  });

  it('contains exactly 5 steps in expected order', () => {
    expect(drivewayWizardConfig.steps.map((s) => s.id)).toEqual([
      'driveway_size',
      'material_step',
      'estimate',
      'contact',
      'extras',
    ]);
  });

  it('material_step is a visual-card-selector with 4 driveway-specific options', () => {
    const step = drivewayWizardConfig.steps[1];
    if (!step || isFieldStep(step) || step.stepKind !== 'visual-card-selector')
      throw new Error('expected visual-card-selector');
    expect(step.options.map((o) => o.id)).toEqual([
      'driveline_50',
      'tegula',
      'resin_bound',
      'drivesys',
    ]);
  });

  it('pricing base uses area_m2 and square_metre unit', () => {
    expect(drivewayPricingConfig.base.quantityFieldId).toBe('area_m2');
    expect(drivewayPricingConfig.base.unit).toBe('square_metre');
  });

  it('pricing has 3 modifiers including resin_bound', () => {
    expect(drivewayPricingConfig.modifiers).toHaveLength(3);
    const ids = drivewayPricingConfig.modifiers.map((m) => m.id);
    expect(ids).toContain('material_resin_bound');
  });
});

// ---------------------------------------------------------------------------
// Steps (garden steps — redesigned in Commit 4 / 5.13b)
// ---------------------------------------------------------------------------

describe('steps (garden steps) reference config', () => {
  it('passes wizard validation', () => {
    expect(validateWizardConfig(stepsWizardConfig).ok).toBe(true);
  });

  it('passes pricing validation against the wizard', () => {
    expect(validatePricingConfig(stepsPricingConfig, stepsWizardConfig).ok).toBe(true);
  });

  it('is an instant-quote wizard', () => {
    expect(stepsWizardConfig.quoteMode).toBe('instant');
  });

  it('contains exactly 5 steps in expected order', () => {
    expect(stepsWizardConfig.steps.map((s) => s.id)).toEqual([
      'design',
      'dimensions_and_extras',
      'site_photos',
      'contact',
      'review',
    ]);
  });

  it('design step has shape, material, and step_count fields', () => {
    const step = asFieldStep(stepsWizardConfig.steps.find((s) => s.id === 'design'));
    const ids = step.fields.map((f) => f.id);
    expect(ids).toContain('shape');
    expect(ids).toContain('material');
    expect(ids).toContain('step_count');
  });

  it('pricing base uses step_count as quantity field', () => {
    expect(stepsPricingConfig.base.quantityFieldId).toBe('step_count');
    expect(stepsPricingConfig.base.unit).toBe('item');
  });
});
