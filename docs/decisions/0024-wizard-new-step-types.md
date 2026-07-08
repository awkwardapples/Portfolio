# ADR-0024: Wizard Engine New Step Types (AnyStep Union)

**Status:** Accepted (Step 5.13a, July 2026)

## Context

The initial wizard engine was built around a single step model (`Step`) whose
`fields` array drives all field rendering, validation, and condition evaluation.
This is adequate for classic data-collection flows but cannot express:

- **Estimate display steps** — show a computed price mid-wizard and let the user
  continue forward or jump back to adjust their answers.
- **Visual card selector steps** — present service/material choices as an image
  card grid rather than a raw select or radio group.
- **Size bracket selector steps** — offer preset size ranges with an exact-entry
  fallback, rather than a free-form number field.

All three patterns are needed for the SCB Handyman flow redesign. They share the
wizard FSM (navigation, conditions, persistence) but have no `fields` array; they
drive their own rendering and answer logic.

## Decision

### AnyStep discriminated union

Introduce an `AnyStep` type in `wizard-config.ts`:

```typescript
export type AnyStep =
  | Step // classic: has `fields`, no `stepKind`
  | EstimateDisplayStep // stepKind: 'estimate-display'
  | VisualCardSelectorStep // stepKind: 'visual-card-selector'
  | SizeBracketSelectorStep; // stepKind: 'size-bracket-selector'
```

`WizardConfig.steps` changes from `Step[]` to `AnyStep[]`. `AnyStepSchema` is a
`z.union` (not `z.discriminatedUnion`) because the classic `StepSchema` uses
`z.strictObject` with no `stepKind` field — it cannot act as a discriminator key.
The union tries `StepSchema` first; if the input has `fields`, it matches.

### `isFieldStep` type guard

```typescript
export function isFieldStep(step: AnyStep): step is Step {
  return !('stepKind' in step);
}
```

All existing engine code that iterates `step.fields` is guarded with `isFieldStep`
before accessing `.fields`. No engine code needs to know about specific new step
kinds — they are inert from the engine's perspective.

### Non-field step semantics

- `validateStep()` returns `{ valid: true, issues: [] }` for any non-field step
  (no fields = no validation errors).
- `buildFieldKeyMap()` skips non-field steps; they contribute no field IDs.
- `getVisibleSteps()` includes non-field steps subject to their `condition`.
- Navigation: forward via `STEP_NEXT`; backward via `STEP_BACK` or `STEP_GOTO`.
  `EstimateDisplayStep` dispatches `STEP_GOTO` for "Adjust" using `onAdjustGoTo`.

### New schemas in `wizard-config.ts` (not separate files)

New schemas (`EstimateDisplayStepSchema`, `VisualCardSelectorStepSchema`,
`SizeBracketSelectorStepSchema`) are placed directly in `wizard-config.ts`.
A separate `domain/steps/*/types.ts` file would need to import `ConditionSchema`
and `idSchema` from `wizard-config.ts`, creating a circular import. Co-locating
in `wizard-config.ts` avoids this with no structural downside.

### Step-kind dispatch in `WizardShell`

`WizardShell.tsx` renders the current step via a narrow dispatch:

```tsx
{isFieldStep(currentStep) ? (
  <StepRenderer … />
) : currentStep.stepKind === 'estimate-display' ? (
  <EstimateDisplayStep … />
) : currentStep.stepKind === 'visual-card-selector' ? (
  <VisualCardSelectorStep … />
) : (
  <SizeBracketSelectorStep … />
)}
```

TypeScript's exhaustive narrowing ensures the union is fully handled. No
separate step-type registry file is needed at this scale.

## Alternatives Considered

### A — Separate file per step kind with re-exports

Rejected. Would require `ConditionSchema` and `idSchema` imported from
`wizard-config.ts`, causing a circular dependency. The co-location in
`wizard-config.ts` is the only import-cycle-free option given the existing
module graph.

### B — Add `stepKind` to the existing `StepSchema`

Rejected. `stepKind` would be optional on `Step`, breaking the discriminator
semantics. Existing field steps have no `stepKind`; presence/absence of the key
is the only reliable discriminant.

### C — Use `z.discriminatedUnion('stepKind', [...])`

Rejected. `StepSchema` (classic field step) has no `stepKind` field, so it
cannot participate in a Zod discriminated union on `stepKind`. `z.union` with
`StepSchema` tried first is correct; it matches on `fields` presence rather
than `stepKind` absence.

### D — Generic `stepType` field + dynamic registry

Rejected for this step. A registry is overkill for three known step kinds with
no plugin surface. The discriminated union is statically typed, exhaustively
checkable, and simpler to audit.

## Consequences

- All code that accesses `step.fields` must pass through `isFieldStep()`. The
  TypeScript compiler enforces this — the compile step will fail if a new
  code path accesses `.fields` on `AnyStep` directly.
- Adding a fourth step kind requires: one new schema/type in `wizard-config.ts`,
  one new component, and one new branch in `WizardShell`. The AnyStep union and
  isFieldStep guard need no changes for non-field kinds.
- Existing configs and all 630 Vitest tests are unaffected. Field-step-only
  configs continue to parse and validate correctly through the new union.
