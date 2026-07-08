/**
 * Wizard configuration schema.
 *
 * Describes the wizard itself: what steps exist, what questions each asks, how
 * fields are conditionally shown, and a reference to the pricing config. This
 * is the AUTHORING contract — what an engineer writes when onboarding a new
 * client or trade vertical.
 *
 * BINDING RULES:
 *
 *   - Stable IDs, not labels (4.1 requirement #2). Every step and field has an
 *     immutable `id`. Labels are editable human copy; IDs are contracts. All
 *     cross-references (conditions, pricing) operate on IDs, never labels.
 *
 *   - Declarative conditions only (no code, no predicates). A condition is
 *     data describing when a step/field is visible.
 *
 *   - Strict objects (4.1 requirement #5). Unknown keys FAIL validation. A
 *     misspelled key is an error, not silently ignored.
 *
 *   - No presentation (4.1 requirement #10). No class names, colours, spacing,
 *     typography, or layout hints. Field `type` is an operational identifier
 *     from the canonical registry; the UI layer (4.4) maps it to a component.
 *
 *   - Field `type` values come from the canonical FIELD_TYPES registry, so
 *     there is no string drift between schema, evaluator, and renderer.
 */

import { z } from 'zod';

import { FIELD_TYPES } from '@/domain/config/field-types';

/** A stable identifier: lower-kebab or snake, no spaces. IDs are contracts. */
const idSchema = z
  .string()
  .min(1, 'An id must not be empty.')
  .regex(
    /^[a-z][a-z0-9_-]*$/,
    'An id must start with a lowercase letter and contain only lowercase letters, numbers, hyphens, or underscores.',
  );

/**
 * A declarative visibility condition. A step or field carrying a condition is
 * shown only when the condition evaluates true against current answers.
 *
 * Operators (total set; an unknown operator fails validation):
 *   - equals / notEquals: the answer for `fieldId` (not) equals `value`
 *   - in / notIn:         the answer is (not) one of `values`
 *   - notEmpty:           the answer for `fieldId` is present and non-empty
 *
 * `fieldId` references another field by its stable ID; the cross-reference
 * pass (validate.ts) rejects references to fields that do not exist.
 */
export const ConditionSchema = z.discriminatedUnion('operator', [
  z.strictObject({
    operator: z.literal('equals'),
    fieldId: idSchema,
    value: z.string().min(1),
  }),
  z.strictObject({
    operator: z.literal('notEquals'),
    fieldId: idSchema,
    value: z.string().min(1),
  }),
  z.strictObject({
    operator: z.literal('in'),
    fieldId: idSchema,
    values: z.array(z.string().min(1)).min(1),
  }),
  z.strictObject({
    operator: z.literal('notIn'),
    fieldId: idSchema,
    values: z.array(z.string().min(1)).min(1),
  }),
  z.strictObject({
    operator: z.literal('notEmpty'),
    fieldId: idSchema,
  }),
]);

export type Condition = z.infer<typeof ConditionSchema>;

/** An option for select/radio/checkbox fields. Value is the stable contract. */
const optionSchema = z.strictObject({
  value: z.string().min(1),
  label: z.string().min(1),
});

/**
 * A field definition. `type` is from the canonical registry. `key` is the
 * stable answer key (where this field's answer is stored in wizard state).
 * Optional `condition` controls visibility.
 *
 * `options` is required for choice fields and forbidden for others; this is
 * checked in the cross-reference/coherence pass rather than in the base shape,
 * so the error message can be specific and plain-language.
 */
export const FieldSchema = z.strictObject({
  id: idSchema,
  key: idSchema,
  type: z.enum(FIELD_TYPES),
  label: z.string().min(1, 'Every field needs a label.'),
  help: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(optionSchema).optional(),
  condition: ConditionSchema.optional(),
  /** Maximum number of photos (photo fields only, default 1). Ignored for other field types. */
  maxCount: z.number().int().min(1).max(5).optional(),
});

export type Field = z.infer<typeof FieldSchema>;

/** A step groups fields. Optional `condition` controls step visibility. */
export const StepSchema = z.strictObject({
  id: idSchema,
  title: z.string().min(1, 'Every step needs a title.'),
  description: z.string().optional(),
  fields: z.array(FieldSchema).min(1, 'A step must contain at least one field.'),
  condition: ConditionSchema.optional(),
  /**
   * When true, renders a "Skip and Submit" button alongside the standard
   * action button. Intended only for fully-optional terminal steps where the
   * user may want to submit without filling any fields.
   */
  allowSkip: z.boolean().optional(),
});

export type Step = z.infer<typeof StepSchema>;

// ---------------------------------------------------------------------------
// New step-kind schemas (5.13a)
// ---------------------------------------------------------------------------

/**
 * Estimate Display step — shows the calculated price range with accept/adjust UI.
 *
 * The `stepKind` discriminant distinguishes these new step kinds from the default
 * field step (which has a `fields` array instead).
 *
 * On "Continue": the component dispatches STEP_NEXT to advance to the next step
 * in config order. No explicit `onAcceptGoTo` field is needed.
 * On "Adjust": the component dispatches STEP_GOTO with `onAdjustGoTo` to return
 * the user to a specific prior step where they can change their selections.
 */
export const EstimateDisplayStepSchema = z.strictObject({
  stepKind: z.literal('estimate-display'),
  id: idSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  condition: ConditionSchema.optional(),
  disclaimer: z.string().min(1),
  /** When true the displayed price is shown as a range (£min – £max). Default true. */
  showRangeAsRange: z.boolean().default(true),
  /** Step ID to jump to when the user clicks "Adjust my selections". */
  onAdjustGoTo: idSchema,
});

