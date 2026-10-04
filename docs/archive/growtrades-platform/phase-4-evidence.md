# Phase 4 Evidence Report

_Compiled: 2026-05-30 — Covers Steps 4.0 through 4.6 (Phase 4 complete)_

## Gate Results

### JavaScript / TypeScript (apps/wizard)

| Gate             | Result                                                       |
| ---------------- | ------------------------------------------------------------ |
| `pnpm lint`      | 0 errors, 0 warnings                                         |
| `pnpm typecheck` | 0 errors (production + test tsconfig)                        |
| `pnpm test`      | **312 / 312 passing** (16 test files)                        |
| `pnpm build`     | Clean. 227.7 kB JS (67.1 kB gzip), 15.1 kB CSS (3.7 kB gzip) |

No source maps shipped to plugin assets (build pipeline guard in place).

### PHP (plugins/quote-wizard)

| Gate               | Result                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| `composer lint`    | 0 errors, 0 warnings (PHPCS)                                                                   |
| `composer analyse` | No errors (PHPStan level 8)                                                                    |
| `composer test`    | Exit 0 — 10 tests discovered: 2 Example + 3 PublicConfig + 3 Settings + 8 SubmissionController |

PHP toolchain: pest 2.33.2 / phpunit 10.5.9 / PHP 8.1.12 (fixed in Step 4.6 Commit 1 — sebastian/version 5.x used `readonly class`, a PHP 8.2-only syntax).

## Step 4.6 Evidence

### Acceptance criteria checklist

| #   | Criterion                                                                                                                                                    | Status                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| 1   | PHP toolchain runs locally; 4.5 PublicConfig PHP tests pass                                                                                                  | ✅ Verified                                                    |
| 2   | Bundle baseline captured before 4.6 frontend additions                                                                                                       | ✅ `docs/bundle-baseline-4.6.md`                               |
| 3   | `tsconfig.test.json` carries explanatory comment                                                                                                             | ✅                                                             |
| 4   | `wp_goqw_submissions` has `status`, `forwarded_at`, `forward_error`, `forward_attempted_at`, `wizard_id`, `answers_json`, `pricing_json`, `client_timestamp` | ✅ Schema redesigned in Commit 2                               |
| 5   | SubmissionController validates → persists → forwards in strict order                                                                                         | ✅ PHP test "calls repository insert before forwarder forward" |
| 6   | Forward success → 200 `{ reference }` + row `status='forwarded'`                                                                                             | ✅ PHP test passes                                             |
| 7   | Forward failure → 502 `{ errorCode, submissionId }` + row `status='forward_failed'`                                                                          | ✅ PHP test passes                                             |
| 8   | Persistence failure → 500; forwarder never called                                                                                                            | ✅ PHP test passes                                             |
| 9   | Validation failure → 400; nothing persisted or forwarded                                                                                                     | ✅ PHP test passes                                             |
| 10  | `httpSubmissionPort` implements `SubmissionPort` exactly                                                                                                     | ✅ TypeScript + 11 unit tests                                  |
| 11  | 200 → ok:true+reference; 502 → forwarder_unavailable; 4xx/5xx/network/timeout → typed errors                                                                 | ✅ All 11 HTTP port tests pass                                 |
| 12  | Port performs no internal retries                                                                                                                            | ✅ "fetch called exactly once" test passes                     |
| 13  | FSM round-trip: REQUEST → submitting → 200 → submit_success; RETRY after 502 → success                                                                       | ✅ 4 lifecycle integration tests pass                          |
| 14  | App.tsx uses httpSubmissionPort in production; dev fallback when `restUrl===''`                                                                              | ✅ Code review + `pnpm dev` still works                        |
| 15  | ADR-0015 created; ADR-0001 and ADR-0005 amended                                                                                                              | ✅                                                             |
| 16  | All gates green: lint 0/0, typecheck 0, Vitest 312/312, build clean, Pest exit 0                                                                             | ✅                                                             |

### New test breakdown

| Suite                            | File                                                 | Tests  |
| -------------------------------- | ---------------------------------------------------- | ------ |
| HTTP port unit                   | `src/runtime/__tests__/http-submission-port.test.ts` | 11     |
| Submission lifecycle integration | `src/runtime/__tests__/submission-lifecycle.test.ts` | 4      |
| PHP SubmissionController         | `tests/Unit/SubmissionControllerTest.php`            | 8      |
| **Total new**                    |                                                      | **23** |

