/**
 * Validation entry points.
 *
 * Two-phase, fail-closed validation:
 *
 *   Phase 1 (structural): Zod safeParse against the schema. Aggregates ALL
 *   shape issues at once (missing fields, wrong types, unknown keys, bad
 *   versions). Strict objects mean misspelled keys fail here.
 *
 *   Phase 2 (semantic cross-reference): a pure pass over a structurally-valid
 *   config that checks integrity Zod cannot express — every condition.fieldId
 *   and every pricing appliesToFieldId must reference a field that actually
 *   exists; choice fields must carry options and non-choice fields must not.
 *
 * Both phases produce the same deterministic ValidationIssue[] shape, so the
 * caller handles failure uniformly. Validation is total: a config either fully
 * passes both phases or is rejected with a complete, ordered issue list.
 */

import {
  WizardConfigSchema,
  isFieldStep,
  type WizardConfig,
  type Condition,
} from '@/domain/config/wizard-config';
import { PricingConfigSchema, type PricingConfig } from '@/domain/config/pricing';
import {
  type ValidationIssue,
  type ValidationResult,
  issuesFromZodError,
} from '@/domain/validation/errors';

// Re-export the focused PublicConfig validator so the barrel surface is
// unchanged, while keeping its module graph independent of the wizard/pricing
// schemas (so the boot path stays lean).
export { validatePublicConfig } from '@/domain/validation/validate-public';

/** Field types that require an `options` array. */
const CHOICE_FIELD_TYPES = new Set(['select', 'radio', 'checkbox']);

/**
 * Validate a wizard config. Runs structural then semantic phases.
 */
export function validateWizardConfig(input: unknown): ValidationResult<WizardConfig> {
  const parsed = WizardConfigSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, issues: issuesFromZodError(parsed.error) };
  }

  const semantic = crossReferenceWizard(parsed.data);
  if (semantic.length > 0) {
    return { ok: false, issues: semantic };
  }

  return { ok: true, value: parsed.data };
}

/**
 * Validate a pricing config against a wizard config (so pricing field
 * references can be checked against real field IDs). Structural then semantic.
 */
export function validatePricingConfig(
  input: unknown,
  wizard: WizardConfig,
): ValidationResult<PricingConfig> {
  const parsed = PricingConfigSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, issues: issuesFromZodError(parsed.error) };
  }

  const semantic = crossReferencePricing(parsed.data, wizard);
  if (semantic.length > 0) {
    return { ok: false, issues: semantic };
  }

  return { ok: true, value: parsed.data };
}

/**
 * Validate the public runtime config (window.GOQW_CONFIG). Implemented in the
 * focused validate-public module (re-exported above) so the browser boot path
 * does not pull in the wizard/pricing schemas. Structural only; non-strict.
 */

// ---------------------------------------------------------------------------
// Semantic cross-reference passes (pure, deterministic).
// ---------------------------------------------------------------------------

/**
 * Collect every answer key / field ID declared anywhere in the wizard.
 *
 * Classic field steps: field.id values.
 * VisualCardSelectorStep: answerKey.
 * SizeBracketSelectorStep: answerKey + each exactField.id.
 *
 * Used by the cross-reference passes to validate that pricing quantityFieldId
 * and modifier/extra appliesToFieldId values resolve to real answer keys.
 */
function collectFieldIds(wizard: WizardConfig): Set<string> {
  const ids = new Set<string>();
  for (const step of wizard.steps) {
    if (!isFieldStep(step)) {
      if (step.stepKind === 'visual-card-selector') {
        ids.add(step.answerKey);
      } else if (step.stepKind === 'size-bracket-selector') {
        ids.add(step.answerKey);
        for (const ef of step.exactFields) {
          ids.add(ef.id);
        }
      }
      continue;
    }
    for (const field of step.fields) {
      ids.add(field.id);
    }
  }
  return ids;
}

/**
 * Semantic checks for a wizard config:
 *   - duplicate step / field IDs are rejected (IDs are contracts; must be unique)
 *   - condition.fieldId references must resolve to a real field
 *   - choice fields must have options; non-choice fields must not
 * Issues are returned sorted for byte-stable output.
 */
