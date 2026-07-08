import { describe, it, expect } from 'vitest';

import { StepSchema } from '@/domain/config/wizard-config';

const baseStep = {
  id: 'test-step',
  title: 'Test step',
  fields: [{ id: 'f1', key: 'f1', type: 'text' as const, label: 'Field', required: false }],
};

describe('StepSchema — allowSkip flag', () => {
  it('accepts a step with allowSkip: true', () => {
    const result = StepSchema.safeParse({ ...baseStep, allowSkip: true });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.allowSkip).toBe(true);
  });

  it('accepts a step with allowSkip: false', () => {
    const result = StepSchema.safeParse({ ...baseStep, allowSkip: false });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.allowSkip).toBe(false);
  });

  it('accepts a step without allowSkip (undefined — field is optional)', () => {
    const result = StepSchema.safeParse(baseStep);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.allowSkip).toBeUndefined();
  });

  it('rejects a step with allowSkip as a non-boolean value', () => {
    const result = StepSchema.safeParse({ ...baseStep, allowSkip: 'yes' });
    expect(result.success).toBe(false);
  });
});