Previous total (Step 4.5): 297 Vitest + existing PHP
Current total: **312 Vitest** + **10 PHP** (3 PublicConfig + 3 Settings + 2 Example + 8 SubmissionController)

### Bundle delta

| Metric  | Before (Step 4.5) | After (Step 4.6) | Delta   |
| ------- | ----------------- | ---------------- | ------- |
| JS raw  | 225.6 kB          | 227.7 kB         | +2.1 kB |
| JS gzip | 66.4 kB           | 67.1 kB          | +0.7 kB |
| CSS     | 15.1 kB           | 15.1 kB          | 0       |

Step 4.6 adds `httpSubmissionPort` (~1.5 kB minified) + `WizardStore.buildRequest()`.
No new npm dependencies; `rollup-plugin-visualizer` is devDep-only.

## Commits (Step 4.6)

| Commit    | Description                                                                |
| --------- | -------------------------------------------------------------------------- |
| `49e4eab` | chore: Step 4.5 close-out — PHP toolchain, bundle baseline, tsconfig note  |
| `411ef9c` | feat(submissions): repository, forwarder, schema — PHP submissions module  |
| `1a52cd8` | feat(rest): SubmissionController — real submit endpoint (ADR-0015)         |
| `e828310` | feat(wizard): httpSubmissionPort + SubmissionPort redesign                 |
| `afa747d` | test(wizard): submission lifecycle integration tests                       |
| `efd4c35` | refactor(wizard): App.tsx wires httpSubmissionPort; dev fallback preserved |
| `47ddac6` | docs: ADR-0015, amendments to ADR-0001/0005, handoff/current-state updates |

## Known Gaps (carried forward to Phase 5)

- Idempotency key for duplicate POST on user SUBMIT_RETRY (ADR-0015 future work)
- Rate limiting on `qw/v1/submit` (ADR-0015 future work)
- Component tests (StepRenderer, field renderers) require jsdom Vitest config
- `h-10` Tailwind utility gap in spacing scale (visual-only, no regression)
- Make.com workflow design owns end-to-end lead deduplication
- ServiceSelector + ServiceCard have no rendering tests (jsdom deferred)
- ServiceSelector mounts at App.tsx root in Phase 4; migrates to QuotePage in Phase 5

---

## Step 4.7 Evidence

_Compiled: 2026-06-01 — Service Abstraction Layer_

### Gate Results

| Gate               | Result                                                                              |
| ------------------ | ----------------------------------------------------------------------------------- |
| `pnpm lint`        | 0 errors, 0 warnings                                                                |
| `pnpm typecheck`   | 0 errors (production + test tsconfig)                                               |
| `pnpm test`        | **337 / 337 passing** (19 test files)                                               |
| `pnpm build`       | Clean. 231.83 kB JS (67.88 kB gzip), 15.78 kB CSS (3.73 kB gzip)                    |
| `composer lint`    | 0 errors, 0 warnings (PHPCS)                                                        |
| `composer analyse` | No errors (PHPStan level 8)                                                         |
| `composer test`    | Exit 0 — 20 tests: 2 Example + 7 PublicConfig + 3 Settings + 8 SubmissionController |

### Acceptance Criteria

