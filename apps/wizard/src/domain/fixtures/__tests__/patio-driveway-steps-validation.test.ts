import { describe, it, expect } from 'vitest';

import { validateWizardConfig, validatePricingConfig } from '@/domain/validation/validate';
import { patioWizardConfig, patioPricingConfig } from '@/domain/fixtures/patio.config';
import { drivewayWizardConfig, drivewayPricingConfig } from '@/domain/fixtures/driveway.config';
import { stepsWizardConfig, stepsPricingConfig } from '@/domain/fixtures/steps.config';
import { isFieldStep } from '@/domain/config/wizard-config';

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

  it('contains exactly 6 steps in expected order', () => {
    expect(patioWizardConfig.steps.map((s) => s.id)).toEqual([
      'patio_size',
      'material_step',
      'estimate',
      'extras',
      'site_photos',
      'contact-and-address',
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

  it('old contact step has been replaced — no step with id "contact" in the config', () => {
    expect(patioWizardConfig.steps.map((s) => s.id)).not.toContain('contact');
  });

  it('site_photos step is optional photo field with maxCount 5', () => {
    const step = patioWizardConfig.steps[4];
    if (!step || !isFieldStep(step)) throw new Error('expected field step at index 4');
    expect(step.id).toBe('site_photos');
    const photo = step.fields.find((f) => f.type === 'photo');
    expect(photo?.required).toBe(false);
    expect(photo?.maxCount).toBe(5);
  });

  it('contact-and-address step collects name, phone, email, full_address — all required', () => {
    const step = patioWizardConfig.steps[5];
    if (!step || !isFieldStep(step)) throw new Error('expected field step at index 5');
    expect(step.id).toBe('contact-and-address');
    const keys = step.fields.map((f) => f.key);
    expect(keys).toEqual(['contact_name', 'contact_phone', 'contact_email', 'full_address']);
    for (const field of step.fields) {
      expect(field.required).toBe(true);
    }
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

  it('contains exactly 6 steps in expected order', () => {
    expect(drivewayWizardConfig.steps.map((s) => s.id)).toEqual([
      'driveway_size',
      'material_step',
      'estimate',
      'extras',
      'site_photos',
      'contact-and-address',
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

  it('old contact step has been replaced — no step with id "contact" in the config', () => {
    expect(drivewayWizardConfig.steps.map((s) => s.id)).not.toContain('contact');
  });

  it('site_photos step is optional photo field with maxCount 5', () => {
    const step = drivewayWizardConfig.steps[4];
    if (!step || !isFieldStep(step)) throw new Error('expected field step at index 4');
    expect(step.id).toBe('site_photos');
    const photo = step.fields.find((f) => f.type === 'photo');
    expect(photo?.required).toBe(false);
    expect(photo?.maxCount).toBe(5);
  });

  it('contact-and-address step collects name, phone, email, full_address — all required', () => {
    const step = drivewayWizardConfig.steps[5];
    if (!step || !isFieldStep(step)) throw new Error('expected field step at index 5');
    expect(step.id).toBe('contact-and-address');
    const keys = step.fields.map((f) => f.key);
    expect(keys).toEqual(['contact_name', 'contact_phone', 'contact_email', 'full_address']);
    for (const field of step.fields) {
      expect(field.required).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Steps (garden steps)
// ---------------------------------------------------------------------------

describe('steps (garden steps) reference config', () => {
  it('passes wizard validation', () => {
    expect(validateWizardConfig(stepsWizardConfig).ok).toBe(true);
  });

  it('passes pricing validation against the wizard', () => {
    expect(validatePricingConfig(stepsPricingConfig, stepsWizardConfig).ok).toBe(true);
  });

  it('contains exactly 7 steps in expected order', () => {
    expect(stepsWizardConfig.steps.map((s) => s.id)).toEqual([
      'shape_step',
      'material_step',
      'step_count_step',
      'estimate',
      'extras',
      'site_photos',
      'contact-and-address',
    ]);
  });

  it('shape_step is a visual-card-selector with straight/curved/not_sure options', () => {
    const step = stepsWizardConfig.steps[0];
    if (!step || isFieldStep(step) || step.stepKind !== 'visual-card-selector')
      throw new Error('expected visual-card-selector');
    expect(step.answerKey).toBe('shape');
    expect(step.options.map((o) => o.id)).toEqual(['straight', 'curved', 'not_sure']);
  });

  it('material_step is a visual-card-selector with 5 material options', () => {
    const step = stepsWizardConfig.steps[1];
    if (!step || isFieldStep(step) || step.stepKind !== 'visual-card-selector')
      throw new Error('expected visual-card-selector');
    expect(step.answerKey).toBe('material');
    expect(step.options.map((o) => o.id)).toEqual([
      'brick',
      'slate',
      'portland_stone',
      'cast_stone',
      'granite',
    ]);
  });

  it('step_count_step is a size-bracket-selector with step_count exact field', () => {
    const step = stepsWizardConfig.steps[2];
    if (!step || isFieldStep(step) || step.stepKind !== 'size-bracket-selector')
      throw new Error('expected size-bracket-selector');
    expect(step.brackets).toHaveLength(3);
    expect(step.exactFields.map((f) => f.id)).toEqual(['step_count']);
  });

  it('pricing base uses step_count as quantity field with item unit', () => {
    expect(stepsPricingConfig.base.quantityFieldId).toBe('step_count');
    expect(stepsPricingConfig.base.unit).toBe('item');
  });

  it('pricing has 6 modifiers covering shape and material variants', () => {
    expect(stepsPricingConfig.modifiers).toHaveLength(6);
    const ids = stepsPricingConfig.modifiers.map((m) => m.id);
    expect(ids).toContain('shape_curved');
    expect(ids).toContain('material_granite');
  });

  it('old contact step has been replaced — no step with id "contact" in the config', () => {
    expect(stepsWizardConfig.steps.map((s) => s.id)).not.toContain('contact');
  });

  it('site_photos step is optional photo field with maxCount 5', () => {
    const step = stepsWizardConfig.steps[5];
    if (!step || !isFieldStep(step)) throw new Error('expected field step at index 5');
    expect(step.id).toBe('site_photos');
    const photo = step.fields.find((f) => f.type === 'photo');
    expect(photo?.required).toBe(false);
    expect(photo?.maxCount).toBe(5);
  });

  it('contact-and-address step collects name, phone, email, full_address — all required', () => {
    const step = stepsWizardConfig.steps[6];
    if (!step || !isFieldStep(step)) throw new Error('expected field step at index 6');
    expect(step.id).toBe('contact-and-address');
    const keys = step.fields.map((f) => f.key);
    expect(keys).toEqual(['contact_name', 'contact_phone', 'contact_email', 'full_address']);
    for (const field of step.fields) {
      expect(field.required).toBe(true);
    }
  });
});
