import { describe, it, expect } from 'vitest';

import { validateWizardConfig, validatePricingConfig } from '@/domain/validation/validate';
import { deckingWizardConfig, deckingPricingConfig } from '@/domain/fixtures/decking.config';
import { isFieldStep } from '@/domain/config/wizard-config';

describe('decking reference config', () => {
  it('passes wizard validation', () => {
    const result = validateWizardConfig(deckingWizardConfig);
    expect(result.ok).toBe(true);
  });

  it('passes pricing validation against the wizard', () => {
    const result = validatePricingConfig(deckingPricingConfig, deckingWizardConfig);
    expect(result.ok).toBe(true);
  });

  it('contains exactly 6 steps in expected order', () => {
    expect(deckingWizardConfig.steps.map((s) => s.id)).toEqual([
      'deck_size',
      'material_step',
      'estimate',
      'extras',
      'site_photos',
      'contact-and-address',
    ]);
  });

  it('deck_size step is a size-bracket-selector with area_m2 exact field', () => {
    const step = deckingWizardConfig.steps[0];
    if (!step || isFieldStep(step) || step.stepKind !== 'size-bracket-selector')
      throw new Error('expected size-bracket-selector');
    expect(step.brackets).toHaveLength(3);
    expect(step.exactFields.map((f) => f.id)).toEqual(['area_m2']);
  });

  it('material_step is a visual-card-selector with softwood/hardwood/composite', () => {
    const step = deckingWizardConfig.steps[1];
    if (!step || isFieldStep(step) || step.stepKind !== 'visual-card-selector')
      throw new Error('expected visual-card-selector');
    expect(step.answerKey).toBe('material');
    expect(step.options.map((o) => o.id)).toEqual(['softwood', 'hardwood', 'composite']);
  });

  it('pricing base uses area_m2 with square_metre unit', () => {
    expect(deckingPricingConfig.base.quantityFieldId).toBe('area_m2');
    expect(deckingPricingConfig.base.unit).toBe('square_metre');
  });
});
