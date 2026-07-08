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

  it('contains exactly 5 steps in expected order', () => {
    expect(paintingWizardConfig.steps.map((s) => s.id)).toEqual([
      'rooms_step',
      'what_to_paint_step',
      'estimate',
      'contact',
      'extras',
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
});
