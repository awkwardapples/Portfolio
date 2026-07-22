# Phase 6 Evidence Report

_Compiled: 2026-07-22 — Covers Step 6.1 (Wizard UX Improvements)_

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
