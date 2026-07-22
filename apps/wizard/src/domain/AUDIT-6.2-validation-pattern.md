# Audit 6.2-C: Continue Button Validation Pattern

_Compiled: 2026-07-22_

## Critical finding: there is no "Continue button disabled until answered" mechanism

The spec assumes required fields disable the Continue/Next button directly.
That is **not** how this codebase gates mandatory fields. Reading
`components/steps/StepRenderer.tsx` and `components/steps/NavigationControls.tsx`:

- `NavigationControls`'s `disabled` prop is wired to exactly two things —
  `hasMissingPhotos` (a photo re-attach-required guard) and `!turnstileReady`
  (bot-protection token gating on the final step). **Required-field
  validity is never part of that `disabled` expression.** The Next/Submit
  button is always clickable.
- Clicking Next calls `handleNext()`, which sets `showAllErrors(true)` and
  dispatches `STEP_NEXT` (or `SUBMIT_REQUESTED` on the last step) — it does
  not check validity itself before dispatching.

The actual gate lives one layer down, in the **FSM transition**, not the
button:

- `transition.ts`'s `handleStepNext()` calls `validateStep(currentStep,
state.answers, fieldKeyById)`. If the snapshot is invalid, the state's
  `currentStepId` is **not** advanced — the reducer returns
  `{ ...state, phase: 'answering', validationByStep }` with the same
  `currentStepId`, just a fresh error snapshot.
- `StepRenderer` reads that snapshot back out via `getError(fieldKey)` and,
  because `showAllErrors` is now `true`, displays every field's error
  message (`RadioGroupField`'s `error` prop → `ValidationMessage`) even for
  fields the user never blurred.

Net effect for the user is functionally equivalent to "Continue disabled
until answered" — clicking Next with an empty required field does nothing
except reveal inline errors and keeps them on the same step — but it is
implemented as **a blocked state transition plus inline errors**, not a
disabled DOM attribute. This is generic engine behavior; it needs no
mandatory-step-specific test (see below), just field-level `required: true`
on the new fields.

## Is it automatic based on the required field flag?

Yes. `validateField()` (`domain/runtime/answer-validation.ts:28-30`):

```ts
if (field.required && isEmpty(answer)) {
  return 'This field is required.';
}
```

is genuinely automatic — no per-step opt-in, no extra config beyond setting
`required: true` on each of the three new fields. This is exactly the same
mechanism already gating `contact-and-address`'s required fields and every
other mandatory field in the codebase; nothing new needs wiring for the
6.2 step.

## Is it explicit configuration?

Only to the extent that `required: true` must be set per field — there is
no step-level "all fields mandatory" flag. Each of `terrain`,
`post_material`, and `gravel_boards` needs its own `required: true`.

## How does the wizard engine handle validation state?

`state.validationByStep: Record<stepId, StepValidationSnapshot>`, written by
either `VALIDATE_STEP` (on field blur, from `StepRenderer.handleBlur`) or as
a side effect of `STEP_NEXT`/`SUBMIT_REQUESTED`. `validateStep()` iterates
the step's visible fields, skips condition-hidden ones, and calls
`validateField()` per field; the snapshot's `valid` flag is
`issues.length === 0`. This is pre-existing, generic engine machinery
(`domain/runtime/transition.ts`, `domain/runtime/answer-validation.ts`) —
already covered by `domain/runtime/__tests__/transition.test.ts`'s generic
synthetic-config tests (`stays on current step when current step is
invalid`, etc.). 6.2 does not need to duplicate engine-level tests; it only
needs config-level tests confirming the three fields exist with
`required: true` and options that match the field's declared `type`, plus
one test exercising `validateStep()` directly against the real
`fencingWizardConfig`'s new step to prove the specific field set behaves as
expected (empty → 3 issues; fully answered → valid).

## Submission payload

`WizardStore.ts`'s `buildRequest()` sets `answers: state.answers` — the
**entire** answers map, unfiltered, with no per-field allowlist. Any field
key present in `state.answers` (regardless of which step it came from)
is automatically included in the submission payload once answered; no
plumbing changes are needed for `terrain`/`post_material`/`gravel_boards`
to reach the payload beyond adding them as fields with those `key`s.
