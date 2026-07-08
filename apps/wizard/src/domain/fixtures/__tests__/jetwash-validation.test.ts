import { describe, it, expect } from 'vitest';

import { validateWizardConfig, validatePricingConfig } from '@/domain/validation/validate';
import { jetwashWizardConfig, jetwashPricingConfig } from '@/domain/fixtures/jetwash.config';
import { isFieldStep } from '@/domain/config/wizard-config';

describe('jetwash (pressure washing) reference config', () => {
  it('passes wizard validation', () => {
    expect(validateWizardConfig(jetwashWizardConfig).ok).toBe(true);
  });

  it('passes pricing validation against the wizard', () => {
    expect(validatePricingConfig(jetwashPricingConfig, jetwashWizardConfig).ok).toBe(true);
  });

  it('contains exactly 5 steps in expected order', () => {
    expect(jetwashWizardConfig.steps.map((s) => s.id)).toEqual([
      'area_size',
      'surface_type_step',
      'estimate',
      'site_photos',
      'contact-and-address',
    ]);
  });

  it('area_size is a size-bracket-selector with 3 brackets and area_m2 exact field', () => {
    const step = jetwashWizardConfig.steps[0];
    if (!step || isFieldStep(step) || step.stepKind !== 'size-bracket-selector')
      throw new Error('expected size-bracket-selector');
    expect(step.brackets).toHaveLength(3);
    expect(step.exactFields.map((f) => f.id)).toEqual(['area_m2']);
  });

  it('surface_type_step is a visual-card-selector with 4 options (no "other")', () => {
    const step = jetwashWizardConfig.steps[1];
    if (!step || isFieldStep(step) || step.stepKind !== 'visual-card-selector')
      throw new Error('expected visual-card-selector');
    expect(step.answerKey).toBe('surface_type');
    expect(step.options.map((o) => o.id)).toEqual(['patio', 'driveway', 'decking', 'path']);
  });

  it('pricing base uses area_m2 as quantity field with square_metre unit', () => {
    expect(jetwashPricingConfig.base.quantityFieldId).toBe('area_m2');
    expect(jetwashPricingConfig.base.unit).toBe('square_metre');
  });

  it('old contact step has been replaced — no step with id "contact" in the config', () => {
    expect(jetwashWizardConfig.steps.map((s) => s.id)).not.toContain('contact');
  });

  it('site_photos step is optional photo field with maxCount 5', () => {
    const step = jetwashWizardConfig.steps[3];
    if (!step || !isFieldStep(step)) throw new Error('expected field step at index 3');
    expect(step.id).toBe('site_photos');
    const photo = step.fields.find((f) => f.type === 'photo');
    expect(photo?.required).toBe(false);
    expect(photo?.maxCount).toBe(5);
  });

  it('contact-and-address step collects name, phone, email, full_address — all required', () => {
    const step = jetwashWizardConfig.steps[4];
    if (!step || !isFieldStep(step)) throw new Error('expected field step at index 4');
    expect(step.id).toBe('contact-and-address');
    const keys = step.fields.map((f) => f.key);
    expect(keys).toEqual(['contact_name', 'contact_phone', 'contact_email', 'full_address']);
    for (const field of step.fields) {
      expect(field.required).toBe(true);
    }
  });
});
