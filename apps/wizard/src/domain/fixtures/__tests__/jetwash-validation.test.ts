import { describe, it, expect } from 'vitest';

import { validateWizardConfig, validatePricingConfig } from '@/domain/validation/validate';
import { jetwashWizardConfig, jetwashPricingConfig } from '@/domain/fixtures/jetwash.config';

describe('jetwash (pressure washing) reference config', () => {
  it('passes wizard validation', () => {
    expect(validateWizardConfig(jetwashWizardConfig).ok).toBe(true);
  });

  it('passes pricing validation against the wizard', () => {
    expect(validatePricingConfig(jetwashPricingConfig, jetwashWizardConfig).ok).toBe(true);
  });

  it('is an instant-quote wizard', () => {
    expect(jetwashWizardConfig.quoteMode).toBe('instant');
  });

  it('contains exactly 4 steps in expected order', () => {
    expect(jetwashWizardConfig.steps.map((s) => s.id)).toEqual([
      'area',
      'site_photos',
      'contact',
      'review',
    ]);
  });

  it('area step has area_m2 number field (required) and surface_type select', () => {
    const step = jetwashWizardConfig.steps.find((s) => s.id === 'area');
    expect(step).toBeDefined();
    const area = step!.fields.find((f) => f.id === 'area_m2');
    expect(area?.type).toBe('number');
    expect(area?.required).toBe(true);
    const surface = step!.fields.find((f) => f.id === 'surface_type');
    expect(surface?.type).toBe('select');
  });

  it('pricing base uses area_m2 as quantity field with square_metre unit', () => {
    expect(jetwashPricingConfig.base.quantityFieldId).toBe('area_m2');
    expect(jetwashPricingConfig.base.unit).toBe('square_metre');
  });
});