| #   | Criterion                                                                         | Status                       |
| --- | --------------------------------------------------------------------------------- | ---------------------------- |
| 1   | Registry contains fencing and decking entries                                     | ✅                           |
| 2   | Decking config passes validateWizardConfig and validatePricingConfig              | ✅                           |
| 3   | listEnabledServiceIds() without override returns all registered services in order | ✅                           |
| 4   | listEnabledServiceIds([]) returns all registered services                         | ✅                           |
| 5   | listEnabledServiceIds(['fencing']) returns ['fencing']                            | ✅                           |
| 6   | listEnabledServiceIds filters unknown ids out                                     | ✅                           |
| 7   | resolveService returns same SessionConfig as resolveVertical                      | ✅                           |
| 8   | PublicConfigSchema accepts enabledServiceIds: ['fencing','decking'], [], omitted  | ✅                           |
| 9   | PublicConfigSchema rejects enabledServiceIds: [''], 'fencing', mixed types        | ✅                           |
| 10  | PHP PublicConfig::build() omits field when option is empty                        | ✅                           |
| 11  | PHP PublicConfig::build() emits array, trims whitespace, handles CSV              | ✅                           |
| 12  | goqw_enabled_services seeded by Activator; option count is 10                     | ✅ (10 options)              |
| 13  | goqw_enabled_services removed by uninstall (dynamic LIKE query)                   | ✅                           |
| 14  | When services.length === 1, App auto-selects — selector NOT shown                 | ✅ Manual smoke              |
| 15  | When services.length > 1, App renders ServiceSelector until user picks            | ✅ Manual smoke              |
| 16  | Selecting fencing mounts fencing wizard; selecting decking mounts decking wizard  | ✅ Manual smoke              |
| 17  | Both wizards complete end-to-end against devSubmissionPort                        | ✅ Manual smoke              |
| 18  | FSM core (src/domain/runtime/\*\*) is unchanged                                   | ✅ git diff shows no changes |
| 19  | Pricing engine is unchanged                                                       | ✅ git diff                  |
| 20  | Submission port and HTTP adapter are unchanged                                    | ✅ git diff                  |
| 21  | WordPress REST controller, repository, forwarder are unchanged                    | ✅ git diff                  |
| 22  | Wizard rendering tree is unchanged                                                | ✅ git diff                  |
| 23  | All gates green                                                                   | ✅                           |
| 24  | Bundle gzip within +15 kB of post-4.6 baseline (67.1 kB)                          | ✅ +0.78 kB                  |
| 25  | No new dependencies added                                                         | ✅                           |
| 26  | ADR-0013, 0009, 0015 amendments landed; onboarding + technical-debt updated       | ✅                           |

### New Test Breakdown (Step 4.7)

| Suite                                      | File                                                        | Tests  |
| ------------------------------------------ | ----------------------------------------------------------- | ------ |
| Service selection API                      | `src/domain/registry/__tests__/services.test.ts`            | 11     |
| Decking fixture validation                 | `src/domain/fixtures/__tests__/decking-validation.test.ts`  | 2      |
| PublicConfig enabledServiceIds (new cases) | `src/domain/__tests__/error-tone-and-public-config.test.ts` | 6      |
| Service selection helper logic             | `src/__tests__/service-selection.test.ts`                   | 6      |
| PHP PublicConfig enabledServiceIds (new)   | `tests/Unit/PublicConfigTest.php`                           | 4      |
| **Total new**                              |                                                             | **29** |

Previous total (Step 4.6): 312 Vitest + 10 PHP
Current total: **337 Vitest** + **20 PHP**

### Bundle Delta

| Metric  | Before (Step 4.6) | After (Step 4.7) | Delta    |
| ------- | ----------------- | ---------------- | -------- |
| JS raw  | 227.7 kB          | 231.83 kB        | +4.13 kB |
| JS gzip | 67.1 kB           | 67.88 kB         | +0.78 kB |
| CSS     | 15.1 kB           | 15.78 kB         | +0.68 kB |

New additions: ServiceSelector + ServiceCard (~1.5 kB minified), decking.config.ts
(~2 kB), services.ts (~0.5 kB). No new npm dependencies.

### Commits (Step 4.7)

| Commit    | Description                                                             |
| --------- | ----------------------------------------------------------------------- |
| `3e9b4fe` | docs: ADR amendments for service abstraction (0013, 0009, 0015)         |
| `4e979c0` | feat(domain): ServiceId and ServiceConfig type aliases                  |
| `286b0f5` | feat(domain): decking reference vertical fixture                        |
| `9d39ba5` | feat(registry): service selection API + decking registered              |
| `3d36d1f` | feat(domain): PublicConfig optional enabledServiceIds field             |
| `0b84d67` | feat(plugin): PHP PublicConfig emits enabledServiceIds when configured  |
| `ec55bbc` | feat(selection): ServiceSelector + ServiceCard components               |
| `fb2fe7a` | refactor(app): per-session service selection with single-service bypass |

---

## Step 4.8 — Photo Upload Pipeline (2026-06-04)

### Gates

| Gate               | Result                                                                 |
| ------------------ | ---------------------------------------------------------------------- |
| `pnpm lint`        | 0 errors, 0 warnings                                                   |
| `pnpm typecheck`   | 0 errors                                                               |
| `pnpm test`        | **384 / 384 passing** (24 test files, +22 from Step 4.8)               |
| `pnpm -r build`    | Clean. 246.81 kB JS (72.75 kB gzip), 17.31 kB CSS (4.03 kB gzip)       |
| `composer lint`    | 0 errors, 0 warnings                                                   |
| `composer analyse` | No errors                                                              |
| `composer test`    | **82 / 82 passing**, 2 skipped (GD unavailable for real JPEG fixtures) |

### Bundle delta

