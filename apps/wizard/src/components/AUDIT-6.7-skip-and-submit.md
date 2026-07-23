# Audit A — Skip and Submit Button Location (Step 6.7)

## Command

```powershell
Get-ChildItem -Path "apps/wizard/src" -Recurse -Include "*.tsx","*.ts" |
  Select-String "Skip and Submit|skip.and.submit|skipAndSubmit" -List
```

## Result

Two files, not one — the button's rendering and its click handler live in
different components:

- `src/components/steps/NavigationControls.tsx` — renders the button
  itself.
- `src/components/steps/StepRenderer.tsx` — defines `handleSkip()` (the
  click handler) and decides whether to pass it down at all.

**Corrected assumption:** the spec's Architecture Overview describes "the
Skip and Submit button component" as a single file to modify. There is no
dedicated `SkipAndSubmitButton` component — it's one of three `<Button>`
elements rendered inline by the shared `NavigationControls` component,
which every wizard step (not just Optional Details) renders.

## Component structure

`NavigationControls.tsx` (full file, pre-fix):

```tsx
interface NavigationControlsProps {
  onBack: () => void;
  onNext: () => void;
  isLast: boolean;
  disabled?: boolean;
  onSkip?: () => void;
}

export function NavigationControls({
  onBack,
  onNext,
  isLast,
  disabled = false,
  onSkip,
}: NavigationControlsProps): JSX.Element {
  return (
    <div className="mt-6 flex items-center justify-between">
      <Button type="button" variant="secondary" onClick={onBack}>
        Back
      </Button>
      {onSkip && (
        <Button type="button" variant="secondary" onClick={onSkip}>
          Skip and Submit
        </Button>
      )}
      <Button type="submit" variant="primary" onClick={onNext} disabled={disabled}>
        {isLast ? 'Submit' : 'Next'}
      </Button>
    </div>
  );
}
```

**This is the bug, in one line:** the `disabled` prop is wired to the
primary button (`onNext`) only. The Skip button, when `onSkip` is
provided, renders with no `disabled` attribute at all — it is always
clickable regardless of `disabled`'s value.

## Current handler function

`StepRenderer.tsx`:

```tsx
function handleSkip(): void {
  dispatch({ type: 'SUBMIT_REQUESTED' });
}
```

```tsx
<NavigationControls
  onBack={handleBack}
  onNext={handleNext}
  isLast={isLast}
  disabled={hasMissingPhotos || !turnstileReady}
  onSkip={isLast && step.allowSkip ? handleSkip : undefined}
/>
```

`handleSkip` dispatches the exact same `SUBMIT_REQUESTED` action as the
regular Submit path's `handleNext` — the two buttons are two different
entry points into the identical submission flow, which is precisely why
they need identical gating.

## Current disabled state logic (if any)

**None**, for the Skip button specifically. `disabled` is computed once in
`StepRenderer` (`hasMissingPhotos || !turnstileReady`) and passed to
`NavigationControls`, but `NavigationControls` only applies it to the
`onNext` button's `disabled` prop — the Skip button ignores it entirely.
This is the exact bypass Step 6.7 fixes.

## Where Skip and Submit is reachable

`onSkip` is only passed when `isLast && step.allowSkip`. Per
`AUDIT-5.13d-submit-button.md`/`ADR-0025`, `allowSkip: true` is set on
every instant-quote service's `optional-details` step (the step
immediately after `contact-and-address`) — so this bug is reachable on
all 7 instant-quote wizards, not a single service.
