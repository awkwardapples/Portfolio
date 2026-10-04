import { describe, it, expect } from 'vitest';

import { AnyStepSchema, type WizardConfig } from '@/domain/config/wizard-config';
import { validateStep } from '@/domain/runtime/answer-validation';
import { buildFieldKeyMap } from '@/domain/runtime/condition-evaluator';
import { getVisibleSteps } from '@/domain/runtime/navigation';
import { validateWizardConfig } from '@/domain/validation/validate';
import { validateUrl } from '@/domain/validation/url-validator';
import { FORMAT_VALIDATORS } from '@/domain/validation/format-validators';

/**
 * The portfolio's additions to the engine (spec I.4, I.6; ADR-0042): the
 * content-result step kind, field maxLength and the role-link format check.
 * All additive: the existing suites run unchanged.
 */

const contentResult = {
  stepKind: 'content-result' as const,
  id: 'result',
  title: 'Your result',
  selection: 'featured' as const,
  continueLabel: 'Send Josh a message',
  exitLabel: 'Keep exploring',
};

const config: WizardConfig = {
  schemaVersion: 1,
  id: 'hiring',
  title: 'Hiring',
  quoteMode: 'manual',
  steps: [
    {
      id: 'work',
      title: 'What kind of work?',
      fields: [
        {
          id: 'organisation',
          key: 'organisation',
          type: 'text',
          label: 'Organisation',
          required: false,
          maxLength: 10,
        },
      ],
    },
    contentResult,
    {
      id: 'details',
      title: 'Your details',
      fields: [
        { id: 'contact_name', key: 'contact_name', type: 'text', label: 'Name', required: true },
      ],
    },
  ],
};

describe('ContentResultStepSchema', () => {
  it('accepts a content-result step', () => {
    expect(AnyStepSchema.safeParse(contentResult).success).toBe(true);
  });

  it('rejects an unknown selection', () => {
    expect(AnyStepSchema.safeParse({ ...contentResult, selection: 'everything' }).success).toBe(
      false,
    );
  });

  it('rejects unknown keys and missing labels', () => {
    expect(AnyStepSchema.safeParse({ ...contentResult, colour: 'red' }).success).toBe(false);
    expect(AnyStepSchema.safeParse({ ...contentResult, exitLabel: undefined }).success).toBe(false);
  });

  it('is valid inside a whole wizard config', () => {
    expect(validateWizardConfig(config).ok).toBe(true);
  });
});

describe('content-result in the runtime', () => {
  const fieldKeyById = buildFieldKeyMap(config);

  it('is always valid, like estimate-display', () => {
    expect(validateStep(contentResult, {}, fieldKeyById)).toEqual({
      stepId: 'result',
      valid: true,
      issues: [],
    });
  });

  it('sits in navigation in config order', () => {
    expect(getVisibleSteps(config, {}, fieldKeyById).map((step) => step.id)).toEqual([
      'work',
      'result',
      'details',
    ]);
  });

  it('adds no answer keys', () => {
    expect([...fieldKeyById.keys()]).toEqual(['organisation', 'contact_name']);
  });
});

describe('field maxLength', () => {
  const step = config.steps[0]!;
  const fieldKeyById = buildFieldKeyMap(config);

  it('rejects text longer than maxLength', () => {
    const result = validateStep(step, { organisation: 'x'.repeat(11) }, fieldKeyById);
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.message).toBe('Please keep this to 10 characters or fewer.');
  });

  it('accepts text up to maxLength, and fields without one are unlimited as before', () => {
    expect(validateStep(step, { organisation: 'x'.repeat(10) }, fieldKeyById).valid).toBe(true);
    const unlimited = config.steps[2]!;
    expect(validateStep(unlimited, { contact_name: 'x'.repeat(5000) }, fieldKeyById).valid).toBe(
      true,
    );
  });
});

describe('validateUrl and the role_link format validator', () => {
  it('accepts full web addresses', () => {
    expect(validateUrl('https://jobs.example.com/roles/123').valid).toBe(true);
    expect(validateUrl('http://example.org').valid).toBe(true);
  });

  it('rejects anything that is not a full http or https address', () => {
    for (const value of [
      'example.com',
      'https://localhost',
      'ftp://example.com',
      'javascript:alert(1)',
      '',
    ]) {
      expect(validateUrl(value).valid, value).toBe(false);
    }
  });

  it('is registered for the role_link answer key', () => {
    expect(FORMAT_VALIDATORS.get('role_link')?.('https://example.com').valid).toBe(true);
    expect(FORMAT_VALIDATORS.get('role_link')?.('not a link').valid).toBe(false);
  });
});
