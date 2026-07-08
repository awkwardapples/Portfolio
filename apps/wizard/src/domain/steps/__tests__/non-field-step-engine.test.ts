import { describe, it, expect } from 'vitest';

import type { WizardConfig } from '@/domain/config/wizard-config';
import { buildFieldKeyMap } from '@/domain/runtime/condition-evaluator';
import { validateStep } from '@/domain/runtime/answer-validation';
import { getVisibleSteps } from '@/domain/runtime/navigation';

// ---------------------------------------------------------------------------
// Test fixture: wizard with a mix of field steps and an estimate-display step
// ---------------------------------------------------------------------------

const mixedConfig: WizardConfig = {
  schemaVersion: 1,
  id: 'mixed-test',
  title: 'Mixed step type wizard',
  steps: [
    {
      id: 's1',
      title: 'Size',
      fields: [{ id: 'f-size', key: 'size', type: 'number', label: 'Size', required: true }],
    },
    {
      stepKind: 'estimate-display' as const,
      id: 'estimate',
      title: 'Your Estimate',
      disclaimer: 'Subject to site survey.',
      showRangeAsRange: true,
      onAdjustGoTo: 's1',
    },
    {
      id: 's3',
      title: 'Your details',
      fields: [{ id: 'f-name', key: 'name', type: 'text', label: 'Name', required: true }],
    },
  ],
};

const answers = {};
const fieldKeyById = buildFieldKeyMap(mixedConfig);

describe('buildFieldKeyMap with non-field steps', () => {
  it('only includes field IDs from classic field steps', () => {
    expect(fieldKeyById.get('f-size')).toBe('size');
    expect(fieldKeyById.get('f-name')).toBe('name');
  });

  it('does not include any ID from the estimate-display step', () => {
    expect(fieldKeyById.get('estimate')).toBeUndefined();
  });
});

describe('validateStep with non-field steps', () => {
  it('returns trivially valid for an estimate-display step', () => {
    const estimateStep = mixedConfig.steps[1];
    if (!estimateStep) throw new Error('fixture missing');
    const result = validateStep(estimateStep, answers, fieldKeyById);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.stepId).toBe('estimate');
  });

  it('still validates field steps normally', () => {
    const fieldStep = mixedConfig.steps[0];
    if (!fieldStep) throw new Error('fixture missing');
    // required field not answered → invalid
    const result = validateStep(fieldStep, {}, fieldKeyById);
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});

describe('getVisibleSteps with non-field steps', () => {
  it('includes non-field steps in the visible step list', () => {
    const visible = getVisibleSteps(mixedConfig, answers, fieldKeyById);
    expect(visible).toHaveLength(3);
    expect(visible[1]?.id).toBe('estimate');
  });
});
