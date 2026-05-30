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