export type EstimateDisplayStep = z.infer<typeof EstimateDisplayStepSchema>;

/** A selectable option in a VisualCardSelectorStep. */
export const VisualCardOptionSchema = z.strictObject({
  id: idSchema,
  label: z.string().min(1),
  /** Optional URL to an illustration or photo. Placeholder used when absent. */
  imageUrl: z.string().optional(),
  description: z.string().optional(),
});

export type VisualCardOption = z.infer<typeof VisualCardOptionSchema>;

/**
 * Visual Card Selector step — renders service/material choices as visual cards
 * rather than a dropdown or radio group.
 *
 * Stores the selected option `id` (or array of ids when `multiple: true`) in
 * `answers[answerKey]`.
 */
export const VisualCardSelectorStepSchema = z.strictObject({
  stepKind: z.literal('visual-card-selector'),
  id: idSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  condition: ConditionSchema.optional(),
  options: z.array(VisualCardOptionSchema).min(1),
  /** Answer key where the selected option id (or array of ids) is stored. */
  answerKey: idSchema,
  /** When true, multiple cards can be selected simultaneously. Default false. */
  multiple: z.boolean().default(false),
});

export type VisualCardSelectorStep = z.infer<typeof VisualCardSelectorStepSchema>;

/** One size bracket option in a SizeBracketSelectorStep. */
export const SizeBracketSchema = z.strictObject({
  id: idSchema,
  label: z.string().min(1),
  minValue: z.number().nonnegative(),
  maxValue: z.number().positive(),
  unit: z.string().min(1),
  /**
   * Representative numeric value for this bracket used by the pricing engine
   * when the user picks a bracket rather than entering exact dimensions.
   * The SizeBracketSelectorStep component writes this to each exactField's
   * answer key on bracket selection, so computePrice always receives a number.
   */
  typicalValue: z.number().nonnegative().optional(),
});

export type SizeBracket = z.infer<typeof SizeBracketSchema>;

/** One numeric input field within the exact-size mode of a SizeBracketSelectorStep. */
export const ExactFieldSchema = z.strictObject({
  id: idSchema,
  label: z.string().min(1),
  unit: z.string().min(1),
});

export type ExactField = z.infer<typeof ExactFieldSchema>;

/**
 * Size Bracket Selector step — offers pre-set size brackets (Small / Medium / Large)
 * with an "I know the exact size" fallback that reveals numeric input fields.
 *
 * Stores the selected bracket `id` in `answers[answerKey]` (e.g. 'small', 'medium',
 * 'large', or the special value `'exact'` when the user chooses exact entry).
 * When `'exact'` is selected, each `exactField.id` is used as its own answer key
 * for the numeric dimension value (e.g. `answers['length_m'] = 6`).
 */
export const SizeBracketSelectorStepSchema = z.strictObject({
  stepKind: z.literal('size-bracket-selector'),
  id: idSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  condition: ConditionSchema.optional(),
  brackets: z.array(SizeBracketSchema).min(1),
  /** Answer key that stores the selected bracket id or 'exact'. */
  answerKey: idSchema,
  /** Label for the "exact size" toggle option shown below the brackets. */
  exactPromptLabel: z.string().min(1),
  /** Numeric input fields revealed when the user selects exact entry. */
  exactFields: z.array(ExactFieldSchema).min(1),
});

export type SizeBracketSelectorStep = z.infer<typeof SizeBracketSelectorStepSchema>;

/**
 * A wizard step can be a classic field step (Step) or one of the new step kinds.
 *
 * Classic field steps are identified by the presence of a `fields` array.
 * New step kinds carry a `stepKind` discriminant field.
 */
export const AnyStepSchema = z.union([
  StepSchema,
  EstimateDisplayStepSchema,
  VisualCardSelectorStepSchema,
  SizeBracketSelectorStepSchema,
]);

export type AnyStep = z.infer<typeof AnyStepSchema>;

/**
 * Type guard: is this step a classic field step?
 *
 * Classic steps have a `fields` array; new step kinds carry a `stepKind`
 * discriminant instead. Use this guard wherever domain code previously assumed
 * all steps were field steps.
 */
export function isFieldStep(step: AnyStep): step is Step {
  return !('stepKind' in step);
}

// ---------------------------------------------------------------------------

/**
 * The wizard config. `pricingConfigId` references the pricing config that
 * accompanies this wizard (kept as a separate artifact per the schema
 * separation). `schemaVersion` is asserted to 1; bumping it is a deliberate,
 * migrated event (see config/migrations/).
 */
export const WizardConfigSchema = z.strictObject({
  schemaVersion: z.literal(1),
  id: idSchema,
  title: z.string().min(1),
  /**
   * Controls how this wizard computes and presents a quote (ADR-0017).
   *   - 'instant': pricing is computed and shown to the user before submission.
   *   - 'manual': pricing is bypassed; the submission is routed as a quote
   *     request for the contractor to assess and price manually.
   *
   * Optional for backward compatibility. Absent is treated as 'instant'
   * by the runtime (config.wizard.quoteMode ?? 'instant').
   */
  quoteMode: z.enum(['instant', 'manual']).optional(),
  steps: z.array(AnyStepSchema).min(1, 'A wizard must contain at least one step.'),
});

export type WizardConfig = z.infer<typeof WizardConfigSchema>;
