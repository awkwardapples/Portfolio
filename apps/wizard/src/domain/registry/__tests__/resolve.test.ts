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

const ALL_VERTICAL_IDS = [
  'fencing',
  'decking',
  'painting',
  'patio',
  'driveway',
  'steps',
  'jetwash',
  'general-repairs',
  'plumbing',
  'electrical',
  'carpentry',
  'other',
];

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
  it('returns all 12 services in registry insertion order', () => {
    expect(listVerticalIds()).toEqual(ALL_VERTICAL_IDS);
  });
});

describe('Vertical.categoryId', () => {
  it('fencing vertical has categoryId: landscaping (Step 5.9)', () => {
    expect(VERTICALS['fencing']?.categoryId).toBe('landscaping');
  });

  it('decking vertical has categoryId: landscaping', () => {
    expect(VERTICALS['decking']?.categoryId).toBe('landscaping');
  });

  it('painting vertical has categoryId: decorating', () => {
    expect(VERTICALS['painting']?.categoryId).toBe('decorating');
  });

  it('jetwash vertical has categoryId: exterior-cleaning', () => {
    expect(VERTICALS['jetwash']?.categoryId).toBe('exterior-cleaning');
  });

  it('general-repairs vertical has categoryId: handyman', () => {
    expect(VERTICALS['general-repairs']?.categoryId).toBe('handyman');
  });

  it.each(['patio', 'driveway', 'steps'])('%s vertical has categoryId: landscaping', (id) => {
    expect(VERTICALS[id]?.categoryId).toBe('landscaping');
  });

  it.each(['plumbing', 'electrical', 'carpentry'])('%s vertical has categoryId: handyman', (id) => {
    expect(VERTICALS[id]?.categoryId).toBe('handyman');
  });

  it('other vertical has no categoryId — deliberately uncategorized (6.3)', () => {
    expect(VERTICALS['other']?.categoryId).toBeUndefined();
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

  it('all 12 verticals resolve to non-null', () => {
    for (const id of ALL_VERTICAL_IDS) {
      expect(resolveVertical(id)).not.toBeNull();
    }
  });
});
