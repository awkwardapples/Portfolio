import { describe, it, expect } from 'vitest';

import type { WizardConfig } from '@/domain/config/wizard-config';
import { buildFieldKeyMap } from '@/domain/runtime/condition-evaluator';
import { validateStep } from '@/domain/runtime/answer-validation';
import { getVisibleSteps } from '@/domain/runtime/navigation';

// ---------------------------------------------------------------------------
// Test fixtures
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

const allStepTypesConfig: WizardConfig = {
  schemaVersion: 1,
  id: 'all-types-test',
  title: 'All step types',
  steps: [
    {
      stepKind: 'size-bracket-selector' as const,
      id: 'area_bracket',
      title: 'Area',
      answerKey: 'area_size',
      brackets: [{ id: 'small', label: 'Small', minValue: 0, maxValue: 10, unit: 'm²' }],
      exactPromptLabel: 'Exact',
      exactFields: [{ id: 'area_m2', label: 'Area', unit: 'm²' }],
    },
    {
      stepKind: 'visual-card-selector' as const,
      id: 'material_step',
      title: 'Material',
      answerKey: 'material',
      multiple: false,
      options: [{ id: 'brick', label: 'Brick' }],
    },
    {
      stepKind: 'estimate-display' as const,
      id: 'estimate',
      title: 'Estimate',
      disclaimer: 'Guide price only.',
      showRangeAsRange: true,
      onAdjustGoTo: 'area_bracket',
    },
    {
      id: 'contact',
      title: 'Contact',
      fields: [{ id: 'f-name', key: 'name', type: 'text', label: 'Name', required: true }],
    },
  ],
};

const answers = {};
const fieldKeyById = buildFieldKeyMap(mixedConfig);
const allTypesFieldKeyById = buildFieldKeyMap(allStepTypesConfig);

describe('buildFieldKeyMap with non-field steps', () => {
  it('includes field IDs from classic field steps', () => {
    expect(fieldKeyById.get('f-size')).toBe('size');
    expect(fieldKeyById.get('f-name')).toBe('name');
  });

  it('does not include any ID from the estimate-display step', () => {
    expect(fieldKeyById.get('estimate')).toBeUndefined();
  });
});

describe('buildFieldKeyMap with visual-card-selector and size-bracket-selector', () => {
  it('includes VisualCardSelectorStep answerKey with identity mapping', () => {
    expect(allTypesFieldKeyById.get('material')).toBe('material');
  });

  it('includes SizeBracketSelectorStep answerKey with identity mapping', () => {
    expect(allTypesFieldKeyById.get('area_size')).toBe('area_size');
  });

  it('includes SizeBracketSelectorStep exactField ids with identity mapping', () => {
    expect(allTypesFieldKeyById.get('area_m2')).toBe('area_m2');
  });

  it('does not include the estimate-display step id in the all-types config', () => {
    expect(allTypesFieldKeyById.get('estimate')).toBeUndefined();
  });

  it('includes classic field step entries alongside new step type entries', () => {
    expect(allTypesFieldKeyById.get('f-name')).toBe('name');
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
