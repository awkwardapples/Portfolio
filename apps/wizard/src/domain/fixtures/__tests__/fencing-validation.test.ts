import { describe, it, expect } from 'vitest';

import { validateWizardConfig, validatePricingConfig } from '@/domain/validation/validate';
import { fencingWizardConfig, fencingPricingConfig } from '@/domain/fixtures/fencing.config';
import { isFieldStep } from '@/domain/config/wizard-config';

describe('fencing reference config', () => {
  it('passes wizard validation', () => {
    const result = validateWizardConfig(fencingWizardConfig);
    expect(result.ok).toBe(true);
  });

  it('passes pricing validation against the wizard', () => {
    const result = validatePricingConfig(fencingPricingConfig, fencingWizardConfig);
    expect(result.ok).toBe(true);
  });

  it('contains exactly 7 steps in expected order', () => {
    expect(fencingWizardConfig.steps.map((s) => s.id)).toEqual([
      'fence_size',
      'fence_type_step',
      'fence_height_step',
      'estimate',
      'extras',
      'site_photos',
      'contact-and-address',
    ]);
  });

  it('first step is a size-bracket-selector for fence length', () => {
    const step = fencingWizardConfig.steps[0];
    expect(step?.id).toBe('fence_size');
    if (!step || isFieldStep(step)) throw new Error('expected non-field step');
    expect(step.stepKind).toBe('size-bracket-selector');
  });

  it('size bracket step has 3 brackets and length_m exact field', () => {
    const step = fencingWizardConfig.steps[0];
    if (!step || isFieldStep(step) || step.stepKind !== 'size-bracket-selector')
      throw new Error('expected size-bracket-selector');
    expect(step.brackets).toHaveLength(3);
    expect(step.exactFields.map((f) => f.id)).toEqual(['length_m']);
  });

  it('fence_type_step is a visual-card-selector with 4 options', () => {
    const step = fencingWizardConfig.steps[1];
    if (!step || isFieldStep(step) || step.stepKind !== 'visual-card-selector')
      throw new Error('expected visual-card-selector');
    expect(step.answerKey).toBe('fence_type');
    expect(step.options.map((o) => o.id)).toEqual([
      'feather_edge',
      'closeboard',
      'panel',
      'chain_link',
    ]);
  });

  it('fence_height_step is a visual-card-selector with 3 options', () => {
    const step = fencingWizardConfig.steps[2];
    if (!step || isFieldStep(step) || step.stepKind !== 'visual-card-selector')
      throw new Error('expected visual-card-selector');
    expect(step.answerKey).toBe('height');
    expect(step.options).toHaveLength(3);
  });

  it('estimate step is an estimate-display with onAdjustGoTo fence_size', () => {
    const step = fencingWizardConfig.steps[3];
    if (!step || isFieldStep(step) || step.stepKind !== 'estimate-display')
      throw new Error('expected estimate-display');
    expect(step.onAdjustGoTo).toBe('fence_size');
  });

  it('pricing base uses length_m as quantity field', () => {
    expect(fencingPricingConfig.base.quantityFieldId).toBe('length_m');
    expect(fencingPricingConfig.base.unit).toBe('linear_metre');
  });

  it('pricing has 5 modifiers covering type and height variants', () => {
    expect(fencingPricingConfig.modifiers).toHaveLength(5);
    const ids = fencingPricingConfig.modifiers.map((m) => m.id);
    expect(ids).toContain('type_chain_link');
    expect(ids).toContain('height_low');
  });

  it('old contact step has been replaced — no step with id "contact" in the config', () => {
    expect(fencingWizardConfig.steps.map((s) => s.id)).not.toContain('contact');
  });

  it('site_photos step is optional photo field with maxCount 5', () => {
    const step = fencingWizardConfig.steps[5];
    if (!step || !isFieldStep(step)) throw new Error('expected field step at index 5');
    expect(step.id).toBe('site_photos');
    const photo = step.fields.find((f) => f.type === 'photo');
    expect(photo?.required).toBe(false);
    expect(photo?.maxCount).toBe(5);
  });

  it('contact-and-address step collects name, phone, email, full_address — all required', () => {
    const step = fencingWizardConfig.steps[6];
    if (!step || !isFieldStep(step)) throw new Error('expected field step at index 6');
    expect(step.id).toBe('contact-and-address');
    const keys = step.fields.map((f) => f.key);
    expect(keys).toEqual(['contact_name', 'contact_phone', 'contact_email', 'full_address']);
    for (const field of step.fields) {
      expect(field.required).toBe(true);
    }
  });
});
