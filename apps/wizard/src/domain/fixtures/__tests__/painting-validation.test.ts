import { describe, it, expect } from 'vitest';

import { validateWizardConfig, validatePricingConfig } from '@/domain/validation/validate';
import { paintingWizardConfig, paintingPricingConfig } from '@/domain/fixtures/painting.config';
import { asFieldStep } from './_helpers';

describe('painting reference config', () => {
  it('passes wizard validation', () => {
    const result = validateWizardConfig(paintingWizardConfig);
    expect(result.ok).toBe(true);
  });

  it('passes pricing validation against the wizard', () => {
    const result = validatePricingConfig(paintingPricingConfig, paintingWizardConfig);
    expect(result.ok).toBe(true);
  });

  it('is an instant-quote wizard', () => {
    expect(paintingWizardConfig.quoteMode).toBe('instant');
  });

  it('contains exactly 5 steps in expected order', () => {
    expect(paintingWizardConfig.steps.map((s) => s.id)).toEqual([
      'rooms',
      'details',
      'site_photos',
      'contact',
      'review',
    ]);
  });

  it('rooms step has room_count number field (required) and what_to_paint checkbox', () => {
    const step = asFieldStep(paintingWizardConfig.steps.find((s) => s.id === 'rooms'));
    const roomCount = step.fields.find((f) => f.id === 'room_count');
    expect(roomCount?.type).toBe('number');
    expect(roomCount?.required).toBe(true);
    const whatToPaint = step.fields.find((f) => f.id === 'what_to_paint');
    expect(whatToPaint?.type).toBe('checkbox');
  });

  it('site_photos step has photo field with maxCount 5 and required false', () => {
    const step = asFieldStep(paintingWizardConfig.steps.find((s) => s.id === 'site_photos'));
    const photo = step.fields.find((f) => f.type === 'photo');
    expect(photo?.maxCount).toBe(5);
    expect(photo?.required).toBe(false);
  });

  it('pricing base uses room_count as quantity field', () => {
    expect(paintingPricingConfig.base.quantityFieldId).toBe('room_count');
  });
});
