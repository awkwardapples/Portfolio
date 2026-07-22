# ADR-0034: Fencing Mandatory Post-Estimate Questions

**Status:** Accepted (Step 6.2, 2026-07-22)

## Context

The fencing wizard's instant estimate is based on size, fence type, height,
and extras (gate/removal). Three additional details are consistently
needed by the business owner to prepare an accurate final quote, but they
have no pricing impact and don't belong in the priced estimate itself:

1. **Terrain** — affects installation difficulty and labour time.
2. **Post material** (concrete vs. timber) — affects materials and technique.
3. **Gravel boards** — a common addition affecting the materials list.

Per the spec's own Pre-Spec Discipline notes, Phase 0 audits were required
before implementation, learning from 6.1's precedent that the spec's
assumed file layout and mechanisms don't always match this codebase. Three
assumptions in the spec turned out to be wrong (see `AUDIT-6.2-fencing-
structure.md`, `AUDIT-6.2-step-type.md`, `AUDIT-6.2-validation-pattern.md`):

- There is no `multi-field-form` step type/discriminant. The classic
  `Step`/`fields[]` type (used already by `extras`, `contact-and-address`,
  `optional-details`) is a strict object and would reject an unrecognized
  `type` key outright.
- `FieldSchema` has no per-option `helperText` and no per-field
  `description` — only a single field-level `help` string, identical to
  every other field's help mechanism in this codebase.
- There is no "Continue button disabled until answered" DOM state. Required
  fields are enforced by `validateStep()` blocking the `STEP_NEXT`
  transition (the FSM simply doesn't advance `currentStepId` when the
  current step is invalid), with inline errors surfaced afterward — a
  different mechanism that produces the same practical result.

There was also a step-order ambiguity: the spec's own illustrative array
put `extras` before `estimate-display`, which is backwards from the real
config (`estimate` comes before `extras`). The spec's stated _rationale_
("after estimate... before photos... keeps commercially-relevant info
together") was used to resolve placement instead of the array, since
`extras` already sits between `estimate` and `site_photos` and is itself
commercially relevant.

## Decision

Insert a new classic field step, `fencing-details`, between `extras` and
`site_photos`:

```
fence_size → fence_type_step → fence_height_step → estimate → extras
  → fencing-details (NEW) → site_photos → contact-and-address → optional-details
```

Three fields, all `type: 'radio'`, all `required: true`:

- `terrain` — `soft` / `hard` / `concrete`, with the explanatory nuance the
  spec wanted per-option folded directly into each option's `label`
  (e.g. `'Soft — standard soil, easy to dig'`) rather than a new schema
  field, since `optionSchema` has no `helperText` slot.
- `post_material` — `concrete` / `timber`, same per-option-label pattern.
- `gravel_boards` — `yes` / `no`, with the longer explanation on the
  field's existing `help` string (no per-option nuance needed for a plain
  yes/no).

No pricing wiring: none of the three fields appear in
`fencingPricingConfig`. `WizardStore.buildRequest()` already spreads the
entire `state.answers` map into the submission payload unfiltered, so no
additional plumbing was needed for these answers to reach the wire
payload once answered.

## Consequences

**Positive:**

- Business owner gets terrain/post-material/gravel-board data for every
  fencing quote without touching pricing.
- No new step kind, no schema change — the addition is a pure config/data
  change using entirely pre-existing mechanisms (`radio` field type,
  `help` string, classic field step).
- Required-field enforcement is automatic (`required: true` + the existing
  generic `validateStep()`/`STEP_NEXT` gate) — no new validation code.

**Negative:**

- Adds one more step to the fencing flow between estimate and photos.
- Per-option label text is a little longer than a plain option label
  ("Concrete — more durable, longer lifespan (recommended for exposed
  areas)" vs. just "Concrete").

**Neutral:**

- No pricing calculation changes; wizard engine unchanged.
- Only `fencing.config.ts` is touched — no other wizard is affected.

## Deviations from the spec

- **Step placement resolved by rationale, not the spec's array**, which
  had `extras` before `estimate-display` — the reverse of the actual
  config order. See `AUDIT-6.2-fencing-structure.md`.
- **No `multi-field-form` step type introduced.** The classic `Step`
  schema already covers this; adding a `type` discriminant to it would
  fail strict-object validation. See `AUDIT-6.2-step-type.md`.
- **No per-option `helperText` or per-field `description` schema
  addition.** Folded into existing `label`/`help` mechanisms instead —
  consistent with 6.1's precedent of adapting to the existing schema
  rather than extending it for copy-only changes. See
  `AUDIT-6.2-fencing-structure.md`.
- **No `continueLabel` field** — `NavigationControls` hardcodes
  "Next"/"Submit" based on step position; there is no per-step button-label
  override anywhere in the codebase, and `StepSchema` has no such key.
  Dropped from the config; the button reads "Next" like every other
  non-final step.
- **Test plan reframed around the real validation mechanism.** "Continue
  disabled until answered" tests became direct `validateStep()`
  assertions against the real `fencingWizardConfig` (invalid with 0/1/2
  of 3 fields, invalid on an out-of-range value, valid when complete) —
  the actual mechanism, per `AUDIT-6.2-validation-pattern.md`, rather than
  a nonexistent disabled-button test. "Submission payload includes new
  fields" became a `state.answers` assertion via `createWizardStore`,
  proportionate to how the existing codebase itself verifies this
  (`submission-lifecycle.test.ts`'s 502 test checks
  `state.answers['qty']`, not a full HTTP payload) — `buildRequest()`
  spreads the answers map unfiltered, so this is sufficient, not
  under-tested.

## Cross-references

- `AUDIT-6.2-fencing-structure.md`, `AUDIT-6.2-step-type.md`,
  `AUDIT-6.2-validation-pattern.md`
- ADR-0033 (Step 6.1 — established the domain/fixtures/ path correction
  and the pattern of adapting to existing label/help mechanisms instead of
  extending schema for copy-only changes)
- ADR-0025 (Optional Details step — the step immediately after this one's
  eventual successor, `contact-and-address`)
