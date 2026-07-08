import { describe, it, expect } from 'vitest';

import { validateWizardConfig, validatePricingConfig } from '@/domain/validation/validate';
import { fencingWizardConfig, fencingPricingConfig } from '@/domain/fixtures/fencing.config';
import { asStep } from './_helpers';

/** Deep clone helper so each test mutates an isolated copy. */
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe('structural rejection (Zod phase)', () => {
  it('rejects a wizard with the wrong schemaVersion', () => {
    const bad = clone(fencingWizardConfig) as Record<string, unknown>;
    bad.schemaVersion = 2;
    const result = validateWizardConfig(bad);
    expect(result.ok).toBe(false);
  });

  it('rejects an unknown top-level key (strict objects)', () => {
    const bad = clone(fencingWizardConfig) as Record<string, unknown>;
    bad.unexpectedKey = 'nope';
    const result = validateWizardConfig(bad);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    // The issue should reference the unrecognised key.
    expect(
      result.issues.some((i) => /unexpectedKey|Unrecognized|unrecognized/.test(i.message + i.path)),
    ).toBe(true);
  });

  it('rejects a misspelled field key (strict objects catch typos)', () => {
    const bad = clone(fencingWizardConfig);
    // Introduce a typo'd property on the first field.
    (asStep(bad.steps[0]).fields[0] as unknown as Record<string, unknown>).requried = true;
    const result = validateWizardConfig(bad);
    expect(result.ok).toBe(false);
  });

  it('rejects a step with no fields', () => {
    const bad = clone(fencingWizardConfig);
    asStep(bad.steps[0]).fields = [];
    const result = validateWizardConfig(bad);
    expect(result.ok).toBe(false);
  });

  it('rejects a field with an empty label', () => {
    const bad = clone(fencingWizardConfig);
    asStep(bad.steps[0]).fields[0].label = '';
    const result = validateWizardConfig(bad);
    expect(result.ok).toBe(false);
  });

  it('rejects an invalid id format', () => {
    const bad = clone(fencingWizardConfig);
    bad.steps[0].id = 'Has Spaces';
    const result = validateWizardConfig(bad);
    expect(result.ok).toBe(false);
  });
});

describe('semantic rejection (cross-reference phase)', () => {
  it('rejects a dangling condition fieldId reference', () => {
    const bad = clone(fencingWizardConfig);
    asStep(bad.steps[1]).fields[0].condition = {
      operator: 'equals',
      fieldId: 'does_not_exist',
      value: 'yes',
    };
    const result = validateWizardConfig(bad);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((i) => i.message.includes('does_not_exist'))).toBe(true);
  });

  it('rejects duplicate field ids', () => {
    const bad = clone(fencingWizardConfig);
    asStep(bad.steps[0]).fields[1].id = asStep(bad.steps[0]).fields[0].id;
    const result = validateWizardConfig(bad);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((i) => i.message.toLowerCase().includes('duplicate'))).toBe(true);
  });

  it('rejects a choice field with no options', () => {
    const bad = clone(fencingWizardConfig);
    delete (asStep(bad.steps[0]).fields[1] as { options?: unknown }).options;
    const result = validateWizardConfig(bad);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((i) => i.message.includes('at least one option'))).toBe(true);
  });

  it('rejects a non-choice field that defines options', () => {
    const bad = clone(fencingWizardConfig);
    // length_m is a number field; give it options.
    (asStep(bad.steps[0]).fields[0] as { options?: unknown }).options = [
      { value: 'x', label: 'X' },
    ];
    const result = validateWizardConfig(bad);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((i) => i.message.includes('must not define options'))).toBe(true);
  });
});

describe('pricing semantic rejection', () => {
  it('rejects a dangling base.quantityFieldId', () => {
    const wizard = validateWizardConfig(fencingWizardConfig);
    expect(wizard.ok).toBe(true);
    if (!wizard.ok) return;

    const bad = clone(fencingPricingConfig);
    bad.base.quantityFieldId = 'nonexistent_field';
    const result = validatePricingConfig(bad, wizard.value);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((i) => i.message.includes('nonexistent_field'))).toBe(true);
  });

  it('rejects a dangling modifier appliesToFieldId', () => {
    const wizard = validateWizardConfig(fencingWizardConfig);
    if (!wizard.ok) return;

    const bad = clone(fencingPricingConfig);
    bad.modifiers[0].appliesToFieldId = 'ghost_field';
    const result = validatePricingConfig(bad, wizard.value);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((i) => i.message.includes('ghost_field'))).toBe(true);
  });

  it('rejects non-integer (float) pence amounts', () => {
    const wizard = validateWizardConfig(fencingWizardConfig);
    if (!wizard.ok) return;

    const bad = clone(fencingPricingConfig);
    bad.base.perUnitPence = 4500.5;
    const result = validatePricingConfig(bad, wizard.value);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((i) => i.message.toLowerCase().includes('integer pence'))).toBe(true);
  });

  it('rejects min greater than max', () => {
    const wizard = validateWizardConfig(fencingWizardConfig);
    if (!wizard.ok) return;

    const bad = clone(fencingPricingConfig);
    bad.bounds.minPence = 9_000_000;
    const result = validatePricingConfig(bad, wizard.value);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((i) => i.message.includes('must not exceed maximum'))).toBe(true);
  });
});

describe('deterministic error ordering', () => {
  it('produces byte-stable issue output across repeated runs', () => {
    const bad = clone(fencingWizardConfig);
    // Introduce multiple problems at once.
    asStep(bad.steps[0]).fields[0].label = '';
    bad.steps[0].id = 'Bad Id';
    asStep(bad.steps[1]).fields[0].condition = {
      operator: 'equals',
      fieldId: 'missing_a',
      value: 'x',
    };

    const run1 = validateWizardConfig(clone(bad));
    const run2 = validateWizardConfig(clone(bad));
    expect(run1.ok).toBe(false);
    expect(run2.ok).toBe(false);
    if (run1.ok || run2.ok) return;

    const s1 = run1.issues.map((i) => `${i.path}: ${i.message}`).join('\n');
    const s2 = run2.issues.map((i) => `${i.path}: ${i.message}`).join('\n');
    expect(s1).toEqual(s2);

    // And the ordering is sorted by path (stable).
    const paths = run1.issues.map((i) => i.path);
    const sorted = [...paths].sort();
    expect(paths).toEqual(sorted);
  });
});
