# Audit 6.4-B: Pricing Formula Structures

_Compiled: 2026-07-22_

## Critical finding: there is no per-service pricing function

The spec assumes "Each instant-quote service has pricing logic in its
config file. Look for functions like `calculatePricing()` or
`estimateJob()`." **This is wrong.** There is exactly **one** shared,
generic pricing engine — `domain/pricing/pricing-engine.ts`'s
`computePrice(answers, wizard, pricing): PricingResult` — evaluated
identically for every instant-quote service. A service's "pricing
formula" is **pure declarative data** (a `PricingConfig` object exported
from its `<service>.config.ts`), not code. There is nothing to "find" as a
function per service; there is one function, and N data objects it
evaluates. This matters enormously for the guide: adjusting a service's
pricing means editing numbers in a data object, never writing or
modifying logic.

## The common pattern: base × quantity, then modifiers, then extras

Every `PricingConfig` (`domain/config/pricing.ts`) has the identical
shape:

```ts
{
  schemaVersion: 1,
  currency: 'GBP',
  base: { label, perUnitPence, unit: 'linear_metre' | 'square_metre' | 'item', quantityFieldId },
  modifiers: [ { id, label, appliesToFieldId, match, effect: {multiply: factor} | {add: amountPence} } ],
  extras: [ { id, label, appliesToFieldId, match, amountPence } ],
  bounds: { minPence, maxPence, rounding: { mode: 'nearest', toPence } },
  rangeSpreadBasisPoints: number, // e.g. 1500 = ±15%
}
```

`computePrice()`'s evaluation order (fixed, identical for every service):

1. `basePence = round(base.perUnitPence × answers[base.quantityFieldId])`
2. Apply `modifiers` in array order — each either `multiply`s the running
   total by a `factor` or `add`s a flat `amountPence`, only if its `match`
   rule (against another field's answer) holds.
3. Add `extras` in array order — always additive, only if `match` holds
   (e.g. a checkbox/select answer equals a specific value).
4. Clamp to `[bounds.minPence, bounds.maxPence]`.
5. Round to the nearest `bounds.rounding.toPence`.
6. Derive the displayed range: `roundedPence × (1 ∓ rangeSpreadBasisPoints/10000)`.

## Where modifiers/extras live

**In the config, never in shared utilities.** Each service's own
`<service>PricingConfig.modifiers`/`.extras` arrays are the complete,
self-contained rule set for that service. `pricing-engine.ts` contains
zero service-specific branches — it has no knowledge that `'fencing'` or
`'decking'` exist. Adjusting one service's pricing never risks affecting
another's, because there is no shared mutable state or shared formula
constant across services (contrary to the spec's illustrative
`RATES_PER_METER` module-level constant pattern, which doesn't exist
anywhere in the real codebase — see below).

## How ranges are calculated

`rangeSpreadBasisPoints` (integer basis points, e.g. `1500` = ±15%,
`1000` = ±10%) is the **only** range-shape knob. Every current service
uses `1500` (±15%) — this is a convention, not an enforced constraint;
the schema allows `0`–`5000` (0%–50%). Range is computed from the
**rounded** central price, not the raw subtotal (step 6 uses `roundedPence`,
the output of step 5).

## Base rate structure — surveyed across all 7 instant-quote services

| Service                | `base.unit`    | `quantityFieldId` | `perUnitPence`                       | Notes                                                                                                                    |
| ---------------------- | -------------- | ----------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `fencing`              | `linear_metre` | `length_m`        | 7500 (£75/m, feather edge baseline)  | 5 modifiers (type × height combinations), 2 extras (gate, removal)                                                       |
| `decking`              | `square_metre` | `area_m2`         | 9000 (£90/m², softwood baseline)     | 2 modifiers (material), 2 extras (steps, lighting)                                                                       |
| `patio`                | `square_metre` | `area_m2`         | 7500 (£75/m², riven slabs baseline)  | 3 modifiers (material), 3 extras (edging ×2, steps)                                                                      |
| `driveway`             | `square_metre` | `area_m2`         | 8000 (£80/m², Driveline 50 baseline) | 3 modifiers (material), 2 extras (kerb edging, steps)                                                                    |
| `steps` (garden steps) | `item`         | `step_count`      | 20000 (£200/step)                    | 6 modifiers (shape × material), no extras confirmed in 6.1 audit — **not independently re-verified this pass, see note** |
| `painting`             | `item`         | `room_count`      | 30000 (£300/room)                    | 0 modifiers, 0 extras — simplest pricing config in the codebase                                                          |
| `jetwash`              | `square_metre` | `area_m2`         | 400 (£4/m²)                          | small per-surface-type premium                                                                                           |

Bounds vary per service (e.g. fencing `minPence: 20000`/£200, decking
`minPence: 50000`/£500, driveway `minPence: 75000`/£750) — there is no
shared minimum; each service's `bounds` reflects that trade's realistic
job floor/ceiling, set independently.

All 7 rows above were read directly from their `<service>.config.ts`
files for this audit (not carried forward from memory) and follow the
identical schema shape described above. `steps` has 6 modifiers (shape ×
material combinations) and 0 extras; `jetwash`'s base confirms
`square_metre`/£4.00 per m² as shown.

## The spec's illustrative code doesn't match reality — corrected for the guide

The spec's Section 5.3 shows:

```ts
const RATES_PER_METER = {
  closeboard: 4500, // 4500 pence = £45
};
```

No such module-level rate-lookup constant exists anywhere in
`fencing.config.ts` or any other config. Rates live **inline** as
`perUnitPence` on `base`, and per-type premiums live as **modifier
factors** (multipliers), not as separate absolute rates per type. E.g.
fencing's `closeboard` premium is `{ effect: { kind: 'multiply', factor:
1.1 } }` applied to the base rate (£75/m × 1.1 = £82.50/m), not a
standalone `4500`-pence constant. The guide's worked pricing example (D3)
must use the real shape — a `perUnitPence` edit plus, if changing a
_type_'s relative premium rather than the whole service's base rate, a
`modifier.effect.factor` edit — not an "edit this lookup table" pattern
that doesn't exist.
