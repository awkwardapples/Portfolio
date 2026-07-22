# Audit 6.1-A: Gate Question Locations

_Compiled: 2026-07-22_

## Correction to spec assumption

The spec (Section "Phase 0 — Required Audits", Audit A) assumes wizard configs
live at `apps/wizard/src/configs/fencing.ts`. That directory does not exist.
Wizard configs are canonical `WizardConfig`/`PricingConfig` fixtures at
`apps/wizard/src/domain/fixtures/*.config.ts` (11 files, one per service
vertical), consumed by the vertical registry (`domain/registry/`). The
PowerShell audit command in the spec (`Get-ChildItem -Path
"apps/wizard/src/configs" ...`) returns nothing against this repo; the correct
path is `apps/wizard/src/domain/fixtures`.

## Search performed

```
rg -i "gate" apps/wizard/src/domain/fixtures/fencing.config.ts
```

Also checked all 10 other `*.config.ts` fixtures — `gate` only appears in
`fencing.config.ts`. No other vertical has a gate concept (gates are
fencing-specific).

## Findings — `fencing.config.ts`

| #   | Location     | Step id            | Step type          | Field key      | Label                                                                     | Notes                                                                                                                                                                |
| --- | ------------ | ------------------ | ------------------ | -------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Line 83–89   | `extras`           | classic field step | `include_gate` | "Include a gate" (checkbox, single option "Yes, include a gate")          | Wired to pricing: `fencingPricingConfig.extras[0]` adds a flat £350 (`amountPence: 35000`) when `include_gate === 'yes'`. This is the price-affecting gate question. |
| 2   | Line 190–199 | `optional-details` | classic field step | `gate_needed`  | "Do you need a gate?" (select, Yes/No)                                    | Not wired to pricing. Purely informational duplicate of #1.                                                                                                          |
| 3   | Line 200–213 | `optional-details` | classic field step | `gate_width`   | "Approximate gate width" (select, conditional on `gate_needed === 'yes'`) | Not wired to pricing. Supplementary detail for the duplicate question.                                                                                               |

## Duplication analysis

Findings #2 and #3 (`gate_needed` / `gate_width` in `optional-details`)
duplicate the intent of #1 (`include_gate` in `extras`) without affecting
price. A user who already answered "include a gate" in Extras (step 5 of 8)
is asked again, in different words, near the very end of the wizard (step 8
of 8, "Anything else?"). Per D1=A, the fix is to remove #2 and #3 and keep
#1 — Extras is the correct home because it is early (before the estimate
recalculation... actually after `estimate`, but still price-affecting) and
because it is the version wired to pricing.

## Resolution applied (4.1)

- Removed: `gate_needed` and `gate_width` fields from the `optional-details`
  step in `fencing.config.ts`.
- Kept unchanged: `include_gate` checkbox in the `extras` step, and its
  pricing wiring in `fencingPricingConfig.extras`.
