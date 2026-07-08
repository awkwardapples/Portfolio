import { describe, it, expect } from 'vitest';

import { validateWizardConfig, validatePricingConfig } from '@/domain/validation/validate';
import { paintingWizardConfig, paintingPricingConfig } from '@/domain/fixtures/painting.config';
import { isFieldStep } from '@/domain/config/wizard-config';

describe('painting reference config', () => {
  it('passes wizard validation', () => {
    const result = validateWizardConfig(paintingWizardConfig);
    expect(result.ok).toBe(true);
  });

  it('passes pricing validation against the wizard', () => {
    const result = validatePricingConfig(paintingPricingConfig, paintingWizardConfig);
    expect(result.ok).toBe(true);
  });

  it('contains exactly 6 steps in expected order', () => {
    expect(paintingWizardConfig.steps.map((s) => s.id)).toEqual([
      'rooms_step',
      'what_to_paint_step',
      'estimate',
      'extras',
      'site_photos',
      'contact-and-address',
    ]);
  });

  it('rooms_step is a size-bracket-selector with 3 brackets and room_count exact field', () => {
    const step = paintingWizardConfig.steps[0];
    if (!step || isFieldStep(step) || step.stepKind !== 'size-bracket-selector')
      throw new Error('expected size-bracket-selector');
    expect(step.brackets).toHaveLength(3);
    expect(step.exactFields.map((f) => f.id)).toEqual(['room_count']);
  });

  it('what_to_paint_step is a visual-card-selector with multiple:true and 5 options', () => {
    const step = paintingWizardConfig.steps[1];
    if (!step || isFieldStep(step) || step.stepKind !== 'visual-card-selector')
      throw new Error('expected visual-card-selector');
    expect(step.answerKey).toBe('what_to_paint');
    expect(step.multiple).toBe(true);
    expect(step.options.map((o) => o.id)).toEqual([
      'walls',
      'ceilings',
      'skirting',
      'doors',
      'windows',
    ]);
  });

  it('estimate step is an estimate-display with onAdjustGoTo rooms_step', () => {
    const step = paintingWizardConfig.steps[2];
    if (!step || isFieldStep(step) || step.stepKind !== 'estimate-display')
      throw new Error('expected estimate-display');
    expect(step.onAdjustGoTo).toBe('rooms_step');
  });

  it('pricing base uses room_count as quantity field with item unit', () => {
    expect(paintingPricingConfig.base.quantityFieldId).toBe('room_count');
    expect(paintingPricingConfig.base.unit).toBe('item');
  });

  it('pricing has no modifiers', () => {
    expect(paintingPricingConfig.modifiers).toHaveLength(0);
  });

  it('old contact step has been replaced — no step with id "contact" in the config', () => {
    expect(paintingWizardConfig.steps.map((s) => s.id)).not.toContain('contact');
  });

  it('site_photos step is optional photo field with maxCount 5', () => {
    const step = paintingWizardConfig.steps[4];
    if (!step || !isFieldStep(step)) throw new Error('expected field step at index 4');
    expect(step.id).toBe('site_photos');
    const photo = step.fields.find((f) => f.type === 'photo');
    expect(photo?.required).toBe(false);
    expect(photo?.maxCount).toBe(5);
  });

  it('contact-and-address step collects name, phone, email, full_address — all required', () => {
    const step = paintingWizardConfig.steps[5];
    if (!step || !isFieldStep(step)) throw new Error('expected field step at index 5');
    expect(step.id).toBe('contact-and-address');
    const keys = step.fields.map((f) => f.key);
    expect(keys).toEqual(['contact_name', 'contact_phone', 'contact_email', 'full_address']);
    for (const field of step.fields) {
      expect(field.required).toBe(true);
    }
  });
});