| Step | JS gzip  | Delta    |
| ---- | -------- | -------- |
| 5.1  | 70.61 kB | baseline |
| 4.8  | 72.75 kB | +2.14 kB |

No new JS dependencies. Photo compression uses native canvas API.

### Acceptance criteria (from spec)

| #   | Criterion                                                         | Verified by                      |
| --- | ----------------------------------------------------------------- | -------------------------------- |
| 1   | Multi-photo field accepts up to maxCount files, rejects beyond    | Client-side guard                |
| 2   | Files >5 MB rejected before compression                           | PhotoField validation            |
| 3   | Compressed images preserve aspect ratio within 1px                | scaleToFit tests                 |
| 4   | Compressed JPEG output format confirmed                           | compressImage returns image/jpeg |
| 5   | Total >9 MB rejected client-side                                  | PhotoField total check           |
| 6   | sessionStorage does not grow with photo count (metadata only)     | PhotoStore arch                  |
| 7   | Navigation away/back: metadata persists, photos need re-attach    | PhotoStore lifecycle             |
| 8   | Review step shows re-attach indicator for metadata-without-base64 | ReviewField + annotation         |
| 9   | Submit disabled when any photo metadata lacks base64              | StepRenderer gate                |
| 10  | Server rejects MIME mismatch (content_mismatch)                   | MediaValidatorTest               |
| 11  | Server rejects total >10 MB                                       | MediaValidatorTest               |
| 12  | 400 response body contains mediaIssues[]                          | SubmissionControllerTest         |
| 13  | Persistence does NOT happen when media validation fails           | SubmissionControllerTest         |
| 14  | media_json column added via dbDelta                               | Schema.php                       |
| 15  | Forwarder carries media payload to Make.com                       | Forwarder.php                    |
| 16  | F1 fixed: onboarding option count consistent throughout           | docs/onboarding.md               |
| 17  | F2 fixed: roadmap deferred section references technical-debt.md   | docs/roadmap.md                  |
| 18  | F3 fixed: bundle-baseline.md is the single rolling file           | docs/bundle-baseline.md          |
| 19  | F4 fixed: current_request_path consolidated into SiteRoutes       | SiteRoutes.php                   |
| 20  | FSM transition.ts byte-unchanged                                  | git diff                         |
| 21  | No new endpoints                                                  | Code review                      |
| 22  | All gates green                                                   | Above                            |
| 23  | Make.com deployment prerequisite documented                       | onboarding.md                    |
| 24  | Retention policy documented as deferred                           | technical-debt.md                |

### New files

| File                                                      | Purpose                                                    |
| --------------------------------------------------------- | ---------------------------------------------------------- |
| `apps/wizard/src/domain/runtime/photos.ts`                | PhotoMetadata, PhotoAnswerValue, PhotoFilePayload, guard   |
| `apps/wizard/src/utils/image-compression.ts`              | compressImage, scaleToFit, blobToBase64                    |
| `apps/wizard/src/runtime/photos-store.ts`                 | PhotoStore class + generateFileId                          |
| `apps/wizard/src/runtime/hooks/usePhotoStore.ts`          | usePhotoStore hook                                         |
| `apps/wizard/src/runtime/submission-media.ts`             | createPhotoEnrichedPort (base64 enrichment at submit time) |
| `plugins/quote-wizard/src/Submissions/MediaValidator.php` | Server-side 6-step media validation                        |

### Commits

| Hash      | Message                                                                           |
| --------- | --------------------------------------------------------------------------------- |
| `adb8741` | docs: ADR-0015 amendment (media payload); ADR-0012 photo thumbnail clarification  |
| `a641653` | refactor(plugin): consolidate current_request_path into SiteRoutes (F4)           |
| `c0a08c3` | feat(wizard): PhotoAnswerValue type; answer-validation handles photo fields       |
| `98be0ec` | feat(wizard): image-compression utility (scaleToFit, blobToBase64, compressImage) |
| `1a7b6a7` | feat(wizard): PhotoStore, generateFileId, usePhotoStore hook; PhotoStoreContext   |
| `623bf8e` | feat(wizard): WizardProvider provides PhotoStore; photo-enriched submission port  |
| `7eeec7c` | feat(wizard): multi-photo PhotoField; ReviewField photo summary; submit gate      |
| `b64d4ac` | feat(plugin): MediaValidator + SubmissionController media integration             |
| `24b5f85` | feat(plugin): media_json column via dbDelta; SubmissionRepository + Forwarder     |
