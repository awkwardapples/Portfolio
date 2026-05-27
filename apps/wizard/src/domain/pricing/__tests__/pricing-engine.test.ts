import { describe, expect, it } from 'vitest';

import type { PricingConfig } from '@/domain/config/pricing';
import type { WizardConfig } from '@/domain/config/wizard-config';
import { fencingPricingConfig, fencingWizardConfig } from '@/domain/fixtures/fencing.config';
import type { AnswerMap } from '@/domain/runtime/answer-types';
import { computePrice } from '@/domain/pricing/pricing-engine';

// ---------------------------------------------------------------------------
// Shared test fixtures
//
//   testWizard   — three fields in one step:
//     fld-qty  (key: qty)   number  — the quantity field for base pricing
//     fld-type (key: type)  text    — for modifier/extra conditions
//     fld-flag (key: flag)  text    — for a secondary condition test
// ---------------------------------------------------------------------------

const testWizard: WizardConfig = {
  schemaVersion: 1,
  id: 'pricing-test',
  title: 'Pricing test',
  steps: [
    {
      id: 'step1',
      title: 'Step 1',
      fields: [
        { id: 'fld-qty', key: 'qty', type: 'number', label: 'Qty', required: true },
        {
          id: 'fld-type',
          key: 'type',
          type: 'select',
          label: 'Type',
          required: false,
          options: [
            { value: 'standard', label: 'Standard' },
            { value: 'premium', label: 'Premium' },
          ],
        },
        { id: 'fld-flag', key: 'flag', type: 'text', label: 'Flag', required: false },
      ],
    },
  ],
};

const testPricing: PricingConfig = {
  schemaVersion: 1,
  currency: 'GBP',
  base: { label: 'Base', perUnitPence: 1000, unit: 'item', quantityFieldId: 'fld-qty' },
  modifiers: [
    {
      id: 'premium',
      label: 'Premium',
      appliesToFieldId: 'fld-type',
      match: { kind: 'equals', value: 'premium' },
      effect: { kind: 'multiply', factor: 1.5 },
    },
  ],
  extras: [
    {
      id: 'flag-extra',
      label: 'Flag extra',
      appliesToFieldId: 'fld-flag',
      match: { kind: 'equals', value: 'yes' },
      amountPence: 2000,
    },
  ],
  bounds: {
    minPence: 500,
    maxPence: 50000,
    rounding: { mode: 'nearest', toPence: 100 },
  },
  rangeSpreadBasisPoints: 0,
};

// ---------------------------------------------------------------------------
// Base price
// ---------------------------------------------------------------------------

