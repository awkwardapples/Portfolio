# Audit B — Pricing Formula Format (5.13b pre-work)

All services use the declarative `PricingConfig` schema (see `apps/wizard/src/domain/config/pricing.ts`).
Evaluation order: `base × quantity → modifiers (in order) → extras (in order) → clamp → round → ±spread → range`.

The range is already produced by the engine via `rangeSpreadBasisPoints` (all services use 1500 = ±15%).
No changes to the range calculation mechanism are required.

## Critical constraint discovered during audit

The pricing engine's `computePrice` uses `buildFieldKeyMap(wizard)` which currently only maps classic
field step IDs. Modifier/extra `appliesToFieldId` values and `base.quantityFieldId` are checked against
this map. If quantity and material fields move to `VisualCardSelectorStep` / `SizeBracketSelectorStep`,
`buildFieldKeyMap` and `collectFieldIds` must be extended to include those step types' answer keys and
exactField ids. This is a targeted infrastructure change, not a FSM/engine change.

---

## 1. Fencing

| Config key             | Value                                                               |
| ---------------------- | ------------------------------------------------------------------- |
| `base.quantityFieldId` | `length_m` (linear metres)                                          |
| `base.perUnitPence`    | 32 500 (£325/m — unrealistically high; replace with £75/m = 7 500)  |
| Modifiers              | fence_type=closeboard ×1.1; fence_type=panel ×0.9; height=tall ×1.2 |
| Extras                 | include_gate +£350; remove_old +£450                                |
| bounds                 | min £250; max £50 k; round £50                                      |
| rangeSpread            | ±15%                                                                |

**5.13b action:** Replace base with 7 500 p/m. Add chain_link modifier (×0.55). Add height=low modifier (×0.8). Update round to £5 (500 p) for tighter UX.

---

## 2. Decking

| Config key             | Value                                           |
| ---------------------- | ----------------------------------------------- |
| `base.quantityFieldId` | `length_m` (linear metres of deck run)          |
| `base.perUnitPence`    | 25 000 (£250/m)                                 |
| Modifiers              | material=hardwood ×1.4; material=composite ×1.6 |
| Extras                 | include_steps +£450; include_lighting +£350     |
| bounds                 | min £500; max £50 k; round £50                  |
| rangeSpread            | ±15%                                            |

**5.13b action:** Switch quantity to `area_m2` (square metres). New base 9 000 p/m² (£90/m²). Adjust composite to ×1.8 (higher-end position). Round to £5.

---

## 3. Painting

| Config key             | Value                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| `base.quantityFieldId` | `room_count` (rooms)                                                                        |
| `base.perUnitPence`    | 27 500 (£275/room)                                                                          |
| Modifiers              | room_size=large ×1.2; room_size=small ×0.85; ceiling_height=high ×1.15; paint_type=oil ×1.1 |
| Extras                 | none                                                                                        |
| bounds                 | min £150; max £50 k; round £50                                                              |
| rangeSpread            | ±15%                                                                                        |

**5.13b action:** Keep `room_count` as quantity. Drop room_size/ceiling_height/paint_type modifiers (those fields removed from new flow). Raise base to 30 000 p/room (£300). Round to £5.

---

## 4. Patio

| Config key             | Value                                                                        |
| ---------------------- | ---------------------------------------------------------------------------- |
| `base.quantityFieldId` | `area_m2` (square metres)                                                    |
| `base.perUnitPence`    | 7 500 (£75/m²)                                                               |
| Modifiers              | material=sandstone_indian ×1.25; material=sandstone_sawn ×1.4                |
| Extras                 | edging=block_edging +£200; edging=kerb_edging +£300; include_steps=yes +£650 |
| bounds                 | min £500; max £50 k; round £50                                               |
| rangeSpread            | ±15%                                                                         |

**5.13b action:** Add porcelain material modifier (×1.65). Round to £5. Extras stay as-is (post-estimate step).

---

## 5. Driveway

| Config key             | Value                                                 |
| ---------------------- | ----------------------------------------------------- |
| `base.quantityFieldId` | `area_m2` (square metres)                             |
| `base.perUnitPence`    | 8 000 (£80/m²)                                        |
| Modifiers              | material=tegula ×1.2; material=drivesys ×1.35         |
| Extras                 | kerb_edging=yes_edging +£350; include_steps=yes +£650 |
| bounds                 | min £750; max £50 k; round £50                        |
| rangeSpread            | ±15%                                                  |

**5.13b action:** Add resin_bound modifier (×1.25). Round to £5.

---

## 6. Steps

| Config key             | Value                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| `base.quantityFieldId` | `step_count` (per step)                                                                            |
| `base.perUnitPence`    | 20 000 (£200/step, brick)                                                                          |
| Modifiers              | material=slate ×1.3; material=portland_stone ×1.5; material=cast_stone ×1.8; material=granite ×2.2 |
| Extras                 | step_threads=yes +£300; step_risers=yes +£200                                                      |
| bounds                 | min £250; max £50 k; round £50                                                                     |
| rangeSpread            | ±15%                                                                                               |

**5.13b action:** Add shape modifiers: shape=curved ×1.4; shape=not_sure ×1.2. Remove `not_sure` material option (clients pick materials; contractor discusses if unsure). Round to £5.

---

## 7. Jetwash

| Config key             | Value                       |
| ---------------------- | --------------------------- |
| `base.quantityFieldId` | `area_m2` (square metres)   |
| `base.perUnitPence`    | 400 (£4/m²)                 |
| Modifiers              | surface_type=decking ×1.3   |
| Extras                 | none                        |
| bounds                 | min £50; max £5 k; round £5 |
| rangeSpread            | ±15%                        |

**5.13b action:** No pricing changes needed. Remove 'other' surface type option (not in spec). Rounding already at £5.

---

## Summary of infrastructure changes required

1. **`wizard-config.ts`** — Add `typicalValue: z.number().nonnegative().optional()` to `SizeBracketSchema`. This lets size brackets carry a typical numeric value that the component uses to pre-populate the exact field, making pricing work for bracket selections.

2. **`condition-evaluator.ts` (`buildFieldKeyMap`)** — Extend to add `VisualCardSelectorStep.answerKey → answerKey` and `SizeBracketSelectorStep.answerKey → answerKey` plus each `exactField.id → exactField.id`. This lets the pricing engine resolve modifier/extra field references and quantity field references from new step types.

3. **`validate.ts` (`collectFieldIds`)** — Same extension so `validatePricingConfig` cross-reference passes for new step type answer keys.

4. **`SizeBracketSelectorStep.tsx`** — When a bracket is selected and it has `typicalValue`, dispatch `ANSWER_SET` for each exactField with that value. This populates the numeric quantity so pricing produces a valid result for bracket selections.
