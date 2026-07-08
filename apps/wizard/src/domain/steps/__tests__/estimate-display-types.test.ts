import { describe, it, expect } from 'vitest';

import {
  EstimateDisplayStepSchema,
  AnyStepSchema,
  isFieldStep,
  type AnyStep,
} from '@/domain/config/wizard-config';

const validEstimateStep = {
  stepKind: 'estimate-display' as const,
  id: 'estimate',
  title: 'Your Estimate',
  disclaimer: 'Prices are indicative and subject to site survey.',
  showRangeAsRange: true,
  onAdjustGoTo: 'size',
};

describe('EstimateDisplayStepSchema', () => {
  it('accepts a fully populated estimate-display step', () => {
    const result = EstimateDisplayStepSchema.safeParse(validEstimateStep);
    expect(result.success).toBe(true);
  });

  it('defaults showRangeAsRange to true when omitted', () => {
    const result = EstimateDisplayStepSchema.safeParse({
      stepKind: 'estimate-display',
      id: 'estimate',
      title: 'Your Estimate',
      disclaimer: 'Prices are indicative and subject to site survey.',
      onAdjustGoTo: 'size',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.showRangeAsRange).toBe(true);
    }
  });

  it('accepts an optional description', () => {
    const result = EstimateDisplayStepSchema.safeParse({
      ...validEstimateStep,
      description: 'Based on the information you provided.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when disclaimer is missing', () => {
    const result = EstimateDisplayStepSchema.safeParse({
      stepKind: 'estimate-display',
      id: 'estimate',
      title: 'Your Estimate',
      showRangeAsRange: true,
      onAdjustGoTo: 'size',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when onAdjustGoTo is missing', () => {
    const result = EstimateDisplayStepSchema.safeParse({
      stepKind: 'estimate-display',
      id: 'estimate',
      title: 'Your Estimate',
      disclaimer: 'Prices are indicative and subject to site survey.',
      showRangeAsRange: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a field step (no stepKind) as an estimate-display step', () => {
    const fieldStep = {
      id: 's1',
      title: 'Step',
      fields: [{ id: 'f1', key: 'k', type: 'text', label: 'L', required: false }],
    };
    const result = EstimateDisplayStepSchema.safeParse(fieldStep);
    expect(result.success).toBe(false);
  });
});

describe('isFieldStep type guard', () => {
  it('returns false for an estimate-display step', () => {
    const step = EstimateDisplayStepSchema.parse(validEstimateStep);
    expect(isFieldStep(step)).toBe(false);
  });

  it('returns true for a classic field step', () => {
    const step: AnyStep = {
      id: 's1',
      title: 'Step',
      fields: [{ id: 'f1', key: 'k', type: 'text', label: 'L', required: false }],
    };
    expect(isFieldStep(step)).toBe(true);
  });
});

describe('AnyStepSchema — estimate-display variant', () => {
  it('parses an estimate-display step via the union', () => {
    const result = AnyStepSchema.safeParse(validEstimateStep);
    expect(result.success).toBe(true);
  });

  it('still parses a classic field step via the union', () => {
    const result = AnyStepSchema.safeParse({
      id: 's1',
      title: 'Step',
      fields: [{ id: 'f1', key: 'k', type: 'text', label: 'L', required: false }],
    });
    expect(result.success).toBe(true);
  });
});
