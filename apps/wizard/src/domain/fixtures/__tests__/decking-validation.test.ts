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

  it('contains exactly 7 steps in expected order', () => {
    expect(deckingWizardConfig.steps.map((s) => s.id)).toEqual([
      'deck_size',
      'material_step',
      'estimate',
      'extras',
      'site_photos',
      'contact-and-address',
      'optional-details',
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

  it('old contact step has been replaced — no step with id "contact" in the config', () => {
    expect(deckingWizardConfig.steps.map((s) => s.id)).not.toContain('contact');
  });

  it('site_photos step is optional photo field with maxCount 5', () => {
    const step = deckingWizardConfig.steps[4];
    if (!step || !isFieldStep(step)) throw new Error('expected field step at index 4');
    expect(step.id).toBe('site_photos');
    const photo = step.fields.find((f) => f.type === 'photo');
    expect(photo?.required).toBe(false);
    expect(photo?.maxCount).toBe(5);
  });

  it('site_photos help text gives photo-guidance instructions (6.1)', () => {
    const step = deckingWizardConfig.steps[4];
    if (!step || !isFieldStep(step)) throw new Error('expected field step at index 4');
    const photo = step.fields.find((f) => f.type === 'photo');
    expect(photo?.help).toContain('full length of the area');
    expect(photo?.help).toContain('obstacles');
  });

  it('contact-and-address step collects name, phone, email, full_address — all required', () => {
    const step = deckingWizardConfig.steps[5];
    if (!step || !isFieldStep(step)) throw new Error('expected field step at index 5');
    expect(step.id).toBe('contact-and-address');
    const keys = step.fields.map((f) => f.key);
    expect(keys).toEqual([
      'contact_name',
      'contact_phone',
      'contact_email',
      'full_address',
      'data_processing_consent',
    ]);
    for (const field of step.fields) {
      expect(field.required).toBe(true);
    }
  });

  it('optional-details step is last and has allowSkip: true', () => {
    const step = deckingWizardConfig.steps[6];
    if (!step || !isFieldStep(step)) throw new Error('expected field step at index 6');
    expect(step.id).toBe('optional-details');
    expect(step.allowSkip).toBe(true);
  });

  it('optional-details universal fields are present and required: false', () => {
    const step = deckingWizardConfig.steps[6];
    if (!step || !isFieldStep(step)) throw new Error('expected field step at index 6');
    const keys = step.fields.map((f) => f.key);
    expect(keys).toContain('preferred_timeframe');
    expect(keys).toContain('additional_notes');
    for (const field of step.fields) {
      expect(field.required).toBe(false);
    }
  });

  it('decking optional-details has existing_deck_removal field', () => {
    const step = deckingWizardConfig.steps[6];
    if (!step || !isFieldStep(step)) throw new Error('expected field step at index 6');
    const keys = step.fields.map((f) => f.key);
    expect(keys).toContain('existing_deck_removal');
  });
});
