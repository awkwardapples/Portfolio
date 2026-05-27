import { describe, expect, it } from 'vitest';

import type { Step, WizardConfig } from '@/domain/config/wizard-config';
import { validateStep } from '@/domain/runtime/answer-validation';
import type { AnswerMap } from '@/domain/runtime/answer-types';
import { buildFieldKeyMap } from '@/domain/runtime/condition-evaluator';

// ---------------------------------------------------------------------------
// Test fixtures
//
//   conditionConfig — two steps used for hidden-step and hidden-field tests:
//     step-sources   always visible; contains f-control and f-flag
//     step-cond      visible only when control === 'show'  (required text)
//     step-with-cf   always visible; f-cond-field hidden when flag ≠ 'show'
// ---------------------------------------------------------------------------

const conditionConfig: WizardConfig = {
  schemaVersion: 1,
  id: 'validation-test',
  title: 'Validation test',
  steps: [
    {
      id: 'step-sources',
      title: 'Sources',
      fields: [
        { id: 'f-control', key: 'control', type: 'text', label: 'Control', required: false },
        { id: 'f-flag', key: 'flag', type: 'text', label: 'Flag', required: false },
      ],
    },
    {
      id: 'step-cond',
      title: 'Conditional step',
      condition: { operator: 'equals', fieldId: 'f-control', value: 'show' },
      fields: [{ id: 'f-in-cond', key: 'in_cond', type: 'text', label: 'In cond', required: true }],
    },
    {
      id: 'step-with-cf',
      title: 'Step with conditional field',
      fields: [
        { id: 'f-always', key: 'always_v', type: 'text', label: 'Always', required: true },
        {
          id: 'f-cond-field',
          key: 'cond_field_v',
          type: 'text',
          label: 'Cond field',
          required: true,
          condition: { operator: 'equals', fieldId: 'f-flag', value: 'show' },
        },
      ],
    },
  ],
};

const condMap = buildFieldKeyMap(conditionConfig);
const condStep = conditionConfig.steps[1]!; // step-cond (requires control='show')
const stepWithCondField = conditionConfig.steps[2]!; // step-with-cf

// Empty map for tests that don't involve any conditions
const emptyMap = new Map<string, string>();

// ---------------------------------------------------------------------------
// Helpers: build simple inline steps for focused type/required tests
// ---------------------------------------------------------------------------

function reqTextField(id: string, key: string): Step['fields'][number] {
  return { id, key, type: 'text', label: 'Label', required: true };
}

function optTextField(id: string, key: string): Step['fields'][number] {
  return { id, key, type: 'text', label: 'Label', required: false };
}

function singleStep(fields: Step['fields'], id = 'test-step'): Step {
  return { id, title: 'Test', fields };
}

// ---------------------------------------------------------------------------
// validateStep — hidden step
// ---------------------------------------------------------------------------

describe('validateStep — hidden step', () => {
  it('returns valid:true and no issues when step condition is false', () => {
    // step-cond requires control === 'show'; with empty answers it is hidden
    const result = validateStep(condStep, {}, condMap);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.stepId).toBe('step-cond');
  });

  it('would fail validation if visible, but returns clean when hidden', () => {
    // step-cond has a required field; without 'show' trigger it stays hidden
    // and required-ness is never evaluated
    const result = validateStep(condStep, { control: 'hide' }, condMap);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('validates normally when step condition becomes true', () => {
    // trigger the step → required field is now blank → should be invalid
    const result = validateStep(condStep, { control: 'show' }, condMap);
    expect(result.valid).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.fieldKey).toBe('in_cond');
  });
});

// ---------------------------------------------------------------------------
// validateStep — hidden fields within a visible step
// ---------------------------------------------------------------------------

