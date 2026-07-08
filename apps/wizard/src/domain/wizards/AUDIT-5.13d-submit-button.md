# Audit C — Existing Submit Button UI (5.13d Phase 0)

**Date:** 2026-07-08
**Purpose:** Document how the submit/continue button is rendered so the Skip and Submit button can be added correctly.

## Source files

- `apps/wizard/src/components/steps/NavigationControls.tsx`
- `apps/wizard/src/components/steps/StepRenderer.tsx`

## NavigationControls

```tsx
interface NavigationControlsProps {
  onBack: () => void;
  onNext: () => void;
  isLast: boolean;
  disabled?: boolean;
}

export function NavigationControls({ onBack, onNext, isLast, disabled = false }): JSX.Element {
  return (
    <div className="mt-6 flex items-center justify-between">
      <Button type="button" variant="secondary" onClick={onBack}>
        Back
      </Button>
      <Button type="submit" variant="primary" onClick={onNext} disabled={disabled}>
        {isLast ? 'Submit' : 'Next'}
      </Button>
    </div>
  );
}
```

Key observations:

- `isLast` controls button label: `'Submit'` (last step) or `'Next'` (other steps)
- Layout: `flex` + `justify-between` — two items align left/right
- Primary action has `type="submit"` so it also fires on form Enter

## StepRenderer

```tsx
function handleNext(): void {
  setShowAllErrors(true);
  if (isLast) {
    dispatch({ type: 'SUBMIT_REQUESTED' });
  } else {
    dispatch({ type: 'STEP_NEXT' });
  }
}
```

Key observations:

- `isLast` controls dispatch: `SUBMIT_REQUESTED` vs `STEP_NEXT`
- `handleNext` always calls `setShowAllErrors(true)` to reveal validation errors before submitting
- `StepRenderer` also calculates `hasMissingPhotos` to disable Submit when photos need re-attaching

## Required changes for Skip and Submit

### `NavigationControls.tsx`

- Add optional `onSkip?: () => void` prop
- When provided, render a third button between Back and Submit:
  ```tsx
  {
    onSkip && (
      <Button type="button" variant="secondary" onClick={onSkip}>
        Skip and Submit
      </Button>
    );
  }
  ```
- Layout with 3 items: `justify-between` naturally places Back (left), Skip (center), Submit (right)

### `StepRenderer.tsx`

- Add `handleSkip` function that dispatches `SUBMIT_REQUESTED` without `setShowAllErrors` (user intends to bypass the step cleanly)
- Pass `onSkip` only when `isLast && step.allowSkip`:
  ```tsx
  onSkip={isLast && step.allowSkip ? handleSkip : undefined}
  ```

### `wizard-config.ts`

- Add `allowSkip: z.boolean().optional()` to `StepSchema`

## Dispatch: SUBMIT_REQUESTED

`SUBMIT_REQUESTED` is handled by the wizard FSM/reducer. It triggers the submission flow regardless of the current step's validation state (previous steps were already validated before the user advanced). Since all optional-details fields have `required: false`, they pass validation with empty values — so Skip (dispatching `SUBMIT_REQUESTED`) and Continue/Submit produce the same submission outcome, just with/without optional-details answers.
