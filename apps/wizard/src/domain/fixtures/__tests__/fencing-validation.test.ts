import { describe, it, expect } from 'vitest';

import { validateWizardConfig, validatePricingConfig } from '@/domain/validation/validate';
import { fencingWizardConfig, fencingPricingConfig } from '@/domain/fixtures/fencing.config';
import { asFieldStep } from './_helpers';

describe('fencing reference config', () => {
  it('passes wizard validation', () => {
    const result = validateWizardConfig(fencingWizardConfig);
    expect(result.ok).toBe(true);
  });

  it('passes pricing validation against the wizard', () => {
    const result = validatePricingConfig(fencingPricingConfig, fencingWizardConfig);
    expect(result.ok).toBe(true);
  });

  it('contains exactly 5 steps in expected order', () => {
    expect(fencingWizardConfig.steps.map((s) => s.id)).toEqual([
      'dimensions',
      'extras',
      'site_photos',
      'contact',
      'review',
    ]);
  });

  it('site_photos step has a photo field with maxCount 5 and required false', () => {
    const step = asFieldStep(fencingWizardConfig.steps.find((s) => s.id === 'site_photos'));
    const photoField = step.fields.find((f) => f.id === 'site_photos');
    expect(photoField?.type).toBe('photo');
    expect(photoField?.maxCount).toBe(5);
    expect(photoField?.required).toBe(false);
  });
});
