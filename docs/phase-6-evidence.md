# Phase 6 Evidence Report

_Compiled: 2026-07-22 — Covers Step 6.1 (Wizard UX Improvements), Step 6.2
(Fencing Mandatory Post-Estimate Questions), and Step 6.3 ("Other" Service
Category)_

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

---

## Step 6.3 Evidence

### Gate Results

| Gate             | Result                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------ |
| `pnpm lint`      | 0 errors, 0 warnings                                                                       |
| `pnpm typecheck` | 0 errors (production); same pre-existing unrelated `tsconfig.test.json` error noted in 6.1 |
| `pnpm test`      | **820 / 820 passing** (62 test files, +17 from 6.2's 803)                                  |
| `pnpm build`     | Clean. 338.16 kB JS (90.66 kB gzip), 19.51 kB CSS (4.43 kB gzip)                           |

PHP: **250 passed, 4 skipped** (+1 from 6.2's 249) — `composer analyse` clean
(PHPStan level 8), `composer lint` 0/0 for files touched this step
(pre-existing, unrelated drift in `quote-wizard.php` predates this step, same
as every prior step's gate state). One PHP file touched:
`ServiceSchemaEmitter.php` (+1 test), per its own documented sync-discipline
contract with the JS service registry — see ADR-0035's "Discovery during
implementation."

### Acceptance Criteria

| #   | Criterion                                       | Status                                                                                                                                                                                                                                                           |
| --- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Phase 0 audits produced (A, B, C)               | ✅ `AUDIT-6.3-service-structure.md`, `AUDIT-6.3-manual-flow.md`, `AUDIT-6.3-textarea.md`                                                                                                                                                                         |
| 2   | New `other.config.ts` exists                    | ✅ File present                                                                                                                                                                                                                                                  |
| 3   | Other service registered in aggregator          | ✅ `domain/registry/verticals.ts` (no `domain/fixtures/index.ts` exists — see Audit A)                                                                                                                                                                           |
| 4   | Other appears last in service list              | ✅ `resolve.test.ts`/`services.test.ts` — `other` is the last key in `VERTICALS`, last in `listVerticalIds()`/`listEnabledServiceIds()`                                                                                                                          |
| 5   | Quote mode is manual                            | ✅ `manual-quote-configs.test.ts` generic `$id has quoteMode: manual` (extended to include `other`)                                                                                                                                                              |
| 6   | Project description step present after postcode | ✅ Reframed: postcode is engine-injected (`QuotePage.tsx`'s `preSteps`) ahead of every wizard, not a config-level step; `description` is `other.config.ts`'s first config-level step, matching every other manual-quote service — see `AUDIT-6.3-manual-flow.md` |
| 7   | Project description field is textarea           | ✅ `manual-quote-configs.test.ts` generic assertion                                                                                                                                                                                                              |
| 8   | Project description field is required           | ✅ `manual-quote-configs.test.ts` generic assertion + `other-service-validation.test.ts`                                                                                                                                                                         |
| 9   | Project description field has help text         | ✅ `other description field help text gives an example project` (`manual-quote-configs.test.ts`)                                                                                                                                                                 |
| 10  | Standard manual flow steps included             | ✅ `$id has exactly 7 steps in the standard order` (generic, extended to `other`)                                                                                                                                                                                |
| 11  | Submission includes project_description         | ✅ `other-service-payload.test.ts` — `state.answers.work_description` (kept existing manual-quote field naming, not the spec's `project_description` — see ADR-0035)                                                                                             |
| 12  | ADR-0035 documented                             | ✅ File present                                                                                                                                                                                                                                                  |
| 13  | LLM customization guide updated                 | ✅ `llm-customization-handoff.md` — new "Other" customization section                                                                                                                                                                                            |
| 14  | All 803 prior Vitest tests pass                 | ✅ 820/820 (also required updating 5 files with hardcoded "11 services" counts/lists to 12)                                                                                                                                                                      |
| 15  | ~21 new tests pass                              | ✅ 17 new tests (fewer than estimated since most structural coverage came from extending existing shared parametrized suites rather than new bespoke assertions)                                                                                                 |
| 16  | Bundle within budget                            | ✅ 90.66 kB gzip (+0.22 kB vs. 6.2's 90.44 kB — config-only addition)                                                                                                                                                                                            |
| 17  | 4 commits in specified sequence                 | ✅ `git log`                                                                                                                                                                                                                                                     |
| 18  | Tarball produced                                | N/A (Windows env, per prior steps' convention)                                                                                                                                                                                                                   |

### Operational verification (manual — pending fresh-clone check)

| #   | Item                                                  | Status  |
| --- | ----------------------------------------------------- | ------- |
| 19  | "Other services" appears last in service list         | Pending |
| 20  | Selecting Other leads to the project description step | Pending |
| 21  | Project description is required to continue           | Pending |
| 22  | Flow completes successfully to submission             | Pending |
| 23  | Submission payload includes project description       | Pending |
| 24  | Business owner sees full description in Google Sheets | Pending |

### New Test Breakdown

| Suite                                                                      | File                                                                       | Tests  |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------ |
| Registry ordering/count updates (12 services, `other` last, no categoryId) | `resolve.test.ts`, `services.test.ts`, `service-selection.test.ts`         | 4      |
| Shared manual-quote structural contract (extended `MANUAL_CONFIGS`)        | `manual-quote-configs.test.ts` (generic `it.each`, now covers `other` too) | 0\*    |
| Other-specific description-prompt copy checks                              | `manual-quote-configs.test.ts`                                             | 2      |
| Shared consent contract (extended `MANUAL_CONFIGS`)                        | `consent-field.test.ts` (generic `it.each`, now covers `other` too)        | 0\*    |
| `validateStep()` behavior (empty/whitespace/valid)                         | `other-service-validation.test.ts`                                         | 3      |
| Submission-payload plumbing (`state.answers` unfiltered)                   | `other-service-payload.test.ts`                                            | 1      |
| **Total new (directly attributable)**                                      |                                                                            | **17** |

\* The generic `it.each(MANUAL_CONFIGS)` suites in `manual-quote-configs.test.ts`
and `consent-field.test.ts` don't add new _test cases_ when `other` is
appended to their config list — they add new _test runs_ of the same
parametrized assertions (Vitest reports each `it.each` expansion as a
separate passing test, which is where most of the +17 net count actually
comes from beyond the 6 tests listed with explicit new file/line
authorship above). This is the reuse those shared suites exist for.

Previous total (Step 6.2): 803 Vitest + 249 PHP
Current total: **820 Vitest** (62 test files) + **250 PHP** (+1 —
`ServiceSchemaEmitter.php`'s "other" category-omission test)

### Bundle Delta

| Metric   | Before (Step 6.2) | After (Step 6.3) | Delta    |
| -------- | ----------------- | ---------------- | -------- |
| JS gzip  | 90.44 kB          | 90.66 kB         | +0.22 kB |
| CSS gzip | 4.43 kB           | 4.43 kB          | 0 kB     |

Config-only addition (one new service config, one registry entry, no new
components) — grows minimally as required.
