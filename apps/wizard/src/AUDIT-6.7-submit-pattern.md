# Audit C — Regular Submit Disabled Pattern (Step 6.7)

## Command

```powershell
Get-ChildItem -Path "apps/wizard/src" -Recurse -Include "*.tsx" |
  Select-String "disabled.*turnstile|turnstile.*disabled"
```

**Corrected assumption:** this pattern matches nothing literally — the
disabled expression and the word "turnstile" never appear on the same
line. The real code splits them: `turnstileReady` is computed in one
statement, consumed by name (not literally re-mentioning "turnstile") in
the `disabled` expression three lines later, inside a JSX prop:

```tsx
disabled={hasMissingPhotos || !turnstileReady}
```

Widening the search to `disabled=\{` in `StepRenderer.tsx` and
`NavigationControls.tsx` finds it directly.

## The exact pattern (StepRenderer.tsx)

```tsx
const turnstileConfigured = isLast && config.turnstileSiteKey !== '';
const [turnstileReady, setTurnstileReady] = useState(!turnstileConfigured);
// ...
<NavigationControls
  onBack={handleBack}
  onNext={handleNext}
  isLast={isLast}
  disabled={hasMissingPhotos || !turnstileReady}
  onSkip={isLast && step.allowSkip ? handleSkip : undefined}
/>;
```

`disabled` is a **single combined condition** — it is not "gate on
Turnstile" in isolation; it already also covers `hasMissingPhotos` (Step
5.13e's "photos need re-attaching after a reload" case). Both conditions
exist to block submission, and both apply equally regardless of which
button (Submit or Skip) triggers `SUBMIT_REQUESTED` — a submission with
missing photo data shouldn't be allowed to skip through any more than one
blocked on Turnstile should.

## The pattern to replicate

Rather than duplicating `hasMissingPhotos || !turnstileReady` at a second
call site (which is exactly how a future third submit-triggering control
could reintroduce this same bug), the fix applies **the one existing
`disabled` value already computed for this purpose** to both buttons
inside `NavigationControls`, and reuses the identical boolean as the
defensive handler-level check in `handleSkip`. See
`AUDIT-6.7-skip-and-submit.md` for the code location and
`docs/decisions/0038-skip-and-submit-turnstile-gating.md` for why a single
shared value (not two independently-maintained ones) is the actual fix,
not just the convenient one.
