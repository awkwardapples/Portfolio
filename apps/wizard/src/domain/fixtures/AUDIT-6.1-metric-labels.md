# Audit 6.1-B: Metric Measurement Displays

_Compiled: 2026-07-22_

## Correction to spec assumption

Same path correction as Audit A: searched
`apps/wizard/src/domain/fixtures/*.config.ts`, not a nonexistent
`apps/wizard/src/configs/`. Also searched the two step-rendering components
that turn config data into on-screen text
(`apps/wizard/src/components/steps/SizeBracketSelectorStep.tsx`) since some
"labels" are computed at render time from numeric fields, not baked into the
config as static strings — see "Structured vs. static" below.

## Search performed

```
rg -n "m²|metre|meter|~\d+m" apps/wizard/src/domain/fixtures/*.config.ts
```

## Structured vs. static metric data (important distinction)

Two different representations exist for metric measurements in this
codebase, and they need two different fixes:

1. **Structured** — `SizeBracketSelectorStep.brackets[].minValue` /
   `.maxValue` / `.unit`, and `.exactFields[].unit`. These are plain numbers
   plus a unit string; the range text ("0–10 m") is composed at render time
   by `SizeBracketSelectorStep.tsx`, not stored as a pre-formatted string in
   the config. **Fix belongs in the rendering component**, not in every
   config — converting there is DRY (works for every wizard using this step
   kind automatically) and avoids hand-computing feet in 40+ places.
2. **Static** — `VisualCardOption.label` strings that happen to contain a
   metric figure written directly into the copy (e.g. "Up to 1.2m"). There is
   no structured numeric field backing these; **fix requires editing the
   label string directly**, computed with the same conversion factor for
   consistency.

## Critical correctness note: m vs m² are NOT the same conversion

`fencing.config.ts` uses **linear metres** (`unit: 'm'`) for fence length.
`decking.config.ts`, `patio.config.ts`, `driveway.config.ts`, and
`jetwash.config.ts` use **square metres** (`unit: 'm²'`) for area. The
spec's suggested `metersToFeet(meters) = meters × 3.28084` is correct **only
for linear metres**. Applying that same linear factor to a square-metre area
value would be wrong by roughly a factor of 3.28 (e.g. it would report 20 m²
as "66 ft²" when the true conversion is 20 m² ≈ **215 ft²**, since
1 m² ≈ 10.7639 ft²). `apps/wizard/src/utils/units.ts` implements both
`metersToFeet` (× 3.28084) and `squareMetersToSquareFeet` (× 3.28084²), and
`formatMeasurementWithFeet` dispatches on the `unit` string so callers don't
have to pick the right factor themselves.

## Findings — structured (SizeBracketSelectorStep, converted at render time)

| Config             | Step id           | Unit         | Brackets (min–max)  | Exact field                         |
| ------------------ | ----------------- | ------------ | ------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| fencing.config.ts  | `fence_size`      | `m`          | 0–10, 10–30, 30–60  | `length_m` ("Length in metres")     |
| decking.config.ts  | `deck_size`       | `m²`         | 0–10, 10–30, 30–60  | `area_m2` ("Area in square metres") |
| patio.config.ts    | `patio_size`      | `m²`         | 0–15, 15–35, 35–80  | `area_m2` ("Area in square metres") |
| driveway.config.ts | `driveway_size`   | `m²`         | 0–30, 30–60, 60–150 | `area_m2` ("Area in square metres") |
| jetwash.config.ts  | (size step)       | `m²`         | —                   | `area_m2`                           | out of 6.1 scope (jetwash not named in spec scope) but receives the same component fix automatically — noted, not treated as scope creep since it's a shared render path, not a new business rule. |
| steps.config.ts    | `step_count_step` | `item`/count | —                   | `step_count`                        | not a length/area unit — `formatMeasurementRangeWithFeet` falls back to unconverted display for unrecognized units, so this is unaffected.                                                         |

Fix: `SizeBracketSelectorStep.tsx` bracket range text and the exact-field
live value now go through `formatMeasurementRangeWithFeet` /
`formatMeasurementWithFeet`, so every wizard built on this step kind gets
correct feet equivalents without per-config edits.

## Findings — static label text (edited directly)

| Config            | Step id             | Field/option      | Before         | After                   |
| ----------------- | ------------------- | ----------------- | -------------- | ----------------------- |
| fencing.config.ts | `fence_height_step` | option `low`      | "Up to 1.2m"   | "Up to 1.2m (4 ft)"     |
| fencing.config.ts | `fence_height_step` | option `standard` | "1.5m to 1.8m" | "1.5m to 1.8m (5–6 ft)" |
| fencing.config.ts | `fence_height_step` | option `tall`     | "Over 1.8m"    | "Over 1.8m (6 ft)"      |

## Considered and excluded

- `patio.config.ts` material option `'450×450 Riven Slabs'` — this is a
  product/model name (a UK paving-slab size designation), not a
  user-facing measurement decision point. Converting it to
  "450×450mm (17.7×17.7 in) Riven Slabs" would read as odd product-catalogue
  noise rather than helping a metric-unfamiliar user picture an area. Left
  unchanged.
- `PricingConfig.base.label` / `modifiers[].label` / `extras[].label`
  (e.g. "Base rate per linear metre") — per `pricing.ts`'s own schema
  documentation these are "used for auditing/debugging", not rendered to
  the end user (`EstimateDisplayStep.tsx` shows only the total price range,
  never a line-item breakdown). Left unchanged.