function crossReferenceWizard(wizard: WizardConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenStepIds = new Set<string>();
  const seenFieldIds = new Set<string>();
  const allFieldIds = collectFieldIds(wizard);

  wizard.steps.forEach((step, stepIndex) => {
    if (seenStepIds.has(step.id)) {
      issues.push({
        path: `steps.${stepIndex}.id`,
        message: `Duplicate step id "${step.id}". Step ids must be unique.`,
      });
    }
    seenStepIds.add(step.id);

    if (step.condition) {
      checkConditionRef(step.condition, `steps.${stepIndex}.condition`, allFieldIds, issues);
    }

    if (!isFieldStep(step)) return;

    step.fields.forEach((field, fieldIndex) => {
      const base = `steps.${stepIndex}.fields.${fieldIndex}`;

      if (seenFieldIds.has(field.id)) {
        issues.push({
          path: `${base}.id`,
          message: `Duplicate field id "${field.id}". Field ids must be unique.`,
        });
      }
      seenFieldIds.add(field.id);

      const isChoice = CHOICE_FIELD_TYPES.has(field.type);
      const hasOptions = Array.isArray(field.options) && field.options.length > 0;

      if (isChoice && !hasOptions) {
        issues.push({
          path: `${base}.options`,
          message: `Field "${field.id}" of type "${field.type}" must define at least one option.`,
        });
      }
      if (!isChoice && field.options !== undefined) {
        issues.push({
          path: `${base}.options`,
          message: `Field "${field.id}" of type "${field.type}" must not define options.`,
        });
      }

      if (field.condition) {
        checkConditionRef(field.condition, `${base}.condition`, allFieldIds, issues);
      }
    });
  });

  return sortIssues(issues);
}

/**
 * Semantic checks for a pricing config against its wizard:
 *   - base.quantityFieldId must reference a real field
 *   - every modifier/extra appliesToFieldId must reference a real field
 *   - minPence must not exceed maxPence
 */
function crossReferencePricing(pricing: PricingConfig, wizard: WizardConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const allFieldIds = collectFieldIds(wizard);

  if (!allFieldIds.has(pricing.base.quantityFieldId)) {
    issues.push({
      path: 'base.quantityFieldId',
      message: `Pricing base references unknown field "${pricing.base.quantityFieldId}".`,
    });
  }

  pricing.modifiers.forEach((mod, index) => {
    if (!allFieldIds.has(mod.appliesToFieldId)) {
      issues.push({
        path: `modifiers.${index}.appliesToFieldId`,
        message: `Modifier "${mod.id}" references unknown field "${mod.appliesToFieldId}".`,
      });
    }
  });

  pricing.extras.forEach((ex, index) => {
    if (!allFieldIds.has(ex.appliesToFieldId)) {
      issues.push({
        path: `extras.${index}.appliesToFieldId`,
        message: `Extra "${ex.id}" references unknown field "${ex.appliesToFieldId}".`,
      });
    }
  });

  if (pricing.bounds.minPence > pricing.bounds.maxPence) {
    issues.push({
      path: 'bounds.minPence',
      message: 'Minimum price must not exceed maximum price.',
    });
  }

  return sortIssues(issues);
}

/**
 * Check that a condition's referenced field exists. Pushes an issue if not.
 */
function checkConditionRef(
  condition: Condition,
  path: string,
  allFieldIds: Set<string>,
  issues: ValidationIssue[],
): void {
  if (!allFieldIds.has(condition.fieldId)) {
    issues.push({
      path: `${path}.fieldId`,
      message: `Condition references unknown field "${condition.fieldId}".`,
    });
  }
}

/**
 * Stable sort by path then message (matches errors.ts ordering) so semantic
 * issues are byte-stable across runs.
 */
function sortIssues(issues: ValidationIssue[]): ValidationIssue[] {
  return [...issues].sort((a, b) => {
    if (a.path !== b.path) return a.path < b.path ? -1 : 1;
    return a.message < b.message ? -1 : a.message > b.message ? 1 : 0;
  });
}
