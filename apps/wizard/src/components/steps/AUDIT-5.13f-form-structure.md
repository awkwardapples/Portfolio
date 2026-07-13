# Audit C — Wizard Form Rendering Structure (5.13f)

_Performed: 2026-07-13_

## Path drift from the spec

The spec referenced `apps/wizard/src/domain/steps/multi-field-form/component.tsx`.
Neither `domain/steps/` nor a `multi-field-form` directory exists. Field-step rendering
lives at `apps/wizard/src/components/steps/StepRenderer.tsx`, with the button row in
`apps/wizard/src/components/steps/NavigationControls.tsx`. This audit is filed at the
real location.

## Current form structure

`StepRenderer.tsx` renders one `<form>` per step (`noValidate`, submit handled via
`onSubmit` → `handleNext()`), containing:

- `step.fields.map(...)` → `<FieldRenderer>` per field
- `<NavigationControls onBack onNext isLast disabled onSkip>`

`handleNext()` dispatches `STEP_NEXT` for non-last steps, or `SUBMIT_REQUESTED` when
`isLast`. `handleSkip()` (only wired when `isLast && step.allowSkip`, per ADR-0025)
also dispatches `SUBMIT_REQUESTED`.

**Submission is not triggered by a form-level submit handler that owns the request** —
`SUBMIT_REQUESTED` transitions the FSM (`WizardStore.dispatch`) into `submitting`, and
`WizardStore.runSubmission()` builds the request from `state` + `config` and calls
`submission.submit(request)` automatically (`WizardStore.ts:81-93`). There is no
`handleSubmit` callback to intercept in the component tree, unlike the spec's assumed
`<button onClick={handleSubmit}>` pattern.

## Which step is always the final one

Every wizard config (5.13c/5.13d) ends with a plain field step — `optional-details` for
the 7 instant-quote services, `contact-and-address`/`address` for manual-quote services
— never `estimate-display`, `visual-card-selector`, or `size-bracket-selector`
(confirmed: `general-repairs.config.ts`'s last step has no `stepKind`, meaning it's a
default field step). `WizardShell.tsx` only routes `isFieldStep(currentStep)` steps
through `StepRenderer`; the other three step-kind components
(`EstimateDisplayStep`/`VisualCardSelectorStep`/`SizeBracketSelectorStep`) are never
rendered as the last step in any current config. **Consequence:** Turnstile-gating logic
only needs to live in `StepRenderer`/`NavigationControls` — the other three step
components do not need bot-protection wiring.

## Where photo data flows at submission time (the pattern to replicate)

Step 4.8 established the exact pattern this step should follow for both the honeypot
value and the Turnstile token:

- `PhotoStore` (`runtime/photos-store.ts`) — a small volatile, non-persisted class
  living in a `useMemo`/ref, keyed off `fileId`, holding base64 that must never enter
  FSM state (comment: "The FSM state holds PhotoMetadata only — base64 bytes live in
  the PhotoStore (volatile, not persisted)").
- `createPhotoEnrichedPort(base, store)` (`runtime/submission-media.ts`) — wraps the
  `SubmissionPort`, intercepting the outgoing `SubmissionRequest` and merging in data
  from the store immediately before the real port is called.
- `QuotePage.tsx` composes `createPhotoEnrichedPort(baseSubmissionPort, photoStore)`
  once per wizard mount and passes both the composed port and the store down.

**Deviation from spec:** rather than threading `honeypotValue`/`turnstileToken` through
`WizardState` (the FSM) as the spec's pseudo-code implies, this step introduces a
`BotProtectionStore` and `createBotProtectionEnrichedPort` mirroring `PhotoStore` /
`createPhotoEnrichedPort` exactly. Reasons: (1) `WizardStore`'s own comment block
explicitly excludes anything but wizard-answer state ("EXPLICITLY NOT HERE: No business
logic... All of that lives in the domain layer" — bot-protection metadata is not wizard
domain data); (2) the honeypot value and Turnstile token must never be written to
`sessionStorage` via the existing persistence adapter, which currently persists
`state.answers` wholesale — keeping them out of `WizardState` guarantees they can't leak
into persisted drafts; (3) it requires zero changes to `WizardStore.ts`,
`transition.ts`, or any FSM type, matching the "no business logic in the store" rule
literally.

## Where the honeypot input must be mounted

Not inside `StepRenderer` (keyed by `step.id`; a fresh honeypot input would remount —
and reset — on every step change, discarding whatever a bot wrote into it before the
final step is even reached). It must live somewhere that stays mounted for the whole
wizard session: `WizardShell.tsx`'s `<main>` (unkeyed across step transitions) is the
right spot — mounted once when the wizard enters `answering`, unmounted only on
success/failure screens.

## Where the Turnstile widget must be mounted

Inside `StepRenderer`, gated on `isLast` — the widget should only render (and start
consuming its ~5-minute token lifetime) once the user has reached the final step, not
on wizard mount. This matches the spec's own placement intent, just relocated to the
real final-step component.

## Config plumbing for the Turnstile site key

`config-loader.ts` → `apps/wizard/src/config-loader.ts` reads `window.GOQW_CONFIG`
(validated against `PublicConfigSchema` in `domain/config/public-config.ts`) and exports
a frozen `config` object already consumed by `QuotePage.tsx`
(`config.restUrl`, `config.restNonce`, etc.). `turnstileSiteKey` must be added as an
**optional** string field (like `enabledServiceIds`) to `PublicConfigSchema`,
`GoqwPublicConfig` (`types/global.d.ts`), `DEFAULT_CONFIG`, and the PHP
`PublicConfig::build()` allowlist (Audit B) — the same four-file chain every existing
`PublicConfig` field already follows.
