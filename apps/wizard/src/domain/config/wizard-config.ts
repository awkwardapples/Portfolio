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
});

export type Step = z.infer<typeof StepSchema>;

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
  steps: z.array(StepSchema).min(1, 'A wizard must contain at least one step.'),
});

export type WizardConfig = z.infer<typeof WizardConfigSchema>;
