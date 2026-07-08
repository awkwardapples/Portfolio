# Audit A — Step Type Registration Mechanism (5.13a)

## Scope

Locate and document how the wizard engine currently registers and dispatches step types.

## Findings

### Current architecture

There is no "step type" concept at the step level in the current codebase. All steps
share an identical shape (`StepSchema`) defined in `wizard-config.ts`:

```typescript
export const StepSchema = z.strictObject({
  id, title, description?, fields: z.array(FieldSchema).min(1), condition?
});
```

Type discrimination happens at the **field level**, not the step level:

- `FIELD_TYPES` in `domain/config/field-types.ts` — canonical array of field type strings
- `fieldRegistry` in `components/steps/field-registry.tsx` — maps `FieldType → FieldRenderer`
- `StepRenderer` iterates `step.fields` and calls `<FieldRenderer field={f} ...>` for each
- `WizardShell` always renders the current step via `<StepRenderer step={currentStep} ...>`

There is no step-level dispatch: every step renders via `StepRenderer` regardless of content.

### Extension pattern (per inline comment in field-types.ts)

The canonical comment says: "Adding a new field type requires: (1) adding it to `FIELD_TYPES`,
(2) implementing a renderer, (3) registering it here."

### Validation

`validateStep(step, answers, fieldKeyById)` in `answer-validation.ts` iterates `step.fields`
for each visible step. It accepts `Step` (field step only).

### buildFieldKeyMap

`buildFieldKeyMap(config)` in `condition-evaluator.ts` iterates `config.steps` and then
`step.fields` for each. Assumes all steps have a `fields` array.

## Impact on 5.13a

### What must change

1. **`wizard-config.ts`** — Add new step schemas (`EstimateDisplayStep`,
   `VisualCardSelectorStep`, `SizeBracketSelectorStep`), each with a `stepKind` discriminant.
   Create `AnyStep = Step | EstimateDisplayStep | VisualCardSelectorStep | SizeBracketSelectorStep`
   union. Export `isFieldStep(step: AnyStep): step is Step` type guard. Update
   `WizardConfigSchema.steps` to `z.array(AnyStepSchema)`.

2. **`condition-evaluator.ts`** — `buildFieldKeyMap` must skip non-field steps (`!isFieldStep(step)`).

3. **`answer-validation.ts`** — `validateStep` must accept `AnyStep`; non-field steps return
   trivially valid snapshot (no fields = no errors).

4. **`navigation.ts`** — `isStepVisible`, `getVisibleSteps`, `getNextStepId` must accept
   `AnyStep` (all step types have `id` and optional `condition`).

5. **`WizardShell.tsx`** — Add step-level dispatch: check `isFieldStep` (or `step.stepKind`)
   and render the appropriate component. A new `step-type-registry.ts` in the components layer
   maps `stepKind` strings to renderer functions.

### Implementation note — schema location

The spec proposes `src/domain/steps/*/types.ts` for new step schemas. This is not used
directly because the new step schemas must import `ConditionSchema` and `idSchema` from
`wizard-config.ts`, which would create a circular import (wizard-config imports step types,
step types import from wizard-config). Instead, all new schemas are added directly to
`wizard-config.ts`, following the existing pattern for `StepSchema`, `FieldSchema`, etc.

### What does NOT change

- `FIELD_TYPES` and `fieldRegistry` — existing field types are unchanged
- `StepRenderer` — unchanged; only used for field steps
- All 11 service configs — no new step types applied until 5.13b
- The FSM event set — `STEP_NEXT`, `STEP_BACK`, `STEP_GOTO` are sufficient;
  "Continue" dispatches `STEP_NEXT`, "Adjust" dispatches `STEP_GOTO`
