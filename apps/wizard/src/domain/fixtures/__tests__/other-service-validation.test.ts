import { describe, it, expect } from 'vitest';

import { otherWizardConfig } from '@/domain/fixtures/other.config';
import { isFieldStep } from '@/domain/config/wizard-config';
import { validateStep } from '@/domain/runtime/answer-validation';
import { buildFieldKeyMap } from '@/domain/runtime/condition-evaluator';

/**
 * 6.3: validation behavior for the "Other" service's description step
 * (work_description — the project-description field, D5=B).
 *
 * As with 6.2, there is no "Continue disabled" DOM state in this codebase
 * (see AUDIT-6.2-validation-pattern.md, still accurate here) — required
 * fields are enforced by validateStep() blocking STEP_NEXT. Exercised
 * directly against the real other.config.ts.
 *
 * Submission-payload plumbing is covered separately in
 * src/runtime/__tests__/other-service-payload.test.ts (domain-layer tests
 * cannot import @/runtime/**, per ESLint's no-restricted-imports boundary).
 */

const descriptionStep = otherWizardConfig.steps.find((s) => s.id === 'description');
if (!descriptionStep || !isFieldStep(descriptionStep)) {
  throw new Error('expected description to be a field step');
}

const fieldKeyById = buildFieldKeyMap(otherWizardConfig);

describe('other service description-step validation (6.3)', () => {
  it('is invalid when the project description is empty', () => {
    const snapshot = validateStep(descriptionStep, {}, fieldKeyById);
    expect(snapshot.valid).toBe(false);
    expect(snapshot.issues.map((i) => i.fieldKey)).toEqual(['work_description']);
  });

  it('is invalid when the project description is whitespace-only', () => {
    const snapshot = validateStep(descriptionStep, { work_description: '   ' }, fieldKeyById);
    expect(snapshot.valid).toBe(false);
  });

  it('is valid once a non-empty project description is provided', () => {
    const snapshot = validateStep(
      descriptionStep,
      { work_description: 'I need a garden shed built, approximately 2m x 3m.' },
      fieldKeyById,
    );
    expect(snapshot.valid).toBe(true);
    expect(snapshot.issues).toEqual([]);
  });
});
