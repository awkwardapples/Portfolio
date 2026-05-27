import { describe, expect, it } from 'vitest';

import type { WizardConfig } from '@/domain/config/wizard-config';
import type { AnswerMap } from '@/domain/runtime/answer-types';
import { buildFieldKeyMap, evaluateCondition } from '@/domain/runtime/condition-evaluator';

// ---------------------------------------------------------------------------
// Minimal config for tests — covers text, select, number, and checkbox fields
// ---------------------------------------------------------------------------

const testConfig: WizardConfig = {
  schemaVersion: 1,
  id: 'test-wizard',
  title: 'Test wizard',
  steps: [
    {
      id: 'step-one',
      title: 'Step one',
      fields: [
        { id: 'f-text', key: 'text_val', type: 'text', label: 'Text field', required: false },
        {
          id: 'f-select',
          key: 'select_val',
          type: 'select',
          label: 'Select field',
          required: false,
          options: [
            { value: 'a', label: 'A' },
            { value: 'b', label: 'B' },
            { value: 'c', label: 'C' },
          ],
        },
        {
          id: 'f-number',
          key: 'number_val',
          type: 'number',
          label: 'Number field',
          required: false,
        },
        {
          id: 'f-checkbox',
          key: 'checkbox_val',
          type: 'checkbox',
          label: 'Checkbox field',
          required: false,
          options: [
            { value: 'opt1', label: 'Option 1' },
            { value: 'opt2', label: 'Option 2' },
            { value: 'opt3', label: 'Option 3' },
          ],
        },
      ],
    },
    {
      id: 'step-two',
      title: 'Step two',
      fields: [
        {
          id: 'f-step2',
          key: 'step2_val',
          type: 'text',
          label: 'Step two field',
          required: false,
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// buildFieldKeyMap
// ---------------------------------------------------------------------------

describe('buildFieldKeyMap', () => {
  it('maps every fieldId to its field key', () => {
    const map = buildFieldKeyMap(testConfig);
    expect(map.get('f-text')).toBe('text_val');
    expect(map.get('f-select')).toBe('select_val');
    expect(map.get('f-number')).toBe('number_val');
    expect(map.get('f-checkbox')).toBe('checkbox_val');
  });

  it('includes fields from all steps', () => {
    const map = buildFieldKeyMap(testConfig);
    expect(map.get('f-step2')).toBe('step2_val');
    expect(map.size).toBe(5);
  });

  it('returns undefined for an unknown fieldId', () => {
    const map = buildFieldKeyMap(testConfig);
    expect(map.get('does-not-exist')).toBeUndefined();
  });

  it('returns a fresh map each call (no shared reference)', () => {
    const map1 = buildFieldKeyMap(testConfig);
    const map2 = buildFieldKeyMap(testConfig);
    expect(map1).not.toBe(map2);
  });
});

// ---------------------------------------------------------------------------
// Shared map for evaluateCondition tests
// ---------------------------------------------------------------------------

const map = buildFieldKeyMap(testConfig);

// ---------------------------------------------------------------------------
// Fail-closed: unknown fieldId always returns false
// ---------------------------------------------------------------------------

describe('evaluateCondition — unknown fieldId (fail-closed)', () => {
  const answers: AnswerMap = { text_val: 'hello', select_val: 'a' };

  it('equals with unknown fieldId → false', () => {
    expect(
      evaluateCondition({ operator: 'equals', fieldId: 'ghost', value: 'hello' }, answers, map),
    ).toBe(false);
  });

  it('notEquals with unknown fieldId → false (not true)', () => {
    expect(
      evaluateCondition({ operator: 'notEquals', fieldId: 'ghost', value: 'hello' }, answers, map),
    ).toBe(false);
  });

  it('in with unknown fieldId → false', () => {
    expect(
      evaluateCondition({ operator: 'in', fieldId: 'ghost', values: ['hello'] }, answers, map),
    ).toBe(false);
  });

  it('notIn with unknown fieldId → false (not true)', () => {
    expect(
      evaluateCondition({ operator: 'notIn', fieldId: 'ghost', values: ['hello'] }, answers, map),
    ).toBe(false);
  });

  it('notEmpty with unknown fieldId → false', () => {
    expect(evaluateCondition({ operator: 'notEmpty', fieldId: 'ghost' }, answers, map)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// equals operator
// ---------------------------------------------------------------------------

describe('evaluateCondition — equals', () => {
  it('returns true when answer matches value exactly', () => {
    const answers: AnswerMap = { select_val: 'a' };
    expect(
      evaluateCondition({ operator: 'equals', fieldId: 'f-select', value: 'a' }, answers, map),
    ).toBe(true);
  });

  it('returns false when answer does not match', () => {
    const answers: AnswerMap = { select_val: 'b' };
    expect(
      evaluateCondition({ operator: 'equals', fieldId: 'f-select', value: 'a' }, answers, map),
    ).toBe(false);
  });

  it('uses strict equality — does not coerce number to string', () => {
    // number_val is 0 (number); condition compares against '0' (string)
    const answers: AnswerMap = { number_val: 0 };
    expect(
      evaluateCondition({ operator: 'equals', fieldId: 'f-number', value: '0' }, answers, map),
    ).toBe(false);
  });

  it('returns false when answer is missing', () => {
    const answers: AnswerMap = {};
    expect(
      evaluateCondition({ operator: 'equals', fieldId: 'f-select', value: 'a' }, answers, map),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// notEquals operator
// ---------------------------------------------------------------------------

describe('evaluateCondition — notEquals', () => {
  it('returns true when answer differs from value', () => {
    const answers: AnswerMap = { select_val: 'b' };
    expect(
      evaluateCondition({ operator: 'notEquals', fieldId: 'f-select', value: 'a' }, answers, map),
    ).toBe(true);
  });

  it('returns false when answer matches value', () => {
    const answers: AnswerMap = { select_val: 'a' };
    expect(
      evaluateCondition({ operator: 'notEquals', fieldId: 'f-select', value: 'a' }, answers, map),
    ).toBe(false);
  });

  it('returns true when answer is missing (undefined !== string)', () => {
    const answers: AnswerMap = {};
    expect(
      evaluateCondition({ operator: 'notEquals', fieldId: 'f-select', value: 'a' }, answers, map),
    ).toBe(true);
  });

  it('uses strict equality — does not coerce', () => {
    const answers: AnswerMap = { number_val: 1 };
    expect(
      evaluateCondition({ operator: 'notEquals', fieldId: 'f-number', value: '1' }, answers, map),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// in operator
// ---------------------------------------------------------------------------

describe('evaluateCondition — in (scalar answer)', () => {
  it('returns true when scalar answer is in the list', () => {
    const answers: AnswerMap = { select_val: 'a' };
    expect(
      evaluateCondition({ operator: 'in', fieldId: 'f-select', values: ['a', 'b'] }, answers, map),
    ).toBe(true);
  });

  it('returns false when scalar answer is not in the list', () => {
    const answers: AnswerMap = { select_val: 'c' };
    expect(
      evaluateCondition({ operator: 'in', fieldId: 'f-select', values: ['a', 'b'] }, answers, map),
    ).toBe(false);
  });

  it('returns false when answer is missing', () => {
    const answers: AnswerMap = {};
    expect(
      evaluateCondition({ operator: 'in', fieldId: 'f-select', values: ['a', 'b'] }, answers, map),
    ).toBe(false);
  });

  it('returns false for numeric answer against string list (no coercion)', () => {
    const answers: AnswerMap = { number_val: 1 };
    expect(
      evaluateCondition({ operator: 'in', fieldId: 'f-number', values: ['1', '2'] }, answers, map),
    ).toBe(false);
  });
});

describe('evaluateCondition — in (array answer)', () => {
  it('returns true when any array element is in the list', () => {
    const answers: AnswerMap = { checkbox_val: ['opt1', 'opt3'] };
    expect(
      evaluateCondition(
        { operator: 'in', fieldId: 'f-checkbox', values: ['opt1', 'opt2'] },
        answers,
        map,
      ),
    ).toBe(true);
  });

  it('returns false when no array element is in the list', () => {
    const answers: AnswerMap = { checkbox_val: ['opt3'] };
    expect(
      evaluateCondition(
        { operator: 'in', fieldId: 'f-checkbox', values: ['opt1', 'opt2'] },
        answers,
        map,
      ),
    ).toBe(false);
  });

  it('returns false for empty array answer', () => {
    const answers: AnswerMap = { checkbox_val: [] };
    expect(
      evaluateCondition({ operator: 'in', fieldId: 'f-checkbox', values: ['opt1'] }, answers, map),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// notIn operator
// ---------------------------------------------------------------------------

describe('evaluateCondition — notIn (scalar answer)', () => {
  it('returns true when scalar answer is not in the list', () => {
    const answers: AnswerMap = { select_val: 'c' };
    expect(
      evaluateCondition(
        { operator: 'notIn', fieldId: 'f-select', values: ['a', 'b'] },
        answers,
        map,
      ),
    ).toBe(true);
  });

  it('returns false when scalar answer is in the list', () => {
    const answers: AnswerMap = { select_val: 'a' };
    expect(
      evaluateCondition(
        { operator: 'notIn', fieldId: 'f-select', values: ['a', 'b'] },
        answers,
        map,
      ),
    ).toBe(false);
  });

  it('returns true when answer is missing (undefined is not in any string list)', () => {
    const answers: AnswerMap = {};
    expect(
      evaluateCondition(
        { operator: 'notIn', fieldId: 'f-select', values: ['a', 'b'] },
        answers,
        map,
      ),
    ).toBe(true);
  });

  it('returns true for numeric answer against string list (no coercion)', () => {
    const answers: AnswerMap = { number_val: 1 };
    expect(
      evaluateCondition(
        { operator: 'notIn', fieldId: 'f-number', values: ['1', '2'] },
        answers,
        map,
      ),
    ).toBe(true);
  });
});

describe('evaluateCondition — notIn (array answer)', () => {
  it('returns true when no array element is in the list', () => {
    const answers: AnswerMap = { checkbox_val: ['opt3'] };
    expect(
      evaluateCondition(
        { operator: 'notIn', fieldId: 'f-checkbox', values: ['opt1', 'opt2'] },
        answers,
        map,
      ),
    ).toBe(true);
  });

  it('returns false when any array element is in the list', () => {
    const answers: AnswerMap = { checkbox_val: ['opt1', 'opt3'] };
    expect(
      evaluateCondition(
        { operator: 'notIn', fieldId: 'f-checkbox', values: ['opt1', 'opt2'] },
        answers,
        map,
      ),
    ).toBe(false);
  });

  it('returns true for empty array (nothing is in the list)', () => {
    const answers: AnswerMap = { checkbox_val: [] };
    expect(
      evaluateCondition(
        { operator: 'notIn', fieldId: 'f-checkbox', values: ['opt1'] },
        answers,
        map,
      ),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// notEmpty operator
// ---------------------------------------------------------------------------

describe('evaluateCondition — notEmpty', () => {
  it('returns true for a non-empty string', () => {
    const answers: AnswerMap = { text_val: 'hello' };
    expect(evaluateCondition({ operator: 'notEmpty', fieldId: 'f-text' }, answers, map)).toBe(true);
  });

  it('returns false for an empty string', () => {
    const answers: AnswerMap = { text_val: '' };
    expect(evaluateCondition({ operator: 'notEmpty', fieldId: 'f-text' }, answers, map)).toBe(
      false,
    );
  });

  it('returns false for a whitespace-only string', () => {
    const answers: AnswerMap = { text_val: '   ' };
    expect(evaluateCondition({ operator: 'notEmpty', fieldId: 'f-text' }, answers, map)).toBe(
      false,
    );
  });

  it('returns false for a single-tab whitespace string', () => {
    const answers: AnswerMap = { text_val: '\t' };
    expect(evaluateCondition({ operator: 'notEmpty', fieldId: 'f-text' }, answers, map)).toBe(
      false,
    );
  });

  it('returns false for null answer', () => {
    const answers: AnswerMap = { text_val: null };
    expect(evaluateCondition({ operator: 'notEmpty', fieldId: 'f-text' }, answers, map)).toBe(
      false,
    );
  });

  it('returns false when answer is missing', () => {
    const answers: AnswerMap = {};
    expect(evaluateCondition({ operator: 'notEmpty', fieldId: 'f-text' }, answers, map)).toBe(
      false,
    );
  });

  it('returns true for numeric 0 (valid non-empty answer)', () => {
    const answers: AnswerMap = { number_val: 0 };
    expect(evaluateCondition({ operator: 'notEmpty', fieldId: 'f-number' }, answers, map)).toBe(
      true,
    );
  });

  it('returns true for a negative number', () => {
    const answers: AnswerMap = { number_val: -5 };
    expect(evaluateCondition({ operator: 'notEmpty', fieldId: 'f-number' }, answers, map)).toBe(
      true,
    );
  });

  it('returns true for boolean false (valid non-empty answer)', () => {
    // Using text_val with a boolean to test the boolean branch directly
    const answers: AnswerMap = { text_val: false };
    expect(evaluateCondition({ operator: 'notEmpty', fieldId: 'f-text' }, answers, map)).toBe(true);
  });

  it('returns true for boolean true', () => {
    const answers: AnswerMap = { text_val: true };
    expect(evaluateCondition({ operator: 'notEmpty', fieldId: 'f-text' }, answers, map)).toBe(true);
  });

  it('returns true for a non-empty array', () => {
    const answers: AnswerMap = { checkbox_val: ['opt1'] };
    expect(evaluateCondition({ operator: 'notEmpty', fieldId: 'f-checkbox' }, answers, map)).toBe(
      true,
    );
  });

  it('returns false for an empty array', () => {
    const answers: AnswerMap = { checkbox_val: [] };
    expect(evaluateCondition({ operator: 'notEmpty', fieldId: 'f-checkbox' }, answers, map)).toBe(
      false,
    );
  });
});

// ---------------------------------------------------------------------------
// Determinism: same inputs always produce same output
// ---------------------------------------------------------------------------

describe('evaluateCondition — determinism', () => {
  const answers: AnswerMap = { select_val: 'a', text_val: 'hello', checkbox_val: ['opt1', 'opt2'] };

  it('produces the same result on repeated calls (equals)', () => {
    const cond = { operator: 'equals' as const, fieldId: 'f-select', value: 'a' };
    const r1 = evaluateCondition(cond, answers, map);
    const r2 = evaluateCondition(cond, answers, map);
    const r3 = evaluateCondition(cond, answers, map);
    expect(r1).toBe(true);
    expect(r1).toBe(r2);
    expect(r2).toBe(r3);
  });

  it('produces the same result on repeated calls (in with array answer)', () => {
    const cond = {
      operator: 'in' as const,
      fieldId: 'f-checkbox',
      values: ['opt1', 'opt3'],
    };
    const r1 = evaluateCondition(cond, answers, map);
    const r2 = evaluateCondition(cond, answers, map);
    expect(r1).toBe(true);
    expect(r1).toBe(r2);
  });

  it('does not mutate the answers object', () => {
    const frozen: AnswerMap = Object.freeze({ select_val: 'a' });
    // Should not throw despite the frozen object
    expect(() =>
      evaluateCondition({ operator: 'equals', fieldId: 'f-select', value: 'a' }, frozen, map),
    ).not.toThrow();
  });

  it('does not mutate the fieldKeyById map', () => {
    const frozenMap: ReadonlyMap<string, string> = buildFieldKeyMap(testConfig);
    const before = frozenMap.size;
    evaluateCondition({ operator: 'notEmpty', fieldId: 'f-text' }, { text_val: 'hi' }, frozenMap);
    expect(frozenMap.size).toBe(before);
  });
});
