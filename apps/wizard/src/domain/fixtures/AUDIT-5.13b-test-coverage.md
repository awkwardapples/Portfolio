# Audit C — Test Coverage (5.13b pre-work)

## Existing test files per service

### Fencing — `fixtures/__tests__/fencing-validation.test.ts` (4 tests)

| Test                                         | Status after 5.13b                                                         |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| passes wizard validation                     | ✓ still passes (validateWizardConfig is schema-agnostic across step types) |
| passes pricing validation against the wizard | ✓ still passes (once buildFieldKeyMap extended)                            |
| contains exactly 5 steps in expected order   | ✗ BREAKS — new sequence has 6 steps                                        |
| site_photos step has photo field             | ✗ BREAKS — site_photos step removed                                        |

**Action:** Rewrite step-sequence test; replace site_photos test with new step-type assertions.

### Decking — `fixtures/__tests__/decking-validation.test.ts` (2 tests)

| Test                                         | Status after 5.13b                                          |
| -------------------------------------------- | ----------------------------------------------------------- |
| passes wizard validation                     | ✓ still passes                                              |
| passes pricing validation against the wizard | ✓ still passes (area_m2 in collectFieldIds after extension) |

**Action:** Add step-sequence test and step-type assertions.

### Painting — `fixtures/__tests__/painting-validation.test.ts` (5 tests)

| Test                                                            | Status after 5.13b                                                      |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| passes wizard validation                                        | ✓ still passes                                                          |
| passes pricing validation against the wizard                    | ✓ still passes                                                          |
| is an instant-quote wizard                                      | ✓ still passes                                                          |
| contains exactly 5 steps in expected order                      | ✗ BREAKS — new sequence has 5 steps but different IDs                   |
| rooms step has room_count number field + what_to_paint checkbox | ✗ BREAKS — rooms_step is now SizeBracketSelectorStep, no classic fields |
| site_photos step has photo field                                | ✗ BREAKS — removed                                                      |
| pricing base uses room_count                                    | ✓ still passes                                                          |

**Action:** Rewrite step-sequence test; update/replace field-access tests.

### Patio / Driveway / Steps — `fixtures/__tests__/patio-driveway-steps-validation.test.ts` (15 tests)

**Patio (5 tests):**

| Test                                                 | Status after 5.13b                                 |
| ---------------------------------------------------- | -------------------------------------------------- |
| passes wizard validation                             | ✓                                                  |
| passes pricing validation                            | ✓                                                  |
| is an instant-quote wizard                           | ✓                                                  |
| contains exactly 5 steps in expected order           | ✗ BREAKS — new sequence has 6 steps, different IDs |
| area_and_material step has area_m2 + material fields | ✗ BREAKS — no longer a classic step                |
| pricing base uses area_m2                            | ✓                                                  |

**Driveway (5 tests):**

| Test                                            | Status after 5.13b                                |
| ----------------------------------------------- | ------------------------------------------------- |
| passes wizard validation                        | ✓                                                 |
| passes pricing validation                       | ✓                                                 |
| is an instant-quote wizard                      | ✓                                                 |
| contains exactly 5 steps in expected order      | ✗ BREAKS                                          |
| material select has 3 driveway-specific options | ✗ BREAKS — material is now VisualCardSelectorStep |
| pricing base uses area_m2                       | ✓                                                 |

**Steps (5 tests):**

| Test                                             | Status after 5.13b                       |
| ------------------------------------------------ | ---------------------------------------- |
| passes wizard validation                         | ✓                                        |
| passes pricing validation                        | ✓                                        |
| is an instant-quote wizard                       | ✓                                        |
| contains exactly 5 steps in expected order       | ✗ BREAKS                                 |
| design step has shape/material/step_count fields | ✗ BREAKS — now separate VisualCard steps |
| pricing base uses step_count                     | ✓                                        |

**Action:** Rewrite step-sequence tests; replace field-access tests with new-step-type assertions.

### Jetwash — `fixtures/__tests__/jetwash-validation.test.ts` (5 tests)

| Test                                        | Status after 5.13b                                    |
| ------------------------------------------- | ----------------------------------------------------- |
| passes wizard validation                    | ✓                                                     |
| passes pricing validation                   | ✓                                                     |
| is an instant-quote wizard                  | ✓                                                     |
| contains exactly 4 steps in expected order  | ✗ BREAKS — new sequence has 4 steps but different IDs |
| area step has area_m2 + surface_type fields | ✗ BREAKS — now separate new-step-type steps           |
| pricing base uses area_m2                   | ✓                                                     |

**Action:** Rewrite step-sequence and field-assertion tests.

---

## Engine-level test changes

### `domain/steps/__tests__/non-field-step-engine.test.ts`

Current description "only includes field IDs from classic field steps" is now partially incorrect after `buildFieldKeyMap` extension. Need to:

- Update test description
- Add tests for VisualCardSelectorStep answerKey in buildFieldKeyMap
- Add tests for SizeBracketSelectorStep answerKey + exactField ids in buildFieldKeyMap

### `domain/steps/__tests__/visual-card-size-bracket-types.test.ts`

Need to add:

- `typicalValue` is optional and parses as nonnegative number in SizeBracketSchema

### `domain/pricing/__tests__/pricing-engine.test.ts`

Integration tests against `fencingWizardConfig`/`fencingPricingConfig` (lines 501–560) will break because:

1. Old base was 32 500 p/m; new is 7 500 p/m → all expected totals are wrong
2. `fence_type` and `height` are now VisualCard answerKeys; `length_m` is SizeBracket exactField

After extending `buildFieldKeyMap`, the engine resolves these correctly. The integration tests need expected values recalculated for the new base rate.

---

## Tests NOT affected

- `domain/__tests__/validation.test.ts` — tests mutation of a fencing clone; still valid (uses asStep cast)
- `domain/__tests__/error-tone-and-public-config.test.ts` — uses fencing clone; still valid
- `domain/__tests__/__tests__/manual-quote-configs.test.ts` — manual-quote services untouched
- `domain/runtime/__tests__/` — FSM tests use synthetic configs; unaffected
- `domain/registry/__tests__/` — registry tests check presence/labels; unaffected
- `domain/wizards/__tests__/address-prestep.test.ts` — pre-step unchanged
