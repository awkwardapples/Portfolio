import { describe, it, expect } from 'vitest';

import { fencingWizardConfig } from '@/domain/fixtures/fencing.config';
import { isFieldStep } from '@/domain/config/wizard-config';
import { validateStep } from '@/domain/runtime/answer-validation';
import { buildFieldKeyMap } from '@/domain/runtime/condition-evaluator';

/**
 * 6.2: validation behavior for the fencing-details step (terrain /
 * post_material / gravel_boards).
 *
 * There is no "Continue disabled" DOM state in this codebase (see
 * AUDIT-6.2-validation-pattern.md) — required fields are enforced by
 * validateStep() blocking STEP_NEXT, which is exactly what these tests
 * exercise directly against the real fencing config.
 *
 * Submission-payload plumbing (does an answer set here reach the wire
 * payload?) is covered separately in
 * src/runtime/__tests__/fencing-post-estimate-payload.test.ts — this file
 * stays domain-only (no @/runtime/** imports; that boundary is enforced by
 * ESLint's no-restricted-imports rule, same as the src/site/** boundary).
 */

const fencingDetailsStep = fencingWizardConfig.steps.find((s) => s.id === 'fencing-details');
if (!fencingDetailsStep || !isFieldStep(fencingDetailsStep)) {
  throw new Error('expected fencing-details to be a field step');
}

const fieldKeyById = buildFieldKeyMap(fencingWizardConfig);

describe('fencing-details step validation (6.2)', () => {
  it('is invalid with all three required fields empty', () => {
    const snapshot = validateStep(fencingDetailsStep, {}, fieldKeyById);
    expect(snapshot.valid).toBe(false);
    expect(snapshot.issues.map((i) => i.fieldKey).sort()).toEqual([
      'gravel_boards',
      'post_material',
      'terrain',
    ]);
  });

  it('is invalid when only some fields are answered', () => {
    const snapshot = validateStep(
      fencingDetailsStep,
      { terrain: 'soft', post_material: 'concrete' },
      fieldKeyById,
    );
    expect(snapshot.valid).toBe(false);
    expect(snapshot.issues.map((i) => i.fieldKey)).toEqual(['gravel_boards']);
  });

  it('rejects an answer that is not one of the declared options', () => {
    const snapshot = validateStep(
      fencingDetailsStep,
      { terrain: 'swampy', post_material: 'concrete', gravel_boards: 'yes' },
      fieldKeyById,
    );
    expect(snapshot.valid).toBe(false);
    expect(snapshot.issues.find((i) => i.fieldKey === 'terrain')?.message).toBe(
      'Please select a valid option.',
    );
  });

  it('is valid once all three fields have a matching option value', () => {
    const snapshot = validateStep(
      fencingDetailsStep,
      { terrain: 'hard', post_material: 'timber', gravel_boards: 'no' },
      fieldKeyById,
    );
    expect(snapshot.valid).toBe(true);
    expect(snapshot.issues).toEqual([]);
  });
});