describe('validateStep — hidden fields within a visible step', () => {
  it('skips a conditionally hidden required field and still reports valid', () => {
    // stepWithCondField has f-cond-field (required) hidden when flag ≠ 'show'
    // f-always is filled; f-cond-field is hidden → no issue for it
    const result = validateStep(stepWithCondField, { always_v: 'hello' }, condMap);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('includes a conditionally visible required field when its condition is true', () => {
    // flag === 'show' → f-cond-field is now visible and required but empty
    const result = validateStep(stepWithCondField, { always_v: 'hello', flag: 'show' }, condMap);
    expect(result.valid).toBe(false);
    const keys = result.issues.map((i) => i.fieldKey);
    expect(keys).toContain('cond_field_v');
  });
});

// ---------------------------------------------------------------------------
// validateStep — required field semantics
// ---------------------------------------------------------------------------

describe('validateStep — required field semantics', () => {
  const step = singleStep([reqTextField('f1', 'k1')]);

  it('flags missing answer (undefined) as required', () => {
    const result = validateStep(step, {}, emptyMap);
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.message).toBe('This field is required.');
  });

  it('flags null answer as required', () => {
    const result = validateStep(step, { k1: null }, emptyMap);
    expect(result.valid).toBe(false);
  });

  it('flags empty string as required', () => {
    const result = validateStep(step, { k1: '' }, emptyMap);
    expect(result.valid).toBe(false);
  });

  it('flags whitespace-only string as required', () => {
    const result = validateStep(step, { k1: '   ' }, emptyMap);
    expect(result.valid).toBe(false);
  });

  it('flags empty array as required', () => {
    const reqCheckbox = singleStep([
      { id: 'f-cb', key: 'cb', type: 'checkbox', label: 'CB', required: true },
    ]);
    const result = validateStep(reqCheckbox, { cb: [] }, emptyMap);
    expect(result.valid).toBe(false);
  });

  it('boolean false passes required check', () => {
    const reqCheckbox = singleStep([
      { id: 'f-cb', key: 'cb', type: 'checkbox', label: 'CB', required: true },
    ]);
    const result = validateStep(reqCheckbox, { cb: false }, emptyMap);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('number 0 passes required check', () => {
    const reqNum = singleStep([
      { id: 'f-n', key: 'n', type: 'number', label: 'N', required: true },
    ]);
    const result = validateStep(reqNum, { n: 0 }, emptyMap);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// validateStep — type validation: text, textarea, photo
// ---------------------------------------------------------------------------

describe('validateStep — type validation: text, textarea, photo', () => {
  it('accepts a string for text type', () => {
    const step = singleStep([optTextField('f', 'k')]);
    const result = validateStep(step, { k: 'hello' }, emptyMap);
    expect(result.valid).toBe(true);
  });

  it('rejects a non-string answer for text type', () => {
    const step = singleStep([optTextField('f', 'k')]);
    const result = validateStep(step, { k: 42 }, emptyMap);
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.message).toBe('Expected a text value.');
  });

  it('accepts a string for textarea type', () => {
    const step = singleStep([{ id: 'f', key: 'k', type: 'textarea', label: 'L', required: false }]);
    const result = validateStep(step, { k: 'multi\nline' }, emptyMap);
    expect(result.valid).toBe(true);
  });

  it('accepts a string for photo type', () => {
    const step = singleStep([{ id: 'f', key: 'k', type: 'photo', label: 'L', required: false }]);
    const result = validateStep(step, { k: 'https://example.com/photo.jpg' }, emptyMap);
    expect(result.valid).toBe(true);
  });

  it('rejects a non-string answer for photo type', () => {
    const step = singleStep([{ id: 'f', key: 'k', type: 'photo', label: 'L', required: false }]);
    const result = validateStep(step, { k: true }, emptyMap);
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateStep — type validation: select, radio
// ---------------------------------------------------------------------------

describe('validateStep — type validation: select', () => {
  const selectStep = singleStep([
    {
      id: 'f-sel',
      key: 'sel',
      type: 'select',
      label: 'Select',
      required: false,
      options: [
        { value: 'opt-a', label: 'A' },
        { value: 'opt-b', label: 'B' },
      ],
    },
  ]);

  it('accepts a string matching an option value', () => {
    const result = validateStep(selectStep, { sel: 'opt-a' }, emptyMap);
    expect(result.valid).toBe(true);
  });

  it('rejects an invalid select value not in options', () => {
    const result = validateStep(selectStep, { sel: 'opt-z' }, emptyMap);
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.message).toBe('Please select a valid option.');
  });

  it('rejects a non-string answer for select type', () => {
    const result = validateStep(selectStep, { sel: 1 }, emptyMap);
    expect(result.valid).toBe(false);
  });

  it('accepts a valid radio answer', () => {
    const radioStep = singleStep([
      {
        id: 'f-rad',
        key: 'rad',
        type: 'radio',
        label: 'Radio',
        required: false,
        options: [{ value: 'yes', label: 'Yes' }],
      },
    ]);
    const result = validateStep(radioStep, { rad: 'yes' }, emptyMap);
    expect(result.valid).toBe(true);
  });

  it('rejects an invalid radio answer', () => {
    const radioStep = singleStep([
      {
        id: 'f-rad',
        key: 'rad',
        type: 'radio',
        label: 'Radio',
        required: false,
        options: [{ value: 'yes', label: 'Yes' }],
      },
    ]);
    const result = validateStep(radioStep, { rad: 'no' }, emptyMap);
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateStep — type validation: checkbox (boolean)
// ---------------------------------------------------------------------------

describe('validateStep — type validation: checkbox (boolean)', () => {
  const boolStep = singleStep([
    { id: 'f-cb', key: 'cb', type: 'checkbox', label: 'CB', required: false },
  ]);

  it('accepts true', () => {
    const result = validateStep(boolStep, { cb: true }, emptyMap);
    expect(result.valid).toBe(true);
  });

  it('accepts false', () => {
    const result = validateStep(boolStep, { cb: false }, emptyMap);
    expect(result.valid).toBe(true);
  });

  it('rejects a non-boolean non-array answer', () => {
    const result = validateStep(boolStep, { cb: 'yes' }, emptyMap);
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.message).toBe('Expected a boolean or list of values.');
  });
});

// ---------------------------------------------------------------------------
// validateStep — type validation: checkbox (multi-select)
// ---------------------------------------------------------------------------

describe('validateStep — type validation: checkbox (multi-select)', () => {
  const multiStep = singleStep([
    {
      id: 'f-mc',
      key: 'mc',
      type: 'checkbox',
      label: 'Multi',
      required: false,
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
    },
  ]);

  it('accepts an array of valid option values', () => {
    const result = validateStep(multiStep, { mc: ['a', 'b'] }, emptyMap);
    expect(result.valid).toBe(true);
  });

  it('accepts a single-element array', () => {
    const result = validateStep(multiStep, { mc: ['a'] }, emptyMap);
    expect(result.valid).toBe(true);
  });

  it('rejects an array containing an invalid option value', () => {
    const result = validateStep(multiStep, { mc: ['a', 'z'] }, emptyMap);
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.message).toBe('Please select valid options only.');
  });

  it('treats an empty array as absent (optional: no issue; required: issue)', () => {
    const result = validateStep(multiStep, { mc: [] }, emptyMap);
    expect(result.valid).toBe(true); // optional, empty array is absent but not required

    const reqMultiStep = singleStep([
      {
        id: 'f-mc2',
        key: 'mc2',
        type: 'checkbox',
        label: 'Multi req',
        required: true,
        options: [{ value: 'a', label: 'A' }],
      },
    ]);
    const reqResult = validateStep(reqMultiStep, { mc2: [] }, emptyMap);
    expect(reqResult.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateStep — type validation: number, dimensions
// ---------------------------------------------------------------------------

describe('validateStep — type validation: number, dimensions', () => {
  const numStep = singleStep([
    { id: 'f-n', key: 'n', type: 'number', label: 'N', required: false },
  ]);

  it('accepts a number', () => {
    const result = validateStep(numStep, { n: 42 }, emptyMap);
    expect(result.valid).toBe(true);
  });

  it('rejects a string answer for number type', () => {
    const result = validateStep(numStep, { n: '42' }, emptyMap);
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.message).toBe('Expected a numeric value.');
  });

  it('accepts 0 as a valid number answer', () => {
    const result = validateStep(numStep, { n: 0 }, emptyMap);
    expect(result.valid).toBe(true);
  });

  it('accepts a number for dimensions type', () => {
    const dimStep = singleStep([
      { id: 'f-d', key: 'd', type: 'dimensions', label: 'D', required: false },
    ]);
    const result = validateStep(dimStep, { d: 3.5 }, emptyMap);
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateStep — type validation: review
// ---------------------------------------------------------------------------

describe('validateStep — type validation: review', () => {
  it('review field is display-only and never produces an issue', () => {
    const step = singleStep([
      { id: 'f-rev', key: 'rev', type: 'review', label: 'Review', required: false },
    ]);
    const result = validateStep(step, {}, emptyMap);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// validateStep — partial and full validity
// ---------------------------------------------------------------------------

describe('validateStep — partial and full validity', () => {
  const mixedStep = singleStep([
    { id: 'f-req', key: 'req_k', type: 'text', label: 'Required', required: true },
    { id: 'f-opt', key: 'opt_k', type: 'text', label: 'Optional', required: false },
    {
      id: 'f-sel',
      key: 'sel_k',
      type: 'select',
      label: 'Select',
      required: true,
      options: [{ value: 'x', label: 'X' }],
    },
  ]);

  it('fully valid step: all fields satisfied → valid:true, no issues', () => {
    const answers: AnswerMap = { req_k: 'hello', sel_k: 'x' };
    const result = validateStep(mixedStep, answers, emptyMap);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('partially valid step: reports only the failing fields', () => {
    // req_k empty → required error; sel_k valid → no issue for it
    const answers: AnswerMap = { req_k: '', sel_k: 'x' };
    const result = validateStep(mixedStep, answers, emptyMap);
    expect(result.valid).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.fieldKey).toBe('req_k');
  });

  it('multiple failures: all invalid fields appear in issues, in config order', () => {
    // req_k empty, sel_k invalid value
    const answers: AnswerMap = { req_k: '', sel_k: 'bad' };
    const result = validateStep(mixedStep, answers, emptyMap);
    expect(result.valid).toBe(false);
    expect(result.issues).toHaveLength(2);
    expect(result.issues.map((i) => i.fieldKey)).toEqual(['req_k', 'sel_k']);
  });

  it('stepId in snapshot matches the step id', () => {
    const step = singleStep([], 'my-unique-step');
    const result = validateStep(step, {}, emptyMap);
    expect(result.stepId).toBe('my-unique-step');
  });
});

// ---------------------------------------------------------------------------
// validateStep — determinism
// ---------------------------------------------------------------------------

describe('validateStep — determinism', () => {
  it('produces the same result across repeated calls with identical inputs', () => {
    const step = singleStep([
      reqTextField('f1', 'k1'),
      {
        id: 'f-s',
        key: 'ks',
        type: 'select',
        label: 'S',
        required: false,
        options: [{ value: 'a', label: 'A' }],
      },
    ]);
    const answers: AnswerMap = { k1: 'value', ks: 'a' };
    const r1 = validateStep(step, answers, emptyMap);
    const r2 = validateStep(step, answers, emptyMap);
    const r3 = validateStep(step, answers, emptyMap);
    expect(r1.valid).toBe(true);
    expect(r1.issues).toEqual(r2.issues);
    expect(r2.issues).toEqual(r3.issues);
  });

  it('different answers produce different results (pure function of inputs)', () => {
    const step = singleStep([reqTextField('f1', 'k1')]);
    const passing = validateStep(step, { k1: 'filled' }, emptyMap);
    const failing = validateStep(step, { k1: '' }, emptyMap);
    expect(passing.valid).toBe(true);
    expect(failing.valid).toBe(false);
  });
});
