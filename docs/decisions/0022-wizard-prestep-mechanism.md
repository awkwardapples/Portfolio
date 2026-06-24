# ADR-0022: Wizard Pre-Step Mechanism

**Status:** Accepted (Step 5.9-Remediation, June 2026)

## Context

Operational verification of Step 5.9 (OV-5.9-R3) identified that the wizard collects contact
details (name, postcode, phone, email) inside individual service steps, but does so after
service-specific questions. This order is suboptimal: the user describes their job, then is asked
for contact details at the end — losing partial answers if they abandon early.

The fix must:

1. Collect contact details **before** any service-specific step on every wizard.
2. **Not require changes to the 11 existing service config files** — each is a `z.strictObject`
   validated artifact; modifying them en-masse is risky and introduces merge churn.
3. **Not add new field types** — `FieldSchema` uses strict Zod validation; unknown keys fail.
   Contact fields must stay `type: 'text'` and use `FORMAT_VALIDATORS` for format checking.
4. Re-use existing answer keys (`contact_name`, `postcode`, `contact_phone`, `contact_email`)
   so that answers entered in the pre-step auto-fill the matching fields in service steps.

## Decision

### SessionConfig.preSteps

Add an optional `preSteps?: readonly Step[]` field to `SessionConfig` (not to `WizardConfig`).

`SessionConfig` is the runtime composition layer and is never persisted in `WizardState`; it is
the correct place for cross-cutting engine concerns that apply to every wizard session.

`WizardConfig` (the per-service authoring artifact) is intentionally unmodified. It stays a pure
description of service-specific steps only.

### getMergedWizard(config: SessionConfig): WizardConfig

A single helper in `transition.ts`, exported for use by rendering code:

```typescript
export function getMergedWizard(config: SessionConfig): WizardConfig {
  if (!config.preSteps || config.preSteps.length === 0) return config.wizard;
  return { ...config.wizard, steps: [...config.preSteps, ...config.wizard.steps] };
}
```

Called once at the top of `transition()` to produce an `effectiveConfig`; all event handlers
operate on this merged view. `WizardShell.tsx` calls it to build `fieldKeyById` and
`visibleSteps`.

### addressPreStep

A static `Step` object in `domain/wizards/address-prestep.ts`. Fields:

| id               | key           | type | label         | Format validator |
| ---------------- | ------------- | ---- | ------------- | ---------------- |
| prestep-name     | contact_name  | text | Your name     | —                |
| prestep-postcode | postcode      | text | Your postcode | validatePostcode |
| prestep-phone    | contact_phone | text | Phone number  | validatePhone    |
| prestep-email    | contact_email | text | Email address | validateEmail    |

All four fields are `required: true`. Format validators are applied by `FORMAT_VALIDATORS` in
`answer-validation.ts` (ADR-0022 companion to Commit R4); no `FieldSchema` changes.

### QuotePage wiring

`QuotePage.tsx` passes `preSteps: [addressPreStep]` in the `SessionConfig` for both the
normal service path and the fallback wizard path.

### Key sharing for auto-fill

The pre-step field keys match the keys used in existing service contact/address steps. Because
`WizardState.answers` is keyed by `field.key`, any answer collected in the pre-step is
immediately available to the service step that uses the same key. The user sees those fields
already filled when they reach the service's contact step — no duplicate data entry.

## Alternatives Considered

### A — Add preSteps to WizardConfig

Rejected. `WizardConfig` is the service authoring artifact validated with `z.strictObject`.
Adding a new field there requires updating all 11 existing configs and the schema simultaneously.
The `SessionConfig` layer exists precisely for runtime composition.

### B — Duplicate contact fields into a separate fixed-position step per service config

Rejected. Eleven configs would need editing in lock-step, and there would be no shared
validation. A single engine-level injection is DRY and lower risk.

### C — Change field type to 'tel' / 'email'

Rejected. `FIELD_TYPES` is the canonical registry; adding new types affects the renderer,
schema validation, and all existing tests. Format validation via `FORMAT_VALIDATORS` achieves
the same UX goal without touching the type system.

## Consequences

- Every wizard session starts with the `contact-and-address` pre-step.
- Service configs remain unchanged. New services added in future need not include contact
  collection steps (they may still keep them for display — auto-fill will populate them).
- `getMergedWizard` is the single merge point; `buildFieldKeyMap` and `getVisibleSteps` both
  operate on the merged config, so condition evaluation and progress indicators are correct.
- Pre-step answers are persisted by `sessionStorageAdapter` like any other answer.
