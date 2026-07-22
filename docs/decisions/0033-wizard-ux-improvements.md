# ADR-0033: Wizard UX Improvements (Step 6.1)

**Status:** Accepted (Step 6.1, 2026-07-22)

## Context

Three independent UX issues were identified for the wizard, scoped to the
four instant-quote hard-landscaping wizards (fencing, decking, patio,
driveway):

1. **Duplicate gate question (fencing only).** `fencing.config.ts` asked
   about a gate twice: `include_gate` in the `extras` step (price-affecting,
   wired to `fencingPricingConfig.extras`) and `gate_needed`/`gate_width` in
   `optional-details` (informational only, never wired to pricing). See
   `AUDIT-6.1-gate-locations.md`.
2. **Metric-only measurements.** Every size-bracket, exact-dimension, and
   fence-height display showed metres/square-metres only. UK trade
   customers who think in feet had no equivalent to anchor against. See
   `AUDIT-6.1-metric-labels.md`.
3. **Unclear photo guidance.** The `site_photos` step's help text
   ("Up to 5 photos. We accept JPEG, PNG, and WebP.") only restated format
   constraints already shown a second time by `PhotoField.tsx`'s own
   hardcoded tip — it gave the user no guidance on _what_ to photograph for
   an accurate quote. See `AUDIT-6.1-photo-content.md`.

The spec driving this step assumed a `apps/wizard/src/configs/` and
`apps/wizard/src/domain/steps/photo-upload/` layout that does not exist in
this codebase; all three Phase 0 audits document the actual locations
(`domain/fixtures/*.config.ts`, `components/steps/fields/PhotoField.tsx`,
`components/steps/SizeBracketSelectorStep.tsx`) and are cross-referenced
above.

## Decisions

**Gate question:** removed `gate_needed`/`gate_width` from fencing's
`optional-details` step. `include_gate` in `extras` — the version already
wired to pricing — is now the single source of truth.

**Feet equivalents:** added in bracket format ("20m (66 ft)" / "20m²
(215 ft²)"), per D2=A. Two different mechanisms were needed, not one:

- Bracket ranges and the live exact-dimension value are **structured data**
  (`minValue`/`maxValue`/`unit` on `SizeBracketSelectorStep`), composed into
  display text at render time by `SizeBracketSelectorStep.tsx` rather than
  baked into config strings. The fix lives in that component
  (`formatMeasurementRangeWithFeet`/`formatMeasurementWithFeet`, new
  `apps/wizard/src/utils/units.ts`), so it applies to every wizard built on
  this step kind — decking, patio, driveway, and incidentally jetwash and
  garden-steps too — without per-config edits.
- Fencing's fence-height options (`fence_height_step`) are **static label
  text** with no structured numeric backing ("Up to 1.2m"), so those three
  labels were edited directly.

A correctness point the spec's suggested formula missed: fencing measures
**linear metres** (`unit: 'm'`), but decking/patio/driveway measure **square
metres** (`unit: 'm²'`). `1 m ≈ 3.28 ft`, but `1 m² ≈ 10.76 ft²` — applying
the linear factor to an area value understates it by roughly 3.3×
(e.g. 20 m² is ≈215 ft², not ≈66 ft²). `units.ts` implements both
`metersToFeet` and `squareMetersToSquareFeet`, and the formatters dispatch
on the `unit` string so callers can't pick the wrong one.

**Photo guidance:** static text (D3=A), replacing the redundant help string
on the four in-scope wizards' `site_photos` field: full-length shots,
obstacles (trees, sheds, slopes, existing structures), problem-area
close-ups, and where the area meets the house/boundary. Not applied to the
other seven wizard fixtures (jetwash, garden steps, painting, carpentry,
electrical, plumbing, general-repairs) — the guidance language is
landscaping/exterior-hardscape-specific and would read oddly on an indoor
trade's photo step.

## Consequences

**Positive:**

- Fencing no longer asks the same question twice under different wording.
- Every size-bracket wizard shows a correct feet equivalent — including
  wizards outside this step's named scope, for free, because the fix lives
  in the shared rendering component.
- Photo guidance gives users concrete direction instead of a redundant
  format restatement, which should reduce missed-shot follow-up requests.

**Negative:**

- Fencing's fence-height card labels are a little longer
  ("1.5m to 1.8m (5–6 ft)").
- The photo guidance paragraph is longer than the text it replaced; no
  visual regression since `PhotoField.tsx` already renders `help` as a
  paragraph, but it does make that step's card taller.

**Neutral:**

- Wizard engine, data storage format (metric only, no imperial persisted),
  and pricing are unchanged. Feet are computed at render time from existing
  numeric fields, never stored.
- `jetwash.config.ts` and `steps.config.ts` (garden steps) also use
  `SizeBracketSelectorStep` with `m²`/count units respectively, so they
  incidentally gain (jetwash) or are unaffected by (garden steps, whose
  `step_count` unit isn't `m`/`m²`) the feet-equivalent fix. This wasn't a
  goal of 6.1 but isn't a regression either — noted in
  `AUDIT-6.1-metric-labels.md`.

## Deviations from the spec

- **Audit paths corrected.** The spec's assumed `apps/wizard/src/configs/`
  and `apps/wizard/src/domain/steps/photo-upload/` don't exist; audits
  target the real locations instead (see Context).
- **Feet equivalents are not literal string edits to every bracket label**,
  as the spec's pseudocode suggested (`'Small (up to 10m)'` →
  `'Small (up to 10m / 33 ft)'`). Bracket ranges in this codebase are
  computed from `minValue`/`maxValue`/`unit`, not stored as pre-formatted
  strings — converting in the shared rendering component is more correct
  (works for every current and future wizard on this step kind) and avoids
  hand-computing feet in dozens of places. Only the three static
  fence-height labels, which have no structured backing, were edited as
  literal strings.
- **Square-metre area conversion added** (`squareMetersToSquareFeet`), not
  specified by the spec, because applying the linear `metersToFeet` factor
  to the three area-based wizards (decking, patio, driveway) would have
  been factually wrong by ~3.3×.
- **Photo guidance scoped to 4 wizards, not all 11.** The spec's Phase 0
  Audit C assumed a single, general photo-upload step; in this codebase
  each of the 11 wizard verticals defines its own `site_photos` field. The
  suggested guidance text is landscaping-specific, so it was applied only
  to the four wizards this step already touches for metric labels, not
  copied verbatim into unrelated trades.
- **No component-level (React Testing Library) tests added.** This project
  has zero `.test.tsx` files and no RTL dependency anywhere in
  `apps/wizard` — every existing test is pure-TS domain/config validation.
  Introducing RTL to test `SizeBracketSelectorStep.tsx`'s rendering would be
  a new testing architecture, out of scope for a UX-copy step whose own
  Pre-Spec Discipline notes say "No architectural changes." The conversion
  math itself is fully covered by `units.test.ts` (13 tests); the
  component wiring is covered by manual/build verification instead (see
  `docs/phase-6-evidence.md`), consistent with the spec's own "Operational
  verification" section already treating on-screen bracket/photo display as
  a manual check.

## Cross-references

- `AUDIT-6.1-gate-locations.md`, `AUDIT-6.1-metric-labels.md`,
  `AUDIT-6.1-photo-content.md`
- ADR-0022 (pre-step reduction; fencing/decking/patio/driveway flow shape)
- ADR-0025 (Optional Details step — the step the gate duplicate lived in)
