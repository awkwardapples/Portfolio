import { describe, it, expect } from 'vitest';

import { validateWizardConfig, validatePricingConfig } from '@/domain/validation/validate';
import { patioWizardConfig, patioPricingConfig } from '@/domain/fixtures/patio.config';
import { drivewayWizardConfig, drivewayPricingConfig } from '@/domain/fixtures/driveway.config';
import { stepsWizardConfig, stepsPricingConfig } from '@/domain/fixtures/steps.config';

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

  it('is an instant-quote wizard', () => {
    expect(patioWizardConfig.quoteMode).toBe('instant');
  });

  it('contains exactly 5 steps in expected order', () => {
    expect(patioWizardConfig.steps.map((s) => s.id)).toEqual([
      'area_and_material',
      'extras',
      'site_photos',
      'contact',
      'review',
    ]);
  });

  it('area_and_material step has area_m2 number field (required) and material select', () => {
    const step = patioWizardConfig.steps.find((s) => s.id === 'area_and_material');
    expect(step).toBeDefined();
    const area = step!.fields.find((f) => f.id === 'area_m2');
    expect(area?.type).toBe('number');
    expect(area?.required).toBe(true);
    const material = step!.fields.find((f) => f.id === 'material');
    expect(material?.type).toBe('select');
  });

  it('pricing base uses area_m2 as quantity field', () => {
    expect(patioPricingConfig.base.quantityFieldId).toBe('area_m2');
    expect(patioPricingConfig.base.unit).toBe('square_metre');
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

  it('is an instant-quote wizard', () => {
    expect(drivewayWizardConfig.quoteMode).toBe('instant');
  });

  it('contains exactly 5 steps in expected order', () => {
    expect(drivewayWizardConfig.steps.map((s) => s.id)).toEqual([
      'area_and_material',
      'extras',
      'site_photos',
      'contact',
      'review',
    ]);
  });

  it('material select has 3 driveway-specific options', () => {
    const step = drivewayWizardConfig.steps.find((s) => s.id === 'area_and_material');
    const material = step!.fields.find((f) => f.id === 'material');
    const values = material!.options!.map((o) => o.value);
    expect(values).toEqual(['driveline_50', 'tegula', 'drivesys']);
  });

  it('pricing base uses area_m2 and square_metre unit', () => {
    expect(drivewayPricingConfig.base.quantityFieldId).toBe('area_m2');
    expect(drivewayPricingConfig.base.unit).toBe('square_metre');
  });
});

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

describe('steps (garden steps) reference config', () => {
  it('passes wizard validation', () => {
    expect(validateWizardConfig(stepsWizardConfig).ok).toBe(true);
  });

  it('passes pricing validation against the wizard', () => {
    expect(validatePricingConfig(stepsPricingConfig, stepsWizardConfig).ok).toBe(true);
  });

  it('is an instant-quote wizard', () => {
    expect(stepsWizardConfig.quoteMode).toBe('instant');
  });

  it('contains exactly 5 steps in expected order', () => {
    expect(stepsWizardConfig.steps.map((s) => s.id)).toEqual([
      'design',
      'dimensions_and_extras',
      'site_photos',
      'contact',
      'review',
    ]);
  });

  it('design step has shape, material, and step_count fields', () => {
    const step = stepsWizardConfig.steps.find((s) => s.id === 'design');
    expect(step).toBeDefined();
    const ids = step!.fields.map((f) => f.id);
    expect(ids).toContain('shape');
    expect(ids).toContain('material');
    expect(ids).toContain('step_count');
  });

  it('pricing base uses step_count as quantity field', () => {
    expect(stepsPricingConfig.base.quantityFieldId).toBe('step_count');
    expect(stepsPricingConfig.base.unit).toBe('item');
  });
});
