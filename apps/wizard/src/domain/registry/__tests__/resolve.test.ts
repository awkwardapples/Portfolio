import { describe, it, expect } from 'vitest';

import { validateWizardConfig, validatePricingConfig } from '@/domain/validation/validate';
import { fencingWizardConfig, fencingPricingConfig } from '@/domain/fixtures/fencing.config';
import {
  resolveVertical,
  resolveFallbackVertical,
  listVerticalIds,
  FALLBACK_VERTICAL_ID,
  VERTICALS,
} from '@/domain/registry';

describe('resolveVertical', () => {
  it("resolves 'fencing' to a SessionConfig with the fencing wizard and pricing", () => {
    const result = resolveVertical('fencing');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('fencing');
    expect(result?.wizard).toBe(fencingWizardConfig);
    expect(result?.pricing).toBe(fencingPricingConfig);
  });

  it('returns null for an unknown id', () => {
    expect(resolveVertical('unknown')).toBeNull();
  });

  it('returns null for an empty string (not a registry key)', () => {
    expect(resolveVertical('')).toBeNull();
  });

  it("returns null for 'FENCING' (case-sensitive — registry keys are contracts)", () => {
    expect(resolveVertical('FENCING')).toBeNull();
  });
});

describe('resolveFallbackVertical', () => {
  it('returns a non-null SessionConfig with id equal to FALLBACK_VERTICAL_ID', () => {
    const result = resolveFallbackVertical();
    expect(result).not.toBeNull();
    expect(result?.id).toBe(FALLBACK_VERTICAL_ID);
  });
});

describe('listVerticalIds', () => {
  it("returns exactly ['fencing'] — a future addition must update this test", () => {
    expect(listVerticalIds()).toEqual(['fencing']);
  });
});

describe('registry structural validity', () => {
  it('resolved fencing SessionConfig passes validateWizardConfig', () => {
    const result = resolveVertical('fencing');
    expect(result).not.toBeNull();
    expect(validateWizardConfig(result!.wizard).ok).toBe(true);
  });

  it('resolved fencing SessionConfig passes validatePricingConfig against its wizard', () => {
    const result = resolveVertical('fencing');
    expect(result).not.toBeNull();
    expect(validatePricingConfig(result!.pricing, result!.wizard).ok).toBe(true);
  });

  it('VERTICALS object is frozen at runtime', () => {
    expect(Object.isFrozen(VERTICALS)).toBe(true);
  });
});
