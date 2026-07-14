# Audit C — Consent Integration Point in Client (5.14)

Date: 2026-07-14
Step: 5.14 Phase 0 Audit C

## Files examined

`apps/wizard/src/domain/config/wizard-config.ts`, `apps/wizard/src/domain/config/field-types.ts`,
`apps/wizard/src/domain/runtime/answer-validation.ts`, `apps/wizard/src/components/steps/field-registry.tsx`,
`apps/wizard/src/components/steps/fields/CheckboxGroupField.tsx`, `apps/wizard/src/components/steps/StepRenderer.tsx`,
`apps/wizard/src/components/composites/StepCard.tsx`, all 11 `apps/wizard/src/domain/fixtures/*.config.ts`,
`AUDIT-5.13d-final-step.md`, `AUDIT-5.13d-submit-button.md`, `AUDIT-5.13c-contact-collection.md`.

Note: the spec asks for this file at `apps/wizard/src/domain/steps/AUDIT-5.14-consent-integration.md`;
there is no `domain/steps/` directory. Saved at `apps/wizard/src/domain/wizards/`, matching where the
5.13c/5.13d audits it references already live.

## Correcting the spec's central assumption

Undocumented Assumption Check #1 states the consent checkbox belongs on the `optional-details`
step added in 5.13d. This is wrong, and not a minor detail: `optional-details` is deliberately the
**one step in the entire wizard designed to be skippable**. Every field on it is `required: false`
(enforced by `AUDIT-5.13d-*` and the per-service validation test suites), and it renders a "Skip
and Submit" button (`allowSkip: true`) whose handler (`StepRenderer.handleSkip`) dispatches
`SUBMIT_REQUESTED` without ever calling `setShowAllErrors(true)` — i.e. it is explicitly built to
let a user submit having answered nothing on that step at all. Putting a mandatory consent gate on
the one step engineered to be freely skippable would make the gate not actually enforce anything
client-side.

## The wizard engine already has everything needed — no new component

Two existing mechanisms compose to make this a config-only change:

1. **`checkbox` is already a supported field type** (`FIELD_TYPES` in `field-types.ts`), already
   used today (e.g. `fencing.config.ts`'s `include_gate`, `remove_old` fields in the `extras`
   step), with a generic renderer (`CheckboxGroupField.tsx`) already registered in
   `field-registry.tsx`. A checkbox field's answer is an array of selected option values (not a
   plain boolean) — `current.includes(opt.value)` per option — so a single-option consent checkbox
   stores `['agreed']` when checked, `[]` (or absent) when not.
2. **Required-field validation is already generic and already blocks submission.**
   `validateField()` in `answer-validation.ts` treats `field.required && isEmpty(answer)` as an
   error for every field type uniformly, and `isEmpty()` treats `[]` as empty. `StepRenderer`'s
   `handleNext()` calls `setShowAllErrors(true)` before dispatching `SUBMIT_REQUESTED` on the last
   step, which surfaces this exact validation error. This is the same mechanism that already
   blocks submission when `contact_email` is empty — no consent-specific client logic is needed at
   all.

Consequence: the spec's §4.8 (a bespoke React component with local `useState`, a hand-rolled
`disabled={!consentGiven || ...}` submit gate, and a second "Skip and Submit" button variant) is
unnecessary. Adding one `required: true` `checkbox` field to a wizard config is sufficient, and is
the same authoring surface every other required field already uses.

## Where the field goes: the last _mandatory_ step, per wizard shape

Two wizard shapes exist (`AUDIT-5.13d-final-step.md`, `AUDIT-5.13c-contact-collection.md`):

- **7 instant-quote services** (fencing, decking, painting, patio, driveway, steps, jetwash):
  `... → contact-and-address → optional-details`. The consent field goes on
  `contact-and-address` (the last step with `required: true` fields; `optional-details` is after
  it and skippable).
- **4 manual-quote services** (general-repairs, plumbing, electrical, carpentry): `... → contact →
address`. These have no `optional-details` step at all. The consent field goes on `address` (the
  literal last step in every one of these four configs).

All 11 configs get one new field; no config gets a new step.

## No inline hyperlink capability in field labels — a real, bounded constraint

`FieldSchema.label` and `.help` are plain `z.string()` values (`wizard-config.ts`), rendered as
plain text (`CheckboxGroupField.tsx` renders `{opt.label}` and `{field.help}` inside `<span>`/`<p>`,
no HTML). `StepCard`'s `description` prop is equally plain-text-only. There is no rich-text or
hyperlink-capable field/description anywhere in the wizard's rendering layer today — this is a
deliberate architectural rule ("No presentation" binding rule, `wizard-config.ts` header comment),
not an oversight, so adding one exclusively for this field would break that invariant for a single
field type.

The consent checkbox's label therefore references the Privacy Policy in plain text
(non-clickable). This is a bounded, acceptable gap: `SiteShell` wraps every route — including
`/quote`, where the wizard is mounted — in a persistent `Header` + `Footer`, and the footer's
"Privacy Policy" link (`footer-content.ts`'s `legalLinks`, see `AUDIT-5.14-page-creation.md`) is
visible on the same page as the consent checkbox throughout the entire wizard flow. The full policy
is one click away at all times, not buried behind navigation the user has to go find.

## Server-side enforcement remains necessary regardless

Client-side `required: true` is UX only. `SubmissionController::validate()` performs no field-level
required-ness checks today (it only checks payload shape: `contractVersion`, `quoteMode`,
`wizard_id`, `answers` is an array) — there is no generic mechanism that would reject a crafted
payload with `data_processing_consent` omitted. This is exactly why the spec's `ConsentValidator`
(server-side, D9) is still needed and is not made redundant by the client-side field addition — see
`AUDIT-5.14-consent-storage.md`.
