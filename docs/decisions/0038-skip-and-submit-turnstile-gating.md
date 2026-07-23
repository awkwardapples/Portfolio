# ADR-0038: Skip and Submit Turnstile Gating

**Status:** Accepted (Step 6.7, 2026-07-23)

## Context

Step 5.13d introduced the "Skip and Submit" button on the Optional
Details step (ADR-0025) as a UX affordance — users who don't want to fill
in optional fields can submit directly. Step 5.13f (ADR-0027) later added
Cloudflare Turnstile as the third layer of bot protection, gating the
regular Submit button on a `turnstileReady` boolean until a token is
issued.

Phase 0 audits for this step (`AUDIT-6.7-skip-and-submit.md`,
`AUDIT-6.7-turnstile-state.md`, `AUDIT-6.7-submit-pattern.md`) confirmed
a real security bypass: `NavigationControls` (the shared component
rendering Back/Skip/Submit) only wired its `disabled` prop to the primary
Submit button. The Skip and Submit button — which dispatches the
identical `SUBMIT_REQUESTED` action — rendered with no disabled state at
all, on every instant-quote service that has an `optional-details` step
(all 7). A submission could go through via Skip without ever completing
Turnstile verification, defeating Step 5.13f's third protection layer
entirely on that path.

Two of the spec's assumptions did not match the real code and are
recorded here rather than silently worked around:

1. **There is no `turnstileToken` state shared between submit paths.**
   That name belongs exclusively to `BotProtectionStore`'s internal
   field, used to build the outbound submission payload — a plain,
   non-reactive class, not UI state. The actual UI gate is a separate,
   local `turnstileReady` boolean in `StepRenderer`, derived from
   `TurnstileWidget`'s `onTokenChange` callback. `handleSkip` already had
   closure access to it — the bug was never a state-access problem.
2. **There is no `isSubmitting` boolean gating either button.**
   `WizardShell` swaps to an entirely different view once the wizard's
   FSM phase becomes `'submitting'`, unmounting `StepRenderer` (and
   therefore both buttons) for the duration of the actual submission —
   so no such condition exists to add. The disabled state that does
   exist, `hasMissingPhotos || !turnstileReady`, was already a _combined_
   condition (Step 5.13e's photo-reattachment case plus Turnstile), not
   Turnstile in isolation.

A third deviation is architectural, not a factual correction: this
codebase's Vitest config runs in the `node` environment with no DOM
(`vitest.config.ts`), and no component in `src/components/` has ever had
a render-based test — `TurnstileWidget.tsx`'s own docblock states this
explicitly as the established convention, component behavior being
verified operationally instead. The spec's test plan assumed ~8
component-level tests asserting a rendered button's `disabled` attribute;
that's not achievable in this codebase as it stands.

## Decision

Rather than duplicate `hasMissingPhotos || !turnstileReady` at a second
call site — which is exactly the shape of bug that created this gap in
the first place — extract it to one pure function,
`isSubmissionBlocked({ hasMissingPhotos, turnstileReady })`, in
`components/steps/submission-gate.ts`. Both submit-triggering paths now
read the same value:

- `NavigationControls` applies its single `disabled` prop to **both** the
  Skip button and the primary button (previously only the primary).
- `StepRenderer`'s `handleSkip` gains a defensive
  `if (isSubmissionBlocked(...)) return;` guard before dispatching —
  belt-and-braces against a DOM-manipulated click bypassing the
  `disabled` attribute, the same protection the primary path has always
  implicitly relied on via the disabled attribute alone.

Being a plain, framework-free function (not a component) makes
`isSubmissionBlocked` directly unit-testable in this codebase's
`node`-environment Vitest setup, despite the lack of component-rendering
infrastructure — 4 tests cover its full 2×2 truth table. Handler-level
coverage of `handleSkip`'s guard is provided by testing the same
function it calls, not a separate component-rendering test, consistent
with how every other component in this tree is verified.

The regular Submit button/`handleNext` are deliberately left unchanged —
in scope for this step is closing the Skip bypass, not adding a matching
defensive check to the already-correctly-gated primary path. That
asymmetry (only Skip has a handler-level guard) is a known, deliberate
scope boundary, not an oversight.

## Consequences

**Positive:**

- The bypass is closed: Skip and Submit now respects Turnstile readiness
  and the missing-photos gate identically to regular Submit, on all 7
  affected wizards.
- A future third submit-triggering control inherits the same gate for
  free by reusing `isSubmissionBlocked`, rather than needing its author
  to remember to replicate an inline boolean expression correctly.
- The Skip button's original UX affordance (bypass optional fields, not
  bypass verification) is fully preserved — it becomes clickable exactly
  when regular Submit does.

**Negative:**

- None beyond the intended one: a user must now wait for Turnstile
  before Skip and Submit becomes clickable, matching the wait already
  present on regular Submit (this is the fix, not a side effect).

**Accepted trade-off:**

- `handleNext` (regular Submit) has no handler-level defensive check,
  only the `disabled` attribute — unchanged from before this step, and
  explicitly out of scope. A determined DOM-manipulated bypass of the
  primary button remains no more or less possible than it was
  pre-6.7.

## Cross-references

- ADR-0025 (Optional Details Step + Skip and Submit, Step 5.13d)
- ADR-0027 (Bot protection with Turnstile, Step 5.13f)
- ADR-0037 (Step 6.6 security posture — the audit trail this step
  continues)