describe('computePrice — base price', () => {
  it('returns valid result for qty * perUnitPence with no modifiers or extras applied', () => {
    const result = computePrice({ qty: 5 }, testWizard, testPricing);
    expect(result.valid).toBe(true);
    expect(result.totalPence).toBe(5000);
    expect(result.breakdown?.basePence).toBe(5000);
  });

  it('uses Math.round to avoid float drift in base calculation', () => {
    // 1000 * 3.7 in IEEE 754 may not be exact; Math.round guards against drift
    const result = computePrice({ qty: 3.7 }, testWizard, testPricing);
    expect(result.valid).toBe(true);
    expect(Number.isInteger(result.totalPence)).toBe(true);
  });

  it('zero quantity clamps to minPence when minPence > 0', () => {
    // base = 0, clamp(500, 50000, 0) = 500
    const result = computePrice({ qty: 0 }, testWizard, testPricing);
    expect(result.valid).toBe(true);
    expect(result.totalPence).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// Conditional modifiers
// ---------------------------------------------------------------------------

describe('computePrice — conditional modifiers', () => {
  it('applies multiply modifier when equals condition matches', () => {
    // base=5000, *1.5=7500; round to 100: 7500; clamp(500..50000): 7500
    const result = computePrice({ qty: 5, type: 'premium' }, testWizard, testPricing);
    expect(result.valid).toBe(true);
    expect(result.totalPence).toBe(7500);
    expect(result.breakdown?.modifierLines[0]?.applied).toBe(true);
    expect(result.breakdown?.modifierLines[0]?.deltaAmountPence).toBe(2500);
  });

  it('skips modifier when condition does not match', () => {
    const result = computePrice({ qty: 5, type: 'standard' }, testWizard, testPricing);
    expect(result.totalPence).toBe(5000);
    expect(result.breakdown?.modifierLines[0]?.applied).toBe(false);
    expect(result.breakdown?.modifierLines[0]?.deltaAmountPence).toBe(0);
  });

  it('skips modifier when the referenced field has no answer', () => {
    const result = computePrice({ qty: 5 }, testWizard, testPricing);
    expect(result.breakdown?.modifierLines[0]?.applied).toBe(false);
  });

  it('applies add-effect modifier when condition matches', () => {
    const addPricing: PricingConfig = {
      ...testPricing,
      modifiers: [
        {
          id: 'flat-add',
          label: 'Flat add',
          appliesToFieldId: 'fld-type',
          match: { kind: 'equals', value: 'premium' },
          effect: { kind: 'add', amountPence: 1000 },
        },
      ],
      extras: [],
      bounds: { minPence: 0, maxPence: 1000000, rounding: { mode: 'nearest', toPence: 1 } },
    };
    // base = 3000, add = +1000 = 4000
    const result = computePrice({ qty: 3, type: 'premium' }, testWizard, addPricing);
    expect(result.valid).toBe(true);
    expect(result.totalPence).toBe(4000);
  });

  it('applies always-match modifier regardless of answers', () => {
    const alwaysPricing: PricingConfig = {
      ...testPricing,
      modifiers: [
        {
          id: 'always-mod',
          label: 'Always',
          appliesToFieldId: 'fld-type',
          match: { kind: 'always' },
          effect: { kind: 'multiply', factor: 2 },
        },
      ],
      extras: [],
      bounds: { minPence: 0, maxPence: 1000000, rounding: { mode: 'nearest', toPence: 1 } },
    };
    const result = computePrice({ qty: 4 }, testWizard, alwaysPricing);
    expect(result.totalPence).toBe(8000); // 4000 * 2
  });

  it('applies modifier with in-list match when answer is in values', () => {
    const inPricing: PricingConfig = {
      ...testPricing,
      modifiers: [
        {
          id: 'in-mod',
          label: 'In mod',
          appliesToFieldId: 'fld-type',
          match: { kind: 'in', values: ['premium', 'special'] },
          effect: { kind: 'multiply', factor: 1.5 },
        },
      ],
      extras: [],
      bounds: { minPence: 0, maxPence: 1000000, rounding: { mode: 'nearest', toPence: 1 } },
    };
    // type='special' is in the list → applies
    const result = computePrice({ qty: 4, type: 'special' }, testWizard, inPricing);
    expect(result.valid).toBe(true);
    expect(result.totalPence).toBe(6000); // 4000 * 1.5
  });
});

// ---------------------------------------------------------------------------
// Stacking modifiers
// ---------------------------------------------------------------------------

describe('computePrice — stacking modifiers', () => {
  it('applies multiple modifiers in declaration order, each seeing the running total', () => {
    const stackPricing: PricingConfig = {
      ...testPricing,
      modifiers: [
        {
          id: 'm1',
          label: 'M1',
          appliesToFieldId: 'fld-type',
          match: { kind: 'equals', value: 'premium' },
          effect: { kind: 'multiply', factor: 1.1 },
        },
        {
          id: 'm2',
          label: 'M2',
          appliesToFieldId: 'fld-type',
          match: { kind: 'equals', value: 'premium' },
          effect: { kind: 'multiply', factor: 1.2 },
        },
      ],
      extras: [],
      bounds: { minPence: 0, maxPence: 1000000, rounding: { mode: 'nearest', toPence: 1 } },
    };
    // base=10000, m1: 10000*1.1=11000, m2: 11000*1.2=13200
    const result = computePrice({ qty: 10, type: 'premium' }, testWizard, stackPricing);
    expect(result.valid).toBe(true);
    expect(result.totalPence).toBe(13200);
    expect(result.breakdown?.modifierLines[0]?.deltaAmountPence).toBe(1000); // 11000-10000
    expect(result.breakdown?.modifierLines[1]?.deltaAmountPence).toBe(2200); // 13200-11000
  });

  it('second modifier is skipped when its condition is not met', () => {
    const stackPricing: PricingConfig = {
      ...testPricing,
      modifiers: [
        {
          id: 'm1',
          label: 'M1',
          appliesToFieldId: 'fld-type',
          match: { kind: 'equals', value: 'premium' },
          effect: { kind: 'multiply', factor: 1.1 },
        },
        {
          id: 'm2',
          label: 'M2',
          appliesToFieldId: 'fld-flag',
          match: { kind: 'equals', value: 'boost' },
          effect: { kind: 'multiply', factor: 1.2 },
        },
      ],
      extras: [],
      bounds: { minPence: 0, maxPence: 1000000, rounding: { mode: 'nearest', toPence: 1 } },
    };
    // flag not set → m2 skipped
    const result = computePrice({ qty: 10, type: 'premium' }, testWizard, stackPricing);
    expect(result.totalPence).toBe(11000); // only m1 applies
  });
});

// ---------------------------------------------------------------------------
// Extras
// ---------------------------------------------------------------------------

describe('computePrice — extras', () => {
  it('adds extra amountPence when condition matches', () => {
    // base=5000, no modifier (type not set), extra: +2000
    const result = computePrice({ qty: 5, flag: 'yes' }, testWizard, testPricing);
    expect(result.valid).toBe(true);
    expect(result.totalPence).toBe(7000); // 5000+2000, round to 100: 7000
    expect(result.breakdown?.extraLines[0]?.applied).toBe(true);
    expect(result.breakdown?.extraLines[0]?.deltaAmountPence).toBe(2000);
  });

  it('skips extra when condition does not match', () => {
    const result = computePrice({ qty: 5, flag: 'no' }, testWizard, testPricing);
    expect(result.totalPence).toBe(5000);
    expect(result.breakdown?.extraLines[0]?.applied).toBe(false);
    expect(result.breakdown?.extraLines[0]?.deltaAmountPence).toBe(0);
  });

  it('multiple extras accumulate independently', () => {
    const twoExtraPricing: PricingConfig = {
      ...testPricing,
      modifiers: [],
      extras: [
        {
          id: 'e1',
          label: 'E1',
          appliesToFieldId: 'fld-type',
          match: { kind: 'equals', value: 'premium' },
          amountPence: 1000,
        },
        {
          id: 'e2',
          label: 'E2',
          appliesToFieldId: 'fld-flag',
          match: { kind: 'equals', value: 'yes' },
          amountPence: 500,
        },
      ],
      bounds: { minPence: 0, maxPence: 1000000, rounding: { mode: 'nearest', toPence: 1 } },
    };
    // base=2000, e1: +1000=3000, e2: +500=3500
    const result = computePrice(
      { qty: 2, type: 'premium', flag: 'yes' },
      testWizard,
      twoExtraPricing,
    );
    expect(result.totalPence).toBe(3500);
  });
});

// ---------------------------------------------------------------------------
// Bounds: min/max clamp
// ---------------------------------------------------------------------------

describe('computePrice — min/max clamp', () => {
  it('clamps to minPence when subtotal is below minimum', () => {
    // base=100 (qty=0.1?), but let's use qty=0 directly: base=0, clamp to 500
    const result = computePrice({ qty: 0 }, testWizard, testPricing);
    expect(result.totalPence).toBe(500); // minPence=500
    expect(result.breakdown?.clampedPence).toBe(500);
  });

  it('clamps to maxPence when subtotal exceeds maximum', () => {
    // base = 1000 * 100 = 100000 > maxPence 50000
    const result = computePrice({ qty: 100 }, testWizard, testPricing);
    expect(result.totalPence).toBe(50000); // maxPence=50000
    expect(result.breakdown?.clampedPence).toBe(50000);
  });

  it('does not clamp when subtotal is within bounds', () => {
    const result = computePrice({ qty: 5 }, testWizard, testPricing);
    expect(result.breakdown?.clampedPence).toBe(5000);
    expect(result.totalPence).toBe(5000);
  });
});

// ---------------------------------------------------------------------------
// Rounding
// ---------------------------------------------------------------------------

describe('computePrice — rounding', () => {
  it('rounds to nearest toPence multiple', () => {
    const roundPricing: PricingConfig = {
      ...testPricing,
      modifiers: [],
      extras: [],
      bounds: { minPence: 0, maxPence: 1000000, rounding: { mode: 'nearest', toPence: 1000 } },
    };
    // base = 1000 * 7 = 7000 — already a multiple of 1000
    expect(computePrice({ qty: 7 }, testWizard, roundPricing).totalPence).toBe(7000);
    // base = 1000 * 7.3 = 7300 → nearest 1000 = 7000
    expect(computePrice({ qty: 7.3 }, testWizard, roundPricing).totalPence).toBe(7000);
    // base = 1000 * 7.6 = 7600 → nearest 1000 = 8000
    expect(computePrice({ qty: 7.6 }, testWizard, roundPricing).totalPence).toBe(8000);
  });

  it('breakdown.roundedPence equals totalPence', () => {
    const result = computePrice({ qty: 5 }, testWizard, testPricing);
    expect(result.breakdown?.roundedPence).toBe(result.totalPence);
  });
});

// ---------------------------------------------------------------------------
// Range spread
// ---------------------------------------------------------------------------

describe('computePrice — range spread', () => {
  it('rangeMinPence and rangeMaxPence equal totalPence when bps is 0', () => {
    const result = computePrice({ qty: 5 }, testWizard, testPricing); // bps=0
    expect(result.rangeMinPence).toBe(result.totalPence);
    expect(result.rangeMaxPence).toBe(result.totalPence);
  });

  it('computes range spread correctly for non-zero bps', () => {
    const spreadPricing: PricingConfig = {
      ...testPricing,
      modifiers: [],
      extras: [],
      bounds: { minPence: 0, maxPence: 1000000, rounding: { mode: 'nearest', toPence: 100 } },
      rangeSpreadBasisPoints: 1000, // +/-10%
    };
    // base = 1000*10 = 10000, round to 100 = 10000
    // rangeMin = Math.round(10000 * 9000 / 10000) = 9000
    // rangeMax = Math.round(10000 * 11000 / 10000) = 11000
    const result = computePrice({ qty: 10 }, testWizard, spreadPricing);
    expect(result.totalPence).toBe(10000);
    expect(result.rangeMinPence).toBe(9000);
    expect(result.rangeMaxPence).toBe(11000);
  });
});

// ---------------------------------------------------------------------------
// Invalid inputs → valid: false
// ---------------------------------------------------------------------------

describe('computePrice — invalid inputs', () => {
  it('returns valid: false when quantityFieldId is not found in wizard config', () => {
    const badPricing: PricingConfig = {
      ...testPricing,
      base: { ...testPricing.base, quantityFieldId: 'does-not-exist' },
    };
    const result = computePrice({ qty: 5 }, testWizard, badPricing);
    expect(result.valid).toBe(false);
    expect(result.totalPence).toBeNull();
    expect(result.rangeMinPence).toBeNull();
    expect(result.rangeMaxPence).toBeNull();
    expect(result.breakdown).toBeNull();
  });

  it('returns valid: false when quantity field is not answered (undefined)', () => {
    const result = computePrice({} as AnswerMap, testWizard, testPricing);
    expect(result.valid).toBe(false);
  });

  it('returns valid: false when quantity is a string', () => {
    const result = computePrice({ qty: 'five' }, testWizard, testPricing);
    expect(result.valid).toBe(false);
  });

  it('returns valid: false when quantity is null', () => {
    const result = computePrice({ qty: null }, testWizard, testPricing);
    expect(result.valid).toBe(false);
  });

  it('returns valid: false when quantity is negative', () => {
    const result = computePrice({ qty: -1 }, testWizard, testPricing);
    expect(result.valid).toBe(false);
  });

  it('returns valid: true when quantity is zero (non-negative)', () => {
    const result = computePrice({ qty: 0 }, testWizard, testPricing);
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Breakdown shape
// ---------------------------------------------------------------------------

describe('computePrice — breakdown', () => {
  it('breakdown contains a line for every modifier, applied or not', () => {
    const result = computePrice({ qty: 5 }, testWizard, testPricing);
    // testPricing has 1 modifier (not applied since type not set)
    expect(result.breakdown?.modifierLines).toHaveLength(1);
    expect(result.breakdown?.modifierLines[0]?.id).toBe('premium');
  });

  it('breakdown contains a line for every extra, applied or not', () => {
    const result = computePrice({ qty: 5 }, testWizard, testPricing);
    // testPricing has 1 extra (not applied since flag not set)
    expect(result.breakdown?.extraLines).toHaveLength(1);
    expect(result.breakdown?.extraLines[0]?.id).toBe('flag-extra');
  });

  it('subtotalAfterModifiersPence reflects only modifier contributions', () => {
    // base=5000, modifier applies: 5000*1.5=7500
    const result = computePrice({ qty: 5, type: 'premium' }, testWizard, testPricing);
    expect(result.breakdown?.basePence).toBe(5000);
    expect(result.breakdown?.subtotalAfterModifiersPence).toBe(7500);
  });

  it('subtotalAfterExtrasPence reflects modifiers + extras', () => {
    // base=5000, modifier: 7500, extra: +2000=9500
    const result = computePrice({ qty: 5, type: 'premium', flag: 'yes' }, testWizard, testPricing);
    expect(result.breakdown?.subtotalAfterExtrasPence).toBe(9500);
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('computePrice — determinism', () => {
  it('same inputs always produce identical output', () => {
    const answers: AnswerMap = { qty: 7, type: 'premium', flag: 'yes' };
    const r1 = computePrice(answers, testWizard, testPricing);
    const r2 = computePrice(answers, testWizard, testPricing);
    const r3 = computePrice(answers, testWizard, testPricing);
    expect(r1.totalPence).toBe(r2.totalPence);
    expect(r2.totalPence).toBe(r3.totalPence);
    expect(r1.rangeMinPence).toBe(r2.rangeMinPence);
    expect(r1.breakdown?.basePence).toBe(r2.breakdown?.basePence);
  });

  it('does not mutate the answers object', () => {
    const answers: AnswerMap = { qty: 5 };
    const before = { ...answers };
    computePrice(answers, testWizard, testPricing);
    expect(answers).toEqual(before);
  });
});

// ---------------------------------------------------------------------------
// Integration: fencing fixture
//
// Worked example: length_m=20, fence_type=closeboard, height=standard, no extras
//   base:        32500 * 20 = 650000
//   closeboard:  650000 * 1.1 = 715000   (other modifiers not matched)
//   no extras
//   clamp:       715000 (within 25000..5000000)
//   round 5000:  715000 (already a multiple)
//   spread 1500: rangeMin = round(715000*8500/10000) = 607750
//                rangeMax = round(715000*11500/10000) = 822250
// ---------------------------------------------------------------------------

describe('computePrice — fencing fixture integration', () => {
  it('closeboard standard fence, 20m, no extras produces correct price and range', () => {
    const answers: AnswerMap = { length_m: 20, fence_type: 'closeboard', height: 'standard' };
    const result = computePrice(answers, fencingWizardConfig, fencingPricingConfig);

    expect(result.valid).toBe(true);
    expect(result.totalPence).toBe(715000);
    expect(result.rangeMinPence).toBe(607750);
    expect(result.rangeMaxPence).toBe(822250);
    expect(result.breakdown?.basePence).toBe(650000);
    expect(result.breakdown?.subtotalAfterModifiersPence).toBe(715000);
  });

  it('panel fence, 20m applies discount modifier', () => {
    //   base:   32500 * 20 = 650000
    //   panel:  650000 * 0.9 = 585000
    //   round 5000: 585000
    const answers: AnswerMap = { length_m: 20, fence_type: 'panel', height: 'standard' };
    const result = computePrice(answers, fencingWizardConfig, fencingPricingConfig);
    expect(result.totalPence).toBe(585000);
  });

  it('closeboard tall fence stacks two modifiers', () => {
    //   base:        32500 * 20 = 650000
    //   closeboard:  650000 * 1.1 = 715000
    //   tall:        715000 * 1.2 = 858000
    //   round 5000:  Math.round(858000/5000)*5000 = 172*5000 = 860000
    const answers: AnswerMap = { length_m: 20, fence_type: 'closeboard', height: 'tall' };
    const result = computePrice(answers, fencingWizardConfig, fencingPricingConfig);
    expect(result.totalPence).toBe(860000);
    expect(result.breakdown?.subtotalAfterModifiersPence).toBe(858000);
  });

  it('adds gate and removal extras', () => {
    //   base:        32500 * 20 = 650000
    //   closeboard:  715000
    //   gate:        +35000 = 750000
    //   removal:     +45000 = 795000
    //   round 5000:  795000
    const answers: AnswerMap = {
      length_m: 20,
      fence_type: 'closeboard',
      height: 'standard',
      include_gate: 'yes',
      remove_old: 'yes',
    };
    const result = computePrice(answers, fencingWizardConfig, fencingPricingConfig);
    expect(result.breakdown?.subtotalAfterExtrasPence).toBe(795000);
    expect(result.totalPence).toBe(795000);
  });

  it('returns valid: false when length_m is not set', () => {
    const result = computePrice(
      { fence_type: 'closeboard' },
      fencingWizardConfig,
      fencingPricingConfig,
    );
    expect(result.valid).toBe(false);
  });
});
