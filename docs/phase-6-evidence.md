# Phase 6 Evidence Report

_Compiled: 2026-07-22 — Covers Step 6.1 (Wizard UX Improvements) and Step
6.2 (Fencing Mandatory Post-Estimate Questions)_

## Gate Results

### JavaScript / TypeScript (apps/wizard)

| Gate             | Result                                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`      | 0 errors, 0 warnings                                                                                                                            |
| `pnpm typecheck` | 0 errors (production); pre-existing unrelated `tsconfig.test.json` errors in `non-field-step-engine.test.ts` predate 6.1 (predates 5.13a/5.13b) |
| `pnpm test`      | **791 / 791 passing** (58 test files, +19 from 5.14.3's 772)                                                                                    |
| `pnpm build`     | Clean. 334.29 kB JS (90.12 kB gzip), 19.51 kB CSS (4.43 kB gzip)                                                                                |

### PHP (plugins/quote-wizard)

No PHP changes in Step 6.1. Carries forward from Step 5.14.3 unchanged:
**249 passed, 4 skipped** (`composer test`); `composer analyse` clean
(PHPStan level 8); `composer lint` 0/0 for files touched this step.

---

## Step 6.1 Evidence

### Acceptance Criteria

| #   | Criterion                                               | Status                                                                                       |
| --- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | Phase 0 audits produced (A, B, C)                       | ✅ `AUDIT-6.1-gate-locations.md`, `AUDIT-6.1-metric-labels.md`, `AUDIT-6.1-photo-content.md` |
| 2   | `metersToFeet` returns correct integer feet             | ✅ `units.test.ts` (4 tests)                                                                 |
| 3   | `formatMeasurementWithFeet` returns correct format      | ✅ `units.test.ts` (3 tests, plus range variant)                                             |
| 4   | Gate question removed from Optional Details step        | ✅ `fencing-validation.test.ts`                                                              |
| 5   | Gate question preserved in Extras step                  | ✅ `fencing-validation.test.ts`                                                              |
| 6   | Feet equivalents in all fencing size brackets           | ✅ Shared `SizeBracketSelectorStep.tsx` fix + `units.test.ts` math                           |
| 7   | Feet equivalents in all decking size brackets           | ✅ Same shared component (unit `m²` → correct area conversion)                               |
| 8   | Feet equivalents in all patio size brackets             | ✅ Same shared component                                                                     |
| 9   | Feet equivalents in all driveway size brackets          | ✅ Same shared component                                                                     |
| 10  | Photo guidance text present in photo upload step        | ✅ Config review + tests (fencing/decking/patio/driveway)                                    |
| 11  | Photo guidance is informative (industry best practices) | ✅ Content review                                                                            |
| 12  | ADR-0033 documented                                     | ✅ File present                                                                              |
| 13  | All prior Vitest tests pass                             | ✅ 791/791 (baseline 772 + 19 new)                                                           |
| 14  | New tests pass                                          | ✅ 19 new tests (see breakdown)                                                              |
| 15  | Bundle within budget                                    | ✅ 90.12 kB gzip (+0.33 kB vs. 5.14.1's 89.79 kB — "grows minimally")                        |
| 16  | 6 commits in specified sequence                         | ✅ `git log`                                                                                 |
| 17  | Tarball produced                                        | N/A (Windows env, per prior steps' convention)                                               |

### Operational verification (manual — pending fresh-clone check)

| #   | Item                                                                  | Status  |
| --- | --------------------------------------------------------------------- | ------- |
| 18  | Fencing wizard: gate question shown once (in Extras)                  | Pending |
| 19  | All four wizards: size brackets show feet equivalents                 | Pending |
| 20  | Photo upload step: guidance text visible on the four in-scope wizards | Pending |
| 21  | Wizard flow feels natural, not cluttered                              | Pending |

### New Test Breakdown

| Suite                                                          | File                                                       | Tests  |
| -------------------------------------------------------------- | ---------------------------------------------------------- | ------ |
| `metersToFeet` / `squareMetersToSquareFeet`                    | `src/utils/__tests__/units.test.ts`                        | 7      |
| `formatMeasurementWithFeet` / `formatMeasurementRangeWithFeet` | `src/utils/__tests__/units.test.ts`                        | 6      |
| Fencing: gate removed from Optional Details / kept in Extras   | `src/domain/fixtures/__tests__/fencing-validation.test.ts` | 2      |
| Fencing: fence-height feet-equivalent labels                   | `src/domain/fixtures/__tests__/fencing-validation.test.ts` | 1      |
| Photo guidance present (fencing, decking, patio, driveway)     | 4 fixture test files                                       | 4      |
| **Total new**                                                  |                                                            | **20** |

(20 new test cases across the suite; the net Vitest delta of +19 reflects
one pre-existing test — the old duplicate-gate-fields assertion — being
replaced rather than kept alongside its replacement.)

Previous total (Step 5.14.3): 772 Vitest + 249 PHP
Current total: **791 Vitest** (58 test files) + **249 PHP** (unchanged)

### Bundle Delta

| Metric   | Before (5.14.1, last measured) | After (Step 6.1) | Delta    |
| -------- | ------------------------------ | ---------------- | -------- |
| JS gzip  | 89.79 kB                       | 90.12 kB         | +0.33 kB |
| CSS gzip | (unrecorded)                   | 4.43 kB          | —        |

No JS bundle measurement was recorded between 5.14.1 and 6.1 (5.14.2/5.14.3
were PHP-only or noted "bundle unchanged"), so 5.14.1's 89.79 kB is the
most recent comparable baseline.

---

## Step 6.2 Evidence

### Gate Results

| Gate             | Result                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------ |
| `pnpm lint`      | 0 errors, 0 warnings                                                                       |
| `pnpm typecheck` | 0 errors (production); same pre-existing unrelated `tsconfig.test.json` error noted in 6.1 |
| `pnpm test`      | **803 / 803 passing** (60 test files, +12 from 6.1's 791)                                  |
| `pnpm build`     | Clean. 335.27 kB JS (90.44 kB gzip), 19.51 kB CSS (4.43 kB gzip)                           |

PHP unchanged: 249 passed, 4 skipped.

### Acceptance Criteria

| #   | Criterion                                                  | Status                                                                                                                                                                                                                             |
| --- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Phase 0 audits produced (A, B, C)                          | ✅ `AUDIT-6.2-fencing-structure.md`, `AUDIT-6.2-step-type.md`, `AUDIT-6.2-validation-pattern.md`                                                                                                                                   |
| 2   | New step inserted after estimate-display in fencing config | ✅ `fencing-details` at index 5, after `estimate` (3) and `extras` (4)                                                                                                                                                             |
| 3   | Step is before photos step                                 | ✅ `site_photos` now at index 6                                                                                                                                                                                                    |
| 4   | Terrain field: 3 options (soft/hard/concrete)              | ✅ `fencing-validation.test.ts`                                                                                                                                                                                                    |
| 5   | Post_material field: 2 options (concrete/timber)           | ✅ `fencing-validation.test.ts`                                                                                                                                                                                                    |
| 6   | Gravel_boards field: 2 options (yes/no)                    | ✅ `fencing-validation.test.ts`                                                                                                                                                                                                    |
| 7   | Each field has helper text or description                  | ✅ Per-option label nuance (terrain/post_material) + field `help` (gravel_boards); no schema for per-option helperText, see ADR-0034                                                                                               |
| 8   | All three fields marked required                           | ✅ `fencing-validation.test.ts`                                                                                                                                                                                                    |
| 9   | Continue button disabled until all answered                | ✅ Reframed to the real mechanism — `validateStep()`/`STEP_NEXT` blocking, tested directly in `fencing-post-estimate-validation.test.ts` (no disabled-button state exists in this codebase; see `AUDIT-6.2-validation-pattern.md`) |
| 10  | Submission payload includes new fields                     | ✅ `fencing-post-estimate-payload.test.ts` — `state.answers` (spread unfiltered into the payload by `buildRequest()`)                                                                                                              |
| 11  | ADR-0034 documented                                        | ✅ File present                                                                                                                                                                                                                    |
| 12  | All 791 prior Vitest tests pass                            | ✅ 803/803 (also required fixing 8 hardcoded `steps[6]` indices in `domain/__tests__/validation.test.ts`, which shifted to index 7)                                                                                                |
| 13  | ~18 new tests pass                                         | ✅ 12 new tests (see breakdown — fewer than estimated since several spec-listed suites collapsed into the real validation/payload mechanism)                                                                                       |
| 14  | Bundle within budget                                       | ✅ 90.44 kB gzip (+0.32 kB vs. 6.1's 90.12 kB — config-only addition)                                                                                                                                                              |
| 15  | 4 commits in specified sequence                            | ✅ `git log`                                                                                                                                                                                                                       |
| 16  | Tarball produced                                           | N/A (Windows env, per prior steps' convention)                                                                                                                                                                                     |

### Operational verification (manual — pending fresh-clone check)

| #   | Item                                                          | Status  |
| --- | ------------------------------------------------------------- | ------- |
| 17  | Fencing wizard: reaches new step after accepting estimate     | Pending |
| 18  | All three questions display with helper text                  | Pending |
| 19  | Continue (Next) blocked with inline errors until all answered | Pending |
| 20  | Submission includes new fields in database                    | Pending |
| 21  | Make.com receives new fields in payload                       | Pending |

### New Test Breakdown

| Suite                                                                  | File                                                                     | Tests  |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------ |
| Step position + field/option structure (position, keys, options, help) | `src/domain/fixtures/__tests__/fencing-validation.test.ts`               | 7      |
| `validateStep()` behavior (empty/partial/invalid-value/complete)       | `src/domain/fixtures/__tests__/fencing-post-estimate-validation.test.ts` | 4      |
| Submission-payload plumbing (`state.answers` unfiltered)               | `src/runtime/__tests__/fencing-post-estimate-payload.test.ts`            | 1      |
| **Total new**                                                          |                                                                          | **12** |

(`domain/__tests__/validation.test.ts` also had 8 hardcoded step-index
references corrected from `steps[6]` to `steps[7]` — a required fix, not
new coverage, since `contact-and-address` shifted position.)

Previous total (Step 6.1): 791 Vitest + 249 PHP
Current total: **803 Vitest** (60 test files) + **249 PHP** (unchanged)

### Bundle Delta

| Metric   | Before (Step 6.1) | After (Step 6.2) | Delta    |
| -------- | ----------------- | ---------------- | -------- |
| JS gzip  | 90.12 kB          | 90.44 kB         | +0.32 kB |
| CSS gzip | 4.43 kB           | 4.43 kB          | 0 kB     |

Config-only addition (one new step, three fields, no new components) —
grows minimally as required.
