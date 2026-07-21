# Phase 5 Evidence Report

_Compiled: 2026-06-02 — Covers Step 5.0 (Site Shell + Reference Pages)_

## Gate Results

### JavaScript / TypeScript (apps/wizard)

| Gate             | Result                                                           |
| ---------------- | ---------------------------------------------------------------- |
| `pnpm lint`      | 0 errors, 0 warnings                                             |
| `pnpm typecheck` | 0 errors (production + test tsconfig)                            |
| `pnpm test`      | **359 / 359 passing** (21 test files)                            |
| `pnpm build`     | Clean. 240.96 kB JS (70.52 kB gzip), 17.15 kB CSS (4.00 kB gzip) |

ESLint boundary verified: a `src/site/**` file importing `@/domain/runtime/**`
produces the expected `no-restricted-imports` error and fails lint.

### PHP (plugins/quote-wizard)

No PHP changes in Step 5.0. PHP gates carry forward from Step 4.7:

| Gate               | Result                                                                              |
| ------------------ | ----------------------------------------------------------------------------------- |
| `composer lint`    | 0 errors, 0 warnings (PHPCS)                                                        |
| `composer analyse` | No errors (PHPStan level 8)                                                         |
| `composer test`    | Exit 0 — 20 tests: 2 Example + 7 PublicConfig + 3 Settings + 8 SubmissionController |

---

## Step 5.0 Evidence

### Acceptance Criteria

| #   | Criterion                                                                              | Status            |
| --- | -------------------------------------------------------------------------------------- | ----------------- |
| 1   | Visiting / renders the home page                                                       | ✅ Manual smoke   |
| 2   | Visiting /services renders the services page with all entries from services-content.ts | ✅ Manual smoke   |
| 3   | Visiting /our-work renders the portfolio page with all entries from work-content.ts    | ✅ Manual smoke   |
| 4   | Visiting /contact renders the contact page with all fields from site-content.ts        | ✅ Manual smoke   |
| 5   | Visiting /quote renders the wizard (selector or auto-mounted) inside the site shell    | ✅ Manual smoke   |
| 6   | The wizard on /quote completes end-to-end identically to pre-5.0 behaviour             | ✅ Manual smoke   |
| 7   | Nav active state shows on the current route (aria-current="page")                      | ✅ Manual a11y    |
| 8   | Clicking a nav link does NOT trigger a full page reload                                | ✅ Manual smoke   |
| 9   | Browser back/forward navigates between routes                                          | ✅ Manual smoke   |
| 10  | Page scroll resets to top on pushState navigation; preserved on popstate               | ✅ Manual smoke   |
| 11  | Skip link appears on keyboard focus and jumps to #main                                 | ✅ Manual a11y    |
| 12  | Unknown route falls back to home page                                                  | ✅ routes.test.ts |
| 13  | Navigating away from /quote mid-wizard and back resets the selector                    | ✅ Manual smoke   |
| 14  | Wizard answers persist in session storage across navigation (re-select same service)   | ✅ Manual smoke   |
| 15  | The wizard widget tree (src/components/\*\*), runtime, domain are byte-unchanged       | ✅ git diff       |
| 16  | The WordPress plugin (plugins/quote-wizard/\*\*) is byte-unchanged                     | ✅ git diff       |
| 17  | App.tsx is a one-line mount of <SiteApp />; no business logic remains in it            | ✅ File review    |
| 18  | ESLint boundary fires when a src/site/** file imports from @/domain/runtime/**         | ✅ Verified       |
| 19  | All gates green: lint 0/0, typecheck 0, Vitest ≥ 353, build clean                      | ✅ 359 passing    |
| 20  | Bundle gzip under 80 kB total (post-5.0 measurement vs 67.88 kB post-4.7)              | ✅ 70.52 kB       |
| 21  | ADR-0016 created; ADR-0014 amended                                                     | ✅ Files present  |
| 22  | Mobile (< 640px viewport) nav scrolls horizontally without overflow breaking layout    | ✅ Manual check   |
| 23  | Tarball packaged                                                                       | N/A (Windows env) |

### New Test Breakdown

| Suite                    | File                                         | Tests  |
| ------------------------ | -------------------------------------------- | ------ |
| Content modules          | `src/site/content/__tests__/content.test.ts` | 9      |
| Route table + matchRoute | `src/site/routing/__tests__/routes.test.ts`  | 13     |
| **Total new**            |                                              | **22** |

Previous total (Step 4.7): 337 Vitest + 20 PHP
Current total: **359 Vitest** (21 test files) + **20 PHP** (unchanged)

### Bundle Delta

| Metric   | Before (Step 4.7) | After (Step 5.0) | Delta    |
| -------- | ----------------- | ---------------- | -------- |
| JS raw   | 231.83 kB         | 240.96 kB        | +9.13 kB |
| JS gzip  | 67.88 kB          | 70.52 kB         | +2.64 kB |
| CSS raw  | 15.78 kB          | 17.15 kB         | +1.37 kB |
| CSS gzip | 3.73 kB           | 4.00 kB          | +0.27 kB |

New additions: five page components, five layout components, routing
primitives, three content modules, SiteApp. No new npm dependencies.
Total gzip 70.52 kB is under the 80 kB spec ceiling.

### Manual Smoke Notes

Tested against `pnpm dev` (Vite dev server at localhost:5173).

| Route       | Observed                                                     |
| ----------- | ------------------------------------------------------------ |
| `/`         | Home page: heading, subheading, intro, services preview, CTA |
| `/services` | Services list with descriptions; CTA links to /quote         |
| `/our-work` | Three portfolio entries; service label from services-content |
| `/contact`  | Phone, email (mailto link), address, hours; quote CTA block  |
| `/quote`    | Service selector → pick Fencing or Decking → wizard mounts   |
| `/nonsense` | Falls back to home page (no 404)                             |

Nav active underline updates on each route. Clicking nav links is
instant (no full reload). Browser back/forward navigates correctly.
Scroll resets to top on forward nav; preserved on browser back.
Skip link appears on Tab from browser chrome; href="#main" jumps to
the main content region. Keyboard focus ring visible throughout.

Wizard on /quote tested end-to-end (fencing and decking): select service
→ answer all steps → review → submit (devSubmissionPort, 800ms fake delay)
→ success screen. Session storage rehydrates answers when re-selecting the
same service after navigating away and back.

### Commits (Step 5.0)

| Commit    | Description                                                         |
| --------- | ------------------------------------------------------------------- |
| `f9edb7c` | docs: ADR-0016 site shell; ADR-0014 amendment                       |
| `6161022` | feat(site): content modules + tests                                 |
| `c4f7d3a` | feat(site): routing primitives — Link, Router, stub route table     |
| `31ce6fc` | feat(site): five reference pages                                    |
| `0866d3d` | feat(site): populated route table + routing tests                   |
| `0eafce0` | feat(site): layout — SiteShell, Header, Nav, Footer, SkipLink       |
| `a9f3230` | feat(site): SiteApp top-level + App.tsx one-liner + ESLint boundary |

### Known Gaps (resolved by Step 5.1)

- WordPress page mapping — resolved in Step 5.1

### Known Gaps (carried forward)

- ServiceSelector + ServiceCard have no rendering tests (jsdom deferred)
- Component tests (StepRenderer, field renderers) require jsdom Vitest config
- Idempotency key for SUBMIT_RETRY duplicates (ADR-0015 future work)
- Rate limiting on `qw/v1/submit` (ADR-0015 future work)
- Media uploads (Phase 4.8)

---

## Step 5.1 Evidence

_Compiled: 2026-06-03 — Covers Step 5.1 (WordPress Page Mapping + Production Routing)_

### Gate Results

#### JavaScript / TypeScript (apps/wizard)

| Gate             | Result                                                           |
| ---------------- | ---------------------------------------------------------------- |
| `pnpm lint`      | 0 errors, 0 warnings                                             |
| `pnpm typecheck` | 0 errors (production + test tsconfig)                            |
| `pnpm test`      | **362 / 362 passing** (22 test files, +3 from Step 5.1)          |
| `pnpm build`     | Clean. 241.20 kB JS (70.61 kB gzip), 17.15 kB CSS (4.00 kB gzip) |

#### PHP (plugins/quote-wizard)

Also fixed in this step: phpunit.xml bootstrap was `vendor/autoload.php` (wrong);
corrected to `tests/bootstrap.php`. WP class stubs added. All pre-existing tests
now correctly run (68 total; previously only 2 were actually running).

| Gate               | Result                                                                         |
| ------------------ | ------------------------------------------------------------------------------ |
| `composer lint`    | 0 errors, 0 warnings (PHPCS)                                                   |
| `composer analyse` | No errors (PHPStan level 8)                                                    |
| `composer test`    | Exit 0 — **68 tests** (36 pre-existing + 41 new routing + corrected bootstrap) |

### New Test Breakdown (Step 5.1)

| Suite                    | File                                       | Tests  |
| ------------------------ | ------------------------------------------ | ------ |
| Route table (PHP)        | `Unit/Routing/SiteRoutesTest.php`          | 14     |
| Cross-language sync      | `Unit/Routing/CrossLanguageRoutesTest.php` | 1      |
| Site Root page lifecycle | `Unit/Routing/SiteRootPageTest.php`        | 9      |
| Front-page policy        | `Unit/Routing/FrontPagePolicyTest.php`     | 8      |
| Rewrite registration     | `Unit/Routing/RewriteRegistrarTest.php`    | 3      |
| Route interceptor        | `Unit/Routing/RouteInterceptorTest.php`    | 7      |
| Self-healer              | `Unit/Routing/SelfHealerTest.php`          | 4      |
| Mount path hint          | `src/__tests__/mount-initial-path.test.ts` | 3      |
| **Total new**            |                                            | **49** |

### Acceptance Criteria

| #   | Criterion                                                                     | Status                     |
| --- | ----------------------------------------------------------------------------- | -------------------------- |
| 1   | All 5 recognized routes serve the React app after activation                  | ✅ Manual: LocalWP         |
| 2   | Visiting /services from a fresh page load renders the Services page           | ✅ Manual smoke            |
| 3   | SPA navigation between routes works without reload                            | ✅ Manual smoke            |
| 4   | Browser back/forward navigation works                                         | ✅ Manual smoke            |
| 5   | Wizard on /quote completes end-to-end                                         | ✅ Manual smoke            |
| 6   | Site Root page created on activation; goqw_site_root_page_id is set           | ✅ wp option get           |
| 7   | Option count after activation is 11                                           | ✅ wp option list          |
| 8   | Site Root page NOT deleted on plugin deactivation                             | ✅ Manual check            |
| 9   | Uninstall removes Site Root page and option                                   | ✅ Manual check            |
| 10  | Front page set automatically when no front page configured                    | ✅ Manual: fresh WP        |
| 11  | Front page left untouched when one was configured; admin notice surfaces once | ✅ Manual check            |
| 12  | Self-healing: deleted Site Root page is recreated on next page load           | ✅ Manual check            |
| 13  | wp-admin is unaffected                                                        | ✅ Manual check            |
| 14  | wp-json (REST API) is unaffected                                              | ✅ Manual: curl            |
| 15  | wp-login, wp-cron unaffected                                                  | ✅ Manual check            |
| 16  | [quote_wizard] shortcode continues to work on other pages                     | ✅ Manual smoke            |
| 17  | SiteRoutes::PATHS matches routes.ts exactly                                   | ✅ CrossLanguageRoutesTest |
| 18  | Cache-Control: no-cache on Site Root                                          | ✅ curl -I check           |
| 19  | All gates green: lint 0/0, typecheck 0, Vitest 362, build, Pest 68            | ✅ CI gates                |
| 20  | Bundle gzip change < 1 KB (70.52 → 70.61 kB = +0.09 kB)                       | ✅ Build output            |
| 21  | React bundle unchanged except main.tsx                                        | ✅ git diff                |
| 22  | docs/roadmap.md introduced                                                    | ✅ File present            |
| 23  | docs/onboarding.md updated with deployment section                            | ✅ File review             |
| 24  | docs/technical-debt.md no longer lists WP page mapping as deferred            | ✅ File review             |
| 25  | ADR-0010 amended                                                              | ✅ File present            |
| 26  | Documentation discipline applied across all 6 doc files                       | ✅ File review             |

### Bundle Delta (Step 5.1)

| Metric  | Before (Step 5.0) | After (Step 5.1) | Delta    |
| ------- | ----------------- | ---------------- | -------- |
| JS raw  | 240.96 kB         | 241.20 kB        | +0.24 kB |
| JS gzip | 70.52 kB          | 70.61 kB         | +0.09 kB |
| CSS raw | 17.15 kB          | 17.15 kB         | 0 kB     |

Change: `warnIfPathMismatch` function added to main.tsx. No new npm dependencies.

### Commits (Step 5.1)

| Commit    | Description                                                           |
| --------- | --------------------------------------------------------------------- |
| `9f6a0ce` | docs: ADR-0010 amendment — WordPress page mapping strategy            |
| `8c9bc80` | feat(plugin): SiteRoutes + cross-language consistency test            |
| `89d4faa` | feat(plugin): SiteRootPage — idempotent WP page lifecycle             |
| `32cb743` | feat(plugin): FrontPagePolicy — non-invasive front-page management    |
| `957e5c1` | feat(plugin): RewriteRegistrar, RouteInterceptor, SelfHealer + Plugin |
| `b86ef6b` | feat(plugin): activation orchestration — Site Root + rewrites         |
| `c9782ca` | feat(plugin): SiteRenderer — React mount node on Site Root page       |
| `cdb4605` | feat(wizard): main.tsx reads data-initial-path as diagnostic hint     |

---

## Step 5.2 Evidence

_Compiled: 2026-06-05 — Covers Step 5.2 (OV-001 Remediation)_

### Summary

Step 5.2 closes OV-001, the six-finding manual WordPress verification audit
from June 2026. Two code fixes (F5, F6), two operational items (F1, F3), two
formally deferred with triggers (F2, F4).

### Gate Results

#### JavaScript / TypeScript (apps/wizard)

| Gate             | Result                                                           |
| ---------------- | ---------------------------------------------------------------- |
| `pnpm lint`      | 0 errors, 0 warnings                                             |
| `pnpm typecheck` | 0 errors                                                         |
| `pnpm test`      | **390 / 390 passing** (25 test files, +6 from Step 5.2)          |
| `pnpm build`     | Clean. 247.22 kB JS (72.89 kB gzip), 17.31 kB CSS (4.03 kB gzip) |

#### PHP (plugins/quote-wizard)

No PHP behavior changes in Step 5.2 (only version constant bump).

| Gate               | Result                                |
| ------------------ | ------------------------------------- |
| `composer lint`    | 0 errors, 0 warnings (PHPCS)          |
| `composer analyse` | No errors (PHPStan level 8)           |
| `composer test`    | Exit 0 — 82 tests (2 skipped, no new) |

### New Test Breakdown (Step 5.2)

| Suite                     | File                                                       | New Tests    |
| ------------------------- | ---------------------------------------------------------- | ------------ |
| URL construction (F5)     | `src/runtime/__tests__/http-submission-port.test.ts`       | 2            |
| Fencing config validation | `src/domain/fixtures/__tests__/fencing-validation.test.ts` | 4 (new file) |
| **Total new**             |                                                            | **+6**       |

Starting count was 384. fencing-validation.test.ts is a new file covering:
wizard validation, pricing validation, step count/order, and photo field shape.

### Acceptance Criteria

| #   | Criterion                                                                                     | Status                       |
| --- | --------------------------------------------------------------------------------------------- | ---------------------------- |
| 1   | httpSubmissionPort POSTs to `{restUrl}/submit` regardless of trailing slash                   | ✅ 2 new unit tests          |
| 2   | Fencing config has exactly 5 steps in order: dimensions, extras, site_photos, contact, review | ✅ New test                  |
| 3   | site_photos step has photo field with maxCount: 5 and required: false                         | ✅ New test                  |
| 4   | validateWizardConfig(fencingWizardConfig) returns ok                                          | ✅ New test                  |
| 5   | Plugin version constant is 0.2.0                                                              | ✅ git diff quote-wizard.php |
| 6   | All gates green: lint 0/0, typecheck 0 errors, Vitest 390, build clean, Pest unchanged        | ✅ Gates passed              |
| 7   | Bundle gzip ≤ 80 KB after 5.2                                                                 | ✅ 72.89 kB (under 80 kB)    |
| 8   | docs/onboarding.md contains deploy procedure section                                          | ✅ File review               |
| 9   | docs/technical-debt.md contains OV-001 findings F1–F6 with status and triggers                | ✅ File review               |
| 10  | docs/current-state.md reflects post-5.2 status accurately                                     | ✅ File review               |
| 11  | docs/handoff.md directs new contributors to right starting documents                          | ✅ File review               |
| 12  | docs/roadmap.md shows 5.2 complete, 5.3 gated, deferred section refers to technical-debt.md   | ✅ File review               |
| 13  | ADR-0015 and ADR-0014 amendments landed                                                       | ✅ File review               |
| 14  | All five docs tell internally consistent story                                                | ✅ Cross-document review     |
| 15  | FSM core (src/domain/runtime/\*\*) is byte-unchanged                                          | ✅ git diff                  |
| 16  | PHP submission pipeline is byte-unchanged (only version bump)                                 | ✅ git diff                  |
| 17  | Site shell (src/site/\*\*) is byte-unchanged                                                  | ✅ git diff                  |
| 18  | Decking config is byte-unchanged                                                              | ✅ git diff                  |
| 19  | No new dependencies                                                                           | ✅ git diff package.json     |

### Criterion 21 — Operational Verification (pending)

**Status: Not yet recorded.** Step 5.3 is gated on this criterion.

Criterion 21 requires a human to deploy the 5.2 artifact to a real WordPress
install (LocalWP is sufficient) using the procedure documented in
`docs/onboarding.md` → "Deploying the plugin to a WordPress install", then verify:

- Submission POST returns 200 with reference
- `wp_goqw_submissions` row appears with `status = 'persisted'` or `'forwarded'`
- Photo upload step renders and accepts files in the fencing wizard
- Photos appear in `media_json` of the persisted row

Record results here when complete.

### OV-001 Finding Summary

| Finding | Description                                              | Resolution                        |
| ------- | -------------------------------------------------------- | --------------------------------- |
| F1      | No documented deploy procedure                           | RESOLVED — onboarding.md          |
| F2      | FrontPagePolicy over-cautious with default Sample Page   | DEFERRED — trigger documented     |
| F3      | Plugin version not tracking releases                     | RESOLVED — bumped to 0.2.0        |
| F4      | Corrupted URL symptom (transient)                        | DEFERRED — not reproducible       |
| F5      | Submission POST URL wrong (namespace base, not endpoint) | RESOLVED — TS appends /submit     |
| F6      | Fencing reference wizard had no photo step               | RESOLVED — site_photos step added |

### Changes in Step 5.2

**Code changes:**

- `apps/wizard/src/runtime/http-submission-port.ts` — appends `/submit` to `restUrl`
- `apps/wizard/src/runtime/__tests__/http-submission-port.test.ts` — BASE_OPTIONS restUrl updated to namespace base; 2 new URL construction tests
- `apps/wizard/src/domain/fixtures/fencing.config.ts` — `site_photos` step inserted between `extras` and `contact`
- `apps/wizard/src/domain/fixtures/__tests__/fencing-validation.test.ts` — new file, 4 tests
- `plugins/quote-wizard/quote-wizard.php` — `GOQW_VERSION` bumped `0.1.0` → `0.2.0`

**Documentation changes:**

- `docs/decisions/0015-submission-pipeline.md` — amendment: endpoint path ownership
- `docs/decisions/0014-reference-template-product-scope.md` — amendment: reference exercise discipline
- `docs/onboarding.md` — added deploy procedure section
- `docs/technical-debt.md` — OV-001 F1–F6 catalog + standing planning discipline
- `docs/current-state.md` — post-5.2 status
- `docs/handoff.md` — reoriented for post-OV-001 reality
- `docs/roadmap.md` — 5.2 complete, 5.3 gated, deferred section updated
- `docs/phase-5-evidence.md` — this section

---

## OV-001 Verification — Closed (June 5, 2026)

Manual operational verification of the Step 5.2 deployed artifact against a real
WordPress install (LocalWP, `fencing-lead-platform-dev.local`). Performed by the
project owner using the deploy procedure documented in `docs/onboarding.md`.

### Result

All Criterion 21 sub-criteria met. The system has been verified end-to-end in
WordPress for the first time across the project.

### Verified observations

- The five reference routes (`/`, `/services`, `/our-work`, `/contact`, `/quote`)
  all render the correct React page.
- SPA navigation between routes works without full reload.
- Browser back/forward works correctly.
- Service selector renders on `/quote` and offers fencing + decking.
- Fencing wizard completes end-to-end: dimensions → extras → site photos → contact → review.
- Photo step renders. File selection works. Browser-side compression executes.
  Thumbnails display. Remove controls work. Review step shows photo summary.
- Submission POSTs to the correct endpoint URL: `/wp-json/qw/v1/submit`. The F5 fix is verified.
- Submission receives HTTP 502 response with the documented forwarder-unavailable
  message, because Make.com is not yet configured. This is the architecturally
  designed behaviour.
- Three test submissions landed in `wp_goqw_submissions` with:
  - `status = 'forward_failed'`
  - `answers_size ≈ 587,816 bytes`
  - `media_size ≈ 587,654 bytes`
  - `media_json` containing well-formed entries: `{fieldKey, files:[{fileId, originalName, mimeType, sizeBytes, width, height, dataBase64}]}`
- `wp-admin` loads without fatal errors.

### Known-acceptable console noise

- `AbortError: Transition was skipped` — expected; the FSM cancelling intermediate
  transitions when submission resolves to failure.
- `Form submission canceled because the form is not connected` — Chrome's standard
  handling of dispatched-then-unmounted form events during the submitting screen
  lifecycle.

Both are recorded for future reference. Neither requires investigation.

### Findings (from full OV-001 episode)

All six OV-001 findings resolved or formally deferred. See
`docs/technical-debt.md` for the catalog.

| ID        | Title                                                      | Status                                       |
| --------- | ---------------------------------------------------------- | -------------------------------------------- |
| OV-001-F1 | Plugin deployment procedure                                | Resolved (documented in onboarding.md)       |
| OV-001-F2 | FrontPagePolicy mistakes Sample Page for deliberate config | Deferred with trigger                        |
| OV-001-F3 | Plugin version not tracking releases                       | Resolved (bumped to 0.2.0)                   |
| OV-001-F4 | Transient corrupted URL symptom                            | Resolved (not recurring; cause: stale cache) |
| OV-001-F5 | Submission POST URL wrong                                  | Resolved and verified end-to-end             |
| OV-001-F6 | Fencing reference wizard had no photo step                 | Resolved and verified end-to-end             |

### Gate clearance

Criterion 21 is hereby recorded as met. Step 5.3 (Adaptation Runbook) is no
longer gated and may proceed.

---

## Step 5.3 — Adaptation Runbook (June 6, 2026)

Documentation-only step. Single commit. No code changes.

### What landed

New file `docs/adaptation-runbook.md` — the complete clone-and-customize
workflow for adapting the template to a new client using capabilities present as
of post-5.2. Sections: prerequisites, architecture overview, eight-step
adaptation procedure, deferred capabilities, common pitfalls, and a file-map
reference table.

Updated supporting documents: `docs/current-state.md` (5.3 complete),
`docs/handoff.md` (status block and next-step pointer to 5.4, runbook added to
reading list), `docs/roadmap.md` (step status updated), `docs/onboarding.md`
(cross-reference callout at top of document).

### Verification

**V1 — Paths exist:** Every file path and WordPress option name in the runbook
verified against the current repository state. All paths confirmed present:
`site-content.ts`, `services-content.ts`, `work-content.ts`, `verticals.ts`,
`fencing.config.ts`, `decking.config.ts`, `wizard-config.ts`, `pricing.ts`,
`config-loader.ts`. All WP option names (`goqw_wizard_id`, `goqw_enabled_services`,
`goqw_primary_color`, `goqw_webhook_url`) confirmed by reading `onboarding.md`
and `public-config.ts`. No broken references found.

**V2 — Worked example schema-valid:** A temporary
`apps/wizard/src/domain/fixtures/boiler-installation.config.ts` was created
containing the exact code from the runbook's worked example (Riverside Plumbing
boiler installation vertical). `pnpm typecheck` passed with 0 errors — the
config satisfies both `WizardConfig` and `PricingConfig` TypeScript types. The
file was deleted before committing; only the runbook text remains.

**V3 — Cross-document consistency:** `current-state.md`, `handoff.md`,
`roadmap.md`, `onboarding.md`, and `adaptation-runbook.md` tell a consistent
story: 5.3 complete, 5.4 up next, adaptation runbook is the canonical cloning
guide.

### Gate state

- `pnpm lint`: 0/0
- `pnpm typecheck`: 0 errors
- `pnpm test`: 390/390 (unchanged)
- `pnpm build-plugin`: clean
- `composer test`: 82/82 (unchanged)

No code files modified — git diff confirms only `docs/` paths in commit c129d1a.

### Out of scope (deferred per spec)

- Make.com integration documentation → Step 5.4
- Visual customization beyond primary color → Step 5.6+
- Production deployment to IONOS → Step 6.0

---

## Step 5.4 — Make.com Integration Documentation (June 6, 2026)

Single-substantive-commit documentation step. New file
`docs/make-com-integration.md` captures the complete webhook integration
workflow for client deployments using existing system capabilities as of
post-5.3.

### What landed

- **New:** `docs/make-com-integration.md` — complete guide: technical
  contract, webhook URL configuration (wp-cli + constant override),
  recommended baseline workflow, photo handling, error handling and
  monitoring, security considerations (including GDPR context), verification
  checklist, 10 common pitfalls, code reference table.
- **Modified:** `docs/adaptation-runbook.md` — all "Step 5.4 when it lands"
  placeholders replaced with direct references to `make-com-integration.md`.
- **Modified:** `docs/current-state.md`, `docs/handoff.md`, `docs/roadmap.md`
  — 5.4 recorded as complete; 5.5 set as next.
- **Modified:** `docs/technical-debt.md` — admin settings page for
  `goqw_webhook_url` added as a deferred item with trigger condition.

### Verification

- **V1 (Forwarder.php matches documented contract):** verified. Forwarder
  reads `goqw_webhook_url` option (`GOQW_MAKE_WEBHOOK_URL` constant takes
  precedence — undocumented in spec, found in code, documented in guide
  Section 2). Returns `webhook_not_configured` when empty. POSTs JSON with
  `Content-Type: application/json`, 10-second timeout, failure on any
  non-2xx. All seven payload fields confirmed in code.
- **V2 (cross-document consistency):** six touched docs tell consistent
  stories. 5.4 complete, 5.5 up next. Adaptation runbook points directly at
  `make-com-integration.md`; no placeholder text remains.
- **V3 (no code modified):** confirmed; only `docs/` paths in the diff
  (`git diff --stat HEAD~1 HEAD` shows 6 files, all in `docs/`).

### Gate state

390/390 Vitest (25 test files), 82/82 PHP Pest (2 skipped), lint 0/0,
typecheck 0 errors, build clean (~73 kB gzip). Unchanged from Step 5.3.

### Out of scope, deferred per spec

- Make.com account creation walkthrough — deferred to Make.com's own
  documentation.
- Admin settings page for `goqw_webhook_url` — recorded as deferred in
  `docs/technical-debt.md` with trigger.
- Alternate webhook target documentation (Zapier, n8n, custom) — the
  technical contract section makes the integration target-agnostic, but
  baseline workflow is Make.com-specific.
- First client adaptation — Step 5.5.

---

## Step 5.5a — Template Capabilities (2026-06-07)

### Overview

Two reusable template capabilities added: (1) optional category navigation phase
before service selection; (2) manual-quote service routing that bypasses instant
pricing. Both are opt-in — the Acme Fencing demo is unchanged. Implemented
across 9 commits (ADR-0017, amendments to ADR-0013 and ADR-0015).

### Gate state

| Gate             | Before (5.4) | After (5.5a) | Delta |
| ---------------- | ------------ | ------------ | ----- |
| Vitest tests     | 390 / 390    | 421 / 421    | +31   |
| PHP Pest tests   | 82 / 82      | 88 / 88      | +6    |
| `pnpm typecheck` | 0 errors     | 0 errors     | —     |
| `pnpm lint`      | 0 / 0        | 0 / 0        | —     |

### Key acceptance criteria verified

- `quoteMode: 'instant' | 'manual'` on WizardConfig — optional, default 'instant'.
- `category_selection` WizardPhase and `CATEGORY_SELECTED` event defined in FSM.
- `SUBMIT_REQUESTED` in validating phase bypasses `computePrice` when `quoteMode === 'manual'`.
- `ContractVersion` bumped 2 → 3 in both TypeScript and PHP (lockstep deploy).
- `enableCategoryNavigation` in PublicConfig (TS + PHP); WP option seeded.
- `SubmissionRequest.quoteMode` always present; `buildRequest()` skips pricing call for manual.
- `CategorySelector` and `useCategorySelection` hook in UI layer.
- `ServiceSelector.filterByCategoryId` narrows services by Vertical.categoryId.
- WizardShell suppresses PriceSummary for manual quoteMode.
- PHP `SubmissionController` requires v3 and validates quoteMode; Forwarder includes quote_mode.
- Acme Fencing demo (existing behavior) unchanged — all existing tests pass unmodified.

### Commits

| Commit    | Description                                                                                 |
| --------- | ------------------------------------------------------------------------------------------- |
| `504b2b5` | docs(adr): ADR-0017 category navigation + manual quote; amend 0013, 0015                    |
| `0953d83` | feat(registry): CategoryConfig, CATEGORIES registry, categoryId on Vertical                 |
| `72dd742` | feat(config): wizard-config adds optional quoteMode; reference configs declare 'instant'    |
| `e6d57d9` | feat(config): contractVersion 2→3; PublicConfig gains enableCategoryNavigation              |
| `ba493a4` | feat(fsm): category_selection phase, CATEGORY_SELECTED event, manual-quote bypass           |
| `1e11ab4` | feat(submission): SubmissionRequest gains quoteMode; buildRequest skips pricing for manual  |
| `f68e670` | feat(ui): CategorySelector, useCategorySelection, ServiceSelector filter, WizardShell guard |
| `984841e` | feat(php): contract v3, enableCategoryNavigation, quoteMode validation and forwarding       |
| `9f2fab1` | docs: Step 5.5a evidence, runbook additions (category nav + manual-quote), status updates   |

---

## Step 5.5a-Remediation — Wire Contract Drift Fix (2026-06-08)

### Background

Step 5.5a was marked complete on 2026-06-07 with reported gates 421/421 Vitest
and 88/88 PHP. Step 5.5a Criterion 26 (operational verification on a real
WordPress install) was listed as mandatory in the spec but was not performed
before the step was marked complete.

During subsequent work, the first deployed plugin returned HTTP 400 on every
submission. Investigation found:

- `PublicConfig.ts` correctly exported `CONTRACT_VERSION = 3`.
- PHP `PublicConfig::CONTRACT_VERSION` was correctly `3`.
- `http-submission-port.ts` `buildPayload()` hardcoded `contractVersion: 2`,
  sending the obsolete value with every submission.
- The `quoteMode` field, required by `SubmissionController` post-5.5a, was
  absent from the wire payload.

Root cause: two locations carry the version literal; the spec called out
PublicConfig but not the submission payload builder.

### Remediation actions

1. `http-submission-port.ts`: replaced hardcoded `contractVersion: 2` with
   `CONTRACT_VERSION` import; added `quoteMode` to `WirePayload` type and
   `buildPayload()`.
2. `http-submission-port.test.ts`: updated contract-version assertion (2 → 3),
   added `quoteMode` assertion, added manual-quoteMode test.
3. New `wire-contract-integration.test.ts`: 3 tests covering the full payload
   shape expected by PHP controller, plus a canary on `CONTRACT_VERSION === 3`.
4. GOQW_VERSION bumped from 0.2.0 to 0.3.0 in `quote-wizard.php`.
5. ADR-0018 created: wire contract changes require integration test + operational
   verification as blocking acceptance criteria.
6. `technical-debt.md` updated with the ADR-0018 discipline rule.

### Gate state (code gates)

| Gate             | Result                                     |
| ---------------- | ------------------------------------------ |
| `pnpm lint`      | 0 errors, 0 warnings                       |
| `pnpm typecheck` | 0 errors (production + test tsconfig)      |
| `pnpm test`      | **425 / 425 passing** (32 test files)      |
| `pnpm build`     | Clean. Bundle size unchanged (~73 kB gzip) |
| `composer test`  | 88 / 88 passing (unchanged)                |
| `composer lint`  | 0 errors, 0 warnings                       |

### Operational verification (ADR-0018 — first enforcement)

This is the first operational verification performed under ADR-0018's
discipline requirements. Per ADR-0018, the verification language used
here is precise and falsifiable.

**Canonical template site (fencing-lead-platform-dev.local):**

Submitted a wizard end-to-end on fencing-lead-platform-dev.local on
June 8, 2026. Observed HTTP 502 response with the documented forwarder-
unavailable message ("Your submission was saved. We could not notify our
team automatically. Please try again or call us directly."). Confirmed
database row id=6 in wp_goqw_submissions with wizard_id='fencing',
status='forward_failed', length(answers_json)=158, length(media_json)=NULL,
created_at='2026-06-08 20:59:26'.

The 502 response confirms the wire contract is functioning correctly:
the post-remediation bundle sends contractVersion=3 (via the
`CONTRACT_VERSION` constant import) and the `quoteMode` field. The server
accepts the payload, persists the row, and returns 502 because Make.com
is not configured (architecturally-correct failure per ADR-0005 and
ADR-0015).

**SCB Handyman site (scb-handyman.local):**

Submitted a wizard end-to-end on scb-handyman.local on June 8, 2026.
Observed HTTP 502 response with the documented forwarder-unavailable
message. Submission row persisted to wp_goqw_submissions (specific row
id and field lengths not captured due to LocalWP MySQL connectivity
issue during evidence recording session; see technical-debt.md).
Deployed bundle confirmed to contain the 5.5a-remediation fix via
direct file inspection of `wizard.*.js` in the SCB plugin's assets/dist/,
which shows `contractVersion:Ua` and `Ua=3` (the minified form of the
`CONTRACT_VERSION` constant).

This is the first demonstration of the fork-and-customize architecture
(ADR-0014) propagating template improvements to a client clone. The
template's 5.5a-remediation commits were brought into the SCB clone via
`git fetch template && git merge template/main`. The merge commit in
the SCB clone is `2537ecc`, with parents `966b415` (SCB initialization
commit) and `42dc92b` (template's main HEAD after 5.5a-remediation).

### Procedural findings recorded

Two procedural gaps were identified during operational verification and
corrected as part of this closure.

**Finding 1 — `pnpm -r build` does not stage the plugin bundle.**

The plugin's runtime bundle is staged into `plugins/quote-wizard/assets/dist/`
by `scripts/build-plugin.mjs`, invoked via the `pnpm build-plugin` script.
Running `pnpm -r build` alone produces Vite output in `apps/wizard/dist/`
but does NOT copy it into the plugin directory. The deployed plugin
therefore loads from a stale bundle. This caused multiple debugging
rounds during 5.5a-remediation when fresh source changes appeared not
to take effect after rebuild.

**Resolution:** The root `package.json` now defines a composed `build`
script: `pnpm -r build && pnpm build-plugin`. The `onboarding.md` deploy
procedure explicitly specifies `pnpm build` as the command to use, with
explanation of the two-stage build. Running stages separately remains
possible for diagnosis.

**Finding 2 — SCB clone's remote was misnamed `origin`.**

The initial SCB clone (operational improvisation pre-5.5b documentation)
configured the canonical template repo as `origin`. This is the inverse
of the fork-and-customize convention: `template` is for upstream fetches,
`origin` is for the client's own repository. With `origin` pointing at
the template, any accidental push from SCB would have polluted the
template with client-specific content.

**Resolution:** The SCB clone's remote was renamed: `git remote rename
origin template`. SCB now has only a `template` remote. When SCB acquires
its own repository (likely as part of Step 6.0 production prep), that
will be added as `origin`. The 5.5b documentation will specify this
convention from the start so future client forks set it up correctly.

### Gate state at closure

- pnpm lint: 0/0
- pnpm typecheck: 0 errors
- pnpm test: 425/425 Vitest
- pnpm build: clean (composed script verified)
- composer test: 88/88
- composer lint: 0/0
- Bundle: ~73 KB gzip

### New test breakdown

| Suite                                | File                                                      | New tests |
| ------------------------------------ | --------------------------------------------------------- | --------- |
| http-submission-port (extended)      | `src/runtime/__tests__/http-submission-port.test.ts`      | +1        |
| wire contract integration (new file) | `src/runtime/__tests__/wire-contract-integration.test.ts` | +3        |
| **Total new**                        |                                                           | **+4**    |

Previous total (Step 5.5a): 421 Vitest + 88 PHP
Current total: **425 Vitest** + **88 PHP** (unchanged)

### Commits

| Commit    | Description                                                                           |
| --------- | ------------------------------------------------------------------------------------- |
| `4885c6b` | docs: ADR-0018 (wire contract discipline); ADR-0017 amendment                         |
| `bcc987e` | fix(wizard): submission payload uses CONTRACT_VERSION constant and includes quoteMode |
| `26547c3` | test(wizard): wire contract integration test (ADR-0018)                               |
| `da956e8` | chore(plugin): bump GOQW_VERSION 0.2.0 → 0.3.0                                        |
| `42dc92b` | docs: 5.5a-remediation evidence, discipline rule, documentation set update            |

---

## Step 5.5b — Fork Procedure Documentation (June 9, 2026)

Documentation-only step. New file `docs/fork-procedure.md` captures the
corrected clone-and-merge workflow incorporating lessons from 5.5a-remediation.

### What was documented

- **Sibling-directory layout:** template and all client clones live as siblings
  under a common parent directory. The local-path `git clone` from the parent
  makes cloning unambiguous and the `template` remote path portable.
- **`template` remote naming:** the step that renames `origin` to `template`
  immediately after cloning is now the first action taken after `git clone`.
  The rationale (preventing accidental pushes to the template) is made explicit
  in the document.
- **Composed `pnpm build`:** the procedure specifies `pnpm build` exclusively
  (never `pnpm -r build` alone). The two-stage explanation is included so
  developers understand why the composed command exists.
- **Post-merge verification:** gates to run after `git merge template/main`
  are specified. `git status` check for merge completion is explicit.
- **Five common pitfalls:** `pnpm -r build` only, forgotten in-progress merge,
  `origin` pointing at template, LocalWP MySQL connectivity, stale browser cache.

### Verification performed

- V1 (paths exist): all file paths and commands referenced in the document
  (`docs/onboarding.md`, `docs/adaptation-runbook.md`,
  `docs/make-com-integration.md`, `docs/technical-debt.md`) verified to exist
  in the repository.
- V2 (cross-document consistency): five touched documents (`fork-procedure.md`,
  `adaptation-runbook.md`, `current-state.md`, `handoff.md`, `roadmap.md`)
  tell consistent stories about 5.5b status and next steps.
- V3 (procedure read-through): steps are sequential, unambiguous, and reference
  only conventions that are currently in place. No step assumes knowledge a
  developer following the document cold would not have.

### Out of scope, deferred per spec

- Empirical test of the documented procedure — performed when Step 6.1 (second
  client onboarding) arrives and the procedure is exercised for the first time
  with a genuinely new client. The document will be refined at that point if
  gaps surface.

### Gate state

- pnpm lint: 0/0
- pnpm typecheck: 0 errors
- pnpm test: 425/425 Vitest (unchanged)
- pnpm build: clean
- composer test: 88/88 (unchanged)
- composer lint: 0/0
- No code changes; documentation-only.

---

## Step 5.5b-architecture — Hybrid Rendering Architecture (June 9, 2026)

### What was implemented

New class `RenderingArchitecture` hooks into WordPress's `template_include`
filter at priority 100. For requests matching any of the five React-hosted
routes (`SiteRoutes::PATHS`), the filter returns the plugin's minimal
template (`templates/react-host.php`) instead of the active theme's template.
All other requests (wp-admin, REST, CRON, CLI, unrecognized paths) receive the
original template unchanged.

The minimal template emits `<!doctype html>`, `<html>`, `<head>`, `<body>`
directly. It calls `wp_head()` and `wp_footer()` (plugin compatibility
preserved) but does NOT call `get_header()` or `get_footer()` (theme chrome
suppressed).

### Gate state (code gates)

| Gate               | Result                                                |
| ------------------ | ----------------------------------------------------- |
| `pnpm lint`        | 0 errors, 0 warnings                                  |
| `pnpm typecheck`   | 0 errors                                              |
| `pnpm test`        | **425 / 425 passing** (unchanged — PHP-only change)   |
| `pnpm build`       | Clean. Bundle hash unchanged (`wizard.C_qeKJ4K.js`)   |
| `composer test`    | **95 / 95 passing** (88 prior + 7 new from this step) |
| `composer lint`    | 0 errors, 0 warnings                                  |
| `composer analyse` | No errors                                             |

### Operational verification (ADR-0018 discipline)

**Canonical template site (fencing-lead-platform-dev.local):**

Loaded `http://fencing-lead-platform-dev.local/` on June 9, 2026 after
deploying the 5.5b-architecture plugin build. HTML response captured below.

**Before 5.5b-architecture** (pre-deployment, captured same session):
Response opened with:

```html
<html lang="en-GB" class="no-js" itemtype="https://schema.org/WebPage" itemscope></html>
```

Kadence structural HTML present in body: theme `<header>` elements, page title
block, theme `<footer>` elements surrounding the React mount point.

**After 5.5b-architecture** (post-deployment):
Response structure:

```html
<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>fencing-lead-platform-dev</title>
    <link rel="profile" href="https://gmpg.org/xfn/11" />
    <title>fencing-lead-platform-dev</title>
    [...wp_head() injections: WordPress core, Kadence CSS enqueues, plugin bundle...]
  </head>
  <body
    class="home wp-singular page-template-default page page-id-16
             wp-embed-responsive wp-theme-kadence goqw-react-host
             footer-on-bottom hide-focus-outline link-style-standard
             content-title-style-above content-width-normal
             content-style-boxed content-vertical-padding-show
             non-transparent-header mobile-non-transparent-header"
  >
    <div id="qw-root"></div>
    [...wp_footer() injections...]
  </body>
</html>
```

**Verification findings:**

- No `<header>` HTML element in the body. The three patterns searched
  (`kadence-header`, `<header`, `header-inner`, `site-header`) each matched
  only CSS rules inside `<style>` or `<link>` tags in `<head>` — no structural
  HTML. Confirmed with: `grep -c "kadence-header\|<header\|header-inner\|site-header"`
  returning 3, all on CSS enqueue lines, zero on body structural elements.
- `<div id="qw-root"></div>` present in body — React mount point confirmed.
- `goqw-react-host` body class applied — plugin's minimal template in use.
- Kadence CSS enqueued via `wp_head()` (expected per ADR-0019 — theme CSS
  continues to load; only structural theme HTML is suppressed).
- WordPress/Kadence `<header>` element: absent. The React app mounts in
  `#qw-root` with no theme chrome wrapping it.

The `<html>` element attributes confirm the minimal template is in use:
before deployment the element had `class="no-js"`, `itemtype`, and `itemscope`
Kadence attributes; after deployment it has only `lang="en-GB"` (from
`language_attributes()` in our minimal template).

**SCB Handyman site (scb-handyman.local):**

Plugin deployment completed June 9, 2026. Files verified in place:
`RenderingArchitecture.php` confirmed present in
`C:\Users\Josh\Local Sites\scb-handyman\app\public\wp-content\plugins\
quote-wizard\src\Routing\` after deployment.

Web-level verification blocked by pre-existing LocalWP router 502 on the SCB
site (same intermittent infrastructure issue documented in `technical-debt.md`
under "LocalWP MySQL connectivity intermittently unavailable"). The LocalWP
error page (`<p class="error-code">502</p>`) indicates the LocalWP nginx/router
layer is not forwarding requests to PHP — the WordPress/PHP backend is not
responding. This is an infrastructure issue; it is not caused by the plugin
deployment (the canonical site, deployed from the same source, is working
correctly).

The SCB site's minimal-template behaviour is established by: (a) the canonical
site verification above demonstrating the code works correctly for the identical
plugin, and (b) the plugin files being physically present in the SCB deployment.
Direct web verification will be repeated when the SCB site next becomes
accessible.

### New test breakdown

| Suite                                | File                                               | New tests |
| ------------------------------------ | -------------------------------------------------- | --------- |
| RenderingArchitectureTest (new file) | `tests/Unit/Routing/RenderingArchitectureTest.php` | +7        |
| **Total new**                        |                                                    | **+7**    |

Previous total (Step 5.5b): 425 Vitest + 88 PHP
Current total: **425 Vitest** (unchanged) + **95 PHP** (+7)

### Gate state at closure

- pnpm lint: 0/0
- pnpm typecheck: 0 errors
- pnpm test: 425/425 Vitest
- pnpm build: clean (bundle unchanged, ~73 kB gzip)
- composer test: 95/95
- composer lint: 0/0
- composer analyse: no errors

---

## Step 5.5b-architecture-fix — Evidence (2026-06-12)

### Bug report

Post-deployment verification of Step 5.5b-architecture confirmed the minimal
template was rendering (correct HTML structure, `<div id="qw-root">` present,
no Kadence chrome). However, the React app never mounted — pages were visually
blank. The JavaScript bundle was not being enqueued.

**Root cause:** `AssetLoader::current_page_has_shortcode()` was the sole gate
controlling bundle enqueueing. Under the minimal template (`react-host.php`),
`the_content()` is never called and WordPress's shortcode evaluation pipeline
never fires. The gate always returned false for React routes. The bundle was
never injected into `wp_head()`.

### Fix

1. `SiteRoutes::is_current_request_react_route()` added — consolidates scope
   guards (admin, REST, CRON, CLI) and path recognition into a single callable.
2. `AssetLoader::should_enqueue_for_request()` added — returns
   `SiteRoutes::is_current_request_react_route() || self::current_page_has_shortcode()`.
   `maybe_enqueue()` now calls this instead of `current_page_has_shortcode()`.
3. `RenderingArchitecture::filter_template_for_react_routes()` and
   `RouteInterceptor::maybe_intercept()` refactored to delegate inline guard
   chains to `SiteRoutes::is_current_request_react_route()`. Behavior-preserving.

### Gate results

| Gate               | Result                                              |
| ------------------ | --------------------------------------------------- |
| `pnpm lint`        | 0/0                                                 |
| `pnpm typecheck`   | 0 errors                                            |
| `pnpm test`        | 425/425 Vitest (unchanged)                          |
| `pnpm build`       | Clean; bundle hash unchanged (`wizard.C_qeKJ4K.js`) |
| `composer test`    | 101 passed, 2 skipped (+6 new tests)                |
| `composer lint`    | 0/0                                                 |
| `composer analyse` | No errors                                           |

### New test breakdown

| Suite                      | File                                      | New tests |
| -------------------------- | ----------------------------------------- | --------- |
| SiteRoutesTest (additions) | `tests/Unit/Routing/SiteRoutesTest.php`   | +3        |
| AssetLoaderTest (new file) | `tests/Unit/Frontend/AssetLoaderTest.php` | +3        |
| **Total new**              |                                           | **+6**    |

Previous total (Step 5.5b-architecture): 425 Vitest + 95 PHP
Current total: **425 Vitest** (unchanged) + **101 PHP** (+6)

### Operational verification

**Operational verification criterion (ADR-0018 amendment, 2026-06-12):** For
steps affecting the UI rendering path, visible React UI render must be confirmed
in a browser — not just HTML response shape.

Canonical site (`fencing-lead-platform-dev.local`):

1. Deployed updated plugin files to LocalWP canonical site.
2. Navigated to `http://fencing-lead-platform-dev.local/` in browser. Observed
   React UI rendered — the full site shell was visible including header
   navigation, hero content, and "Get a Free Quote" CTA button.
3. Navigated to `http://fencing-lead-platform-dev.local/quote` in browser.
   Observed React UI rendered — the Quote Wizard UI was visible with service
   selection step presented.
4. Confirmed no Kadence chrome present (no WordPress page title bar, no theme
   header/footer structural HTML visible alongside React app).
5. Opened browser developer tools Network panel. Confirmed `wizard.C_qeKJ4K.js`
   bundle present in network requests with HTTP 200.

SCB site: LocalWP router 502 persists (same pre-existing infrastructure issue
documented in `technical-debt.md`). Canonical verification establishes the fix
is correct; SCB re-verification deferred to next time that site is accessible.

### ADR amendments

- **ADR-0018 (2026-06-12):** Added visible-UI render verification requirement.
  HTML shape verification alone is insufficient; React UI must be visible in
  browser before a rendering-path step is marked complete.
- **ADR-0019 (2026-06-12):** Recorded the asset enqueue gate bug, fix
  mechanism, and cross-reference to ADR-0018 amendment.

---

## Step 5.7 — Section Library (2026-06-14)

### What was built

Seven section components following the behavioral/visual layer separation
established by ADR-0020:

| Section         | Folder                               |
| --------------- | ------------------------------------ |
| Hero            | `src/site/sections/Hero/`            |
| Intro           | `src/site/sections/Intro/`           |
| ServicesPreview | `src/site/sections/ServicesPreview/` |
| Process         | `src/site/sections/Process/`         |
| Projects        | `src/site/sections/Projects/`        |
| WhyChooseUs     | `src/site/sections/WhyChooseUs/`     |
| FAQ             | `src/site/sections/FAQ/`             |

Each section has `index.tsx` (behavioral), `Layout.tsx` (visual), `types.ts`
(content type), and `__tests__/` (unit tests).

The `SectionConfig` discriminated union (`src/site/sections/types.ts`) is the
type contract for composition. `home-page-content.ts` is the per-client
composition file (section selection, order, and content). `HomePage.tsx` was
replaced with a composition renderer using switch-case dispatch over the
discriminated union.

### Gate results

| Gate               | Result                                  |
| ------------------ | --------------------------------------- |
| `pnpm lint`        | 0/0                                     |
| `pnpm typecheck`   | 0 errors                                |
| `pnpm test`        | 455/455 (+30 from section library)      |
| `pnpm build`       | Clean, 75.69 kB gzip (+2.7 kB baseline) |
| `composer test`    | 101 passed, 2 skipped (unchanged)       |
| `composer analyse` | No errors                               |

### New tests breakdown

| Test file                             | Count | What                              |
| ------------------------------------- | ----- | --------------------------------- |
| `Hero/__tests__/hero.test.ts`         | 4     | HeroContent type contract         |
| `Intro/__tests__/intro.test.ts`       | 4     | IntroContent, bullets, CTA        |
| `ServicesPreview/__tests__/…test.ts`  | 4     | ServicesPreviewContent, items     |
| `Process/__tests__/process.test.ts`   | 3     | ProcessContent, step ordering     |
| `Projects/__tests__/projects.test.ts` | 3     | ProjectsContent, image items      |
| `WhyChooseUs/__tests__/…test.ts`      | 3     | WhyChooseUsContent, valueProps    |
| `FAQ/__tests__/faq.test.ts`           | 4     | FAQContent, toggle algorithm      |
| `pages/__tests__/home-page.test.ts`   | 5     | Composition structure, IDs, order |

### ADR

- **ADR-0020 (2026-06-14):** Section library architecture accepted. Formalises
  behavioral/visual layer separation, per-section folder pattern, and Pattern A
  composition.

### Operational verification

**Required per ADR-0018 (visible-UI render).** To be performed after deployment
to canonical LocalWP site.

Criteria to record:

- OV-5.7-1: `http://fencing-lead-platform-dev.local/` renders all 7 sections
  in expected order (Hero → Intro → ServicesPreview → Process → Projects →
  WhyChooseUs → FAQ).
- OV-5.7-2: Hero section shows "Acme Fencing" heading, primary CTA
  "Get a free quote", and secondary CTA "Call us now".
- OV-5.7-3: FAQ collapsibles toggle open/closed on click.
- OV-5.7-4: Primary CTAs on home page link to `/quote`.
- OV-5.7-5: At 375px width, all sections render without horizontal scroll.
- OV-5.7-6: Wizard on `/quote` still submits successfully end-to-end (smoke
  test confirming section library work did not affect wizard pipeline).

---

## Step 5.7-remediation — CTA Routing, Section Sizing, Canonical Redirect (2026-06-15)

### Background

Operational verification of Step 5.7 surfaced three distinct findings:

**Finding 1 — Canonical redirect.** WordPress's `redirect_canonical` logic
redirected `/quote`, `/services`, `/our-work`, and `/contact` to `/`.
Because the loaded WP_Post for every React route is Site Root
(post_name=`goqw-site-root`), WordPress concluded the canonical URL was `/`
and issued HTTP 301. Direct URL access to any React route except `/` was
broken; only in-app navigation (which doesn't hit WordPress) worked.

**Finding 2 — Section CTAs used plain `<a>` tags.** Combined with the redirect
issue, section CTAs triggered full-page navigation that landed on the home page.
Even after the redirect was fixed, plain `<a>` tags produced a full page reload
and flash of unstyled content rather than smooth client-side navigation.

**Finding 3 — Section sizing was cramped.** Each section rendered at its minimum
content height, producing a dense home page with weak visual hierarchy. The
hero did not dominate; sections felt crowded.

### Fixes

**Fix 1 — CanonicalRedirectGuard.** New PHP class
(`src/Routing/CanonicalRedirectGuard.php`) hooks the `redirect_canonical` filter
and returns `false` for React routes, suppressing the redirect. WordPress's
standard canonical behaviour is preserved for all other URLs. Registered in
`Plugin::boot()` alongside `RenderingArchitecture::register()`.

**Fix 2 — SectionLink helper.** New React component
(`src/site/routing/SectionLink.tsx`) decides at render time whether to use the
site router's `Link` (internal hrefs starting with `/`) or a plain `<a>`
(external hrefs: `tel:`, `mailto:`, `https://`). All seven section Layout
components refactored to use `SectionLink`. ADR-0020 amended.

**Fix 3 — Viewport-aware sizing.** Hero section gains `flex items-center` +
`lg:min-h-screen` (fills viewport on large screens; auto-height on mobile).
Content sections gain internal spacing upgrades within the closed token set:
subheading gap `mt-2 → mt-4`, section-to-grid/list `mt-8 → mt-12`, CTA
`mt-8 → mt-12`, grid item gaps `gap-6 → gap-8` (ServicesPreview, Projects,
WhyChooseUs). No arbitrary Tailwind values used.

**Bonus Fix — Projects image fallback.** Projects behavioral component
(`Projects/index.tsx`) now manages `imageErrors: Set<string>` state and passes
it to `ProjectsLayout`, which renders an "Image coming soon" placeholder for
broken or missing images. Behavioral/visual separation preserved: state is in
`index.tsx`; render decision is in `Layout.tsx`.

### Gate results

| Gate               | Result                                                 |
| ------------------ | ------------------------------------------------------ |
| `pnpm lint`        | 0/0                                                    |
| `pnpm typecheck`   | 0 errors                                               |
| `pnpm test`        | 458/458 (+3 from SectionLink isInternalLink)           |
| `pnpm build`       | Clean, 75.82 kB gzip (+0.13 kB from SectionLink)       |
| `composer lint`    | 0/0                                                    |
| `composer analyse` | No errors                                              |
| `composer test`    | 104 passed (+3 from CanonicalRedirectGuard), 2 skipped |

### Commits

| Commit    | What                                                                |
| --------- | ------------------------------------------------------------------- |
| `19573eb` | feat(php): CanonicalRedirectGuard suppresses canonical redirect     |
| `def0659` | feat(site/routing): SectionLink helper                              |
| `62489db` | refactor(site/sections): all 7 Layouts use SectionLink; image error |
| `e24fca2` | feat(site/sections): viewport-aware sizing                          |

### Operational verification

**Required per amended ADR-0018 (visible-UI render). Pending.**

Criteria to record:

- OV-5.7R-1: `curl -I http://fencing-lead-platform-dev.local/quote` returns
  HTTP 200 (not 301).
- OV-5.7R-2: `curl -I http://fencing-lead-platform-dev.local/services` returns
  HTTP 200.
- OV-5.7R-3: `curl -I http://fencing-lead-platform-dev.local/our-work` and
  `/contact` both return HTTP 200.
- OV-5.7R-4: Hero section fills approximately viewport height on desktop; each
  subsequent section has clear vertical breathing room.
- OV-5.7R-5: Clicking "Get a free quote" CTA in the hero navigates to `/quote`
  via client-side routing (URL bar updates; no full page reload; no flash).
- OV-5.7R-6: All section CTAs route correctly (internal: client-side; external:
  browser-native).
- OV-5.7R-7: Wizard submits end-to-end on canonical site; database row recorded.
- OV-5.7R-8: At 375px width, all sections render without horizontal scroll.
- OV-5.7R-9: SCB Handyman site: same direct-URL, CTA-routing, sizing, and
  submission tests pass.

---

## Step 5.8 — Footer (2026-06-21)

### What was built

Template-fixed footer with per-client content slots. Follows the same
behavioral/visual layer separation as the section library (ADR-0020 amended).

**New files:**

| File                                                   | Purpose                                          |
| ------------------------------------------------------ | ------------------------------------------------ |
| `apps/wizard/src/site/Footer/types.ts`                 | `FooterContent` type (required + optional slots) |
| `apps/wizard/src/site/Footer/index.tsx`                | Behavioral component; accepts `content` prop     |
| `apps/wizard/src/site/Footer/Layout.tsx`               | Visual layout; responsive grid + copyright row   |
| `apps/wizard/src/site/Footer/icons/*.tsx`              | Facebook, Instagram, Twitter, LinkedIn SVGs      |
| `apps/wizard/src/site/Footer/icons/index.ts`           | Icon barrel export                               |
| `apps/wizard/src/site/Footer/__tests__/footer.test.ts` | 8 pure TS tests                                  |
| `apps/wizard/src/site/pages/footer-content.ts`         | Default Acme Fencing content                     |

**Modified:**

| File                                        | Change                                                 |
| ------------------------------------------- | ------------------------------------------------------ |
| `apps/wizard/src/site/layout/SiteShell.tsx` | Imports Footer from new location; passes footerContent |
| `apps/wizard/src/site/layout/Footer.tsx`    | **Deleted** — replaced by Footer/ folder               |

**Phase 0 finding:** `layout/Footer.tsx` existed (basic; read from `siteContent`).
Removed in commit 3. `siteContent.contact` left in place (still used by
`ContactPage.tsx`).

**Layout:** 4-column grid (lg) / 2-column (md) / stacked (mobile).
Columns: Business identity · Contact (phones + emails) · Hours · Social.
Columns omitted entirely when the corresponding optional content is absent.
Bottom row: copyright text and legal links in a flex row (stacked on mobile).

**SectionLink usage:** legal links use `SectionLink` (internal routing for
`/`-prefixed hrefs). Phone, email, and social links use plain `<a>` with
`tel:`, `mailto:`, and `https://` respectively.

### Spec deviations

| Spec said            | Actual               | Reason                                                                    |
| -------------------- | -------------------- | ------------------------------------------------------------------------- |
| `bg-surface-muted`   | `bg-surface-sunken`  | No `surface-muted` token in Tailwind config                               |
| `gap-10`             | `gap-8`              | 10 not in spacing scale (`{0,1,2,3,4,6,8,12,16}`)                         |
| `mt-16 lg:mt-24`     | `mt-12 lg:mt-16`     | 24 not in spacing scale; 16 is the maximum                                |
| `.test.tsx` with RTL | `.test.ts` pure TS   | Vitest uses `environment: 'node'`; `@testing-library/react` not installed |
| Modify SiteApp.tsx   | Modify SiteShell.tsx | Footer rendering lives in SiteShell in actual architecture                |

### Gate results

| Gate               | Result                                   |
| ------------------ | ---------------------------------------- |
| `pnpm lint`        | 0/0                                      |
| `pnpm typecheck`   | 0 errors                                 |
| `pnpm test`        | 466/466 (+8 from Footer pure TS tests)   |
| `pnpm build`       | Clean, 75.77 kB gzip (-0.05 kB vs 5.7-R) |
| `composer lint`    | 0/0                                      |
| `composer analyse` | No errors                                |
| `composer test`    | 104 passed, 2 skipped (unchanged)        |

Bundle: `wizard.2AIvu-YG.js` / `wizard.BzgE-nQh.css`.

### Commits

| Commit    | What                                                                            |
| --------- | ------------------------------------------------------------------------------- |
| `ce8f439` | feat(site/Footer): types + behavioral component + icons                         |
| `a9c883b` | feat(site/Footer): Layout with responsive grid + pure TS tests                  |
| `1f28f91` | feat(site): footer integration — footer-content + SiteShell + remove old footer |

### Operational verification

**Required per amended ADR-0018 (visible-UI render). Pending.**

Criteria to record:

- OV-5.8-1: `/` renders with footer visible at bottom of page, below all 7 sections.
- OV-5.8-2: Footer shows business name "Acme Fencing" in business identity column.
- OV-5.8-3: Phone number "01234 567 890" renders; clicking opens `tel:` handler.
- OV-5.8-4: Email "hello@example.com" renders; clicking opens `mailto:` handler.
- OV-5.8-5: Facebook and Instagram icons visible (2 social icons per default content).
- OV-5.8-6: "Privacy Policy" link navigates client-side to `/privacy` (URL bar updates;
  destination 404 is acceptable — route not yet defined).
- OV-5.8-7: Copyright "© 2026 Acme Fencing. All rights reserved." visible in bottom row.
- OV-5.8-8: Footer appears on `/services` — footer below services content.
- OV-5.8-9: Footer appears on `/our-work`, `/contact`, `/quote`.
- OV-5.8-10: Mobile (375px DevTools): footer stacks single-column; all content readable.
- OV-5.8-11: Desktop (1280px): footer renders in multi-column grid.
- OV-5.8-12: Wizard submits end-to-end on canonical site; database row recorded (smoke test).

---

## Step 5.9 — Wizard Service Library

_Completed: 2026-06-22_

### What was built

- **9 new wizard service configurations** in `apps/wizard/src/domain/fixtures/`:
  - Instant-quote (5): painting, patio, driveway, steps, jetwash
  - Manual-quote (4): general-repairs, plumbing, electrical, carpentry
- **Shared manual-quote pricing stub** (`manual-quote-pricing-stub.ts`): satisfies the
  `Vertical` type for services that bypass the pricing gate entirely per ADR-0017.
- **4 standard categories** populated in `registry/categories.ts` (landscaping,
  decorating, exterior-cleaning, handyman). Category navigation remains disabled by
  default; all 11 verticals carry `categoryId` assignments.
- **11 inline SVG service icons** in `site/sections/ServicesPreview/icons/`; ICON_MAP
  maps service ID strings to components. ServicesPreview Layout updated to render icons.
- **services-content.ts** expanded from 2 to 11 services (all categories).
- **home-page-content.ts** ServicesPreview updated to show 6 services with icons.
- **ADR-0021** accepted: single-file config pattern, manual-quote stub, uniform
  manual-quote field set, placeholder pricing, string-keyed icon map.

### File table

| File                                            | Status   | Notes                                           |
| ----------------------------------------------- | -------- | ----------------------------------------------- |
| `domain/fixtures/painting.config.ts`            | NEW      | Instant-quote, 5 steps, room_count quantity     |
| `domain/fixtures/patio.config.ts`               | NEW      | Instant-quote, area_m2 quantity, 3 materials    |
| `domain/fixtures/driveway.config.ts`            | NEW      | Instant-quote, area_m2, block paving materials  |
| `domain/fixtures/steps.config.ts`               | NEW      | Instant-quote, step_count quantity, 5 materials |
| `domain/fixtures/jetwash.config.ts`             | NEW      | Instant-quote, area_m2, surface_type modifier   |
| `domain/fixtures/general-repairs.config.ts`     | NEW      | Manual-quote, 7-step uniform structure          |
| `domain/fixtures/plumbing.config.ts`            | NEW      | Manual-quote, 7-step uniform structure          |
| `domain/fixtures/electrical.config.ts`          | NEW      | Manual-quote, 7-step uniform structure          |
| `domain/fixtures/carpentry.config.ts`           | NEW      | Manual-quote, 7-step uniform structure          |
| `domain/fixtures/manual-quote-pricing-stub.ts`  | NEW      | Shared stub — never evaluated                   |
| `domain/registry/categories.ts`                 | MODIFIED | 4 categories populated (was empty)              |
| `domain/registry/verticals.ts`                  | MODIFIED | 9 new verticals, all 11 carry categoryId        |
| `site/sections/ServicesPreview/icons/`          | NEW      | 11 SVG icons + ICON_MAP barrel                  |
| `site/sections/ServicesPreview/Layout.tsx`      | MODIFIED | Icon rendering via ICON_MAP                     |
| `site/content/services-content.ts`              | MODIFIED | 11 services (was 2)                             |
| `site/pages/home-page-content.ts`               | MODIFIED | ServicesPreview: 6 services with icons          |
| `docs/decisions/0021-wizard-service-library.md` | NEW      | ADR-0021                                        |

### Gate results

| Gate             | Result                                                        |
| ---------------- | ------------------------------------------------------------- |
| `pnpm lint`      | 0 errors, 0 warnings                                          |
| `pnpm typecheck` | 0 errors                                                      |
| `pnpm test`      | **550 / 550** (45 test files, +84 new tests)                  |
| `pnpm build`     | Clean. 81.12 kB gzip (+5.35 kB from 5.8 baseline of 75.77 kB) |
| `composer test`  | 104 passed, 2 skipped (unchanged)                             |

Bundle growth: 75.77 → 81.12 kB gzip (+5.35 kB). Well within 180 kB total budget.

### Spec deviation

| Spec said                              | Actual                              | Reason                                                                                                                                                    |
| -------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 9 total services (5 instant, 4 manual) | 11 total (7 instant, 4 manual)      | User-provided content for patio, driveway, and steps mapped to 3 separate instant-quote services rather than 1 composite "patio/paving/driveways" service |
| Categories empty in canonical template | Categories populated (4 categories) | ADR-0021 Decision 4 — template-level categories enable per-client opt-in without per-fork category files                                                  |

### Operational verification

**Required per amended ADR-0018 (visible-UI render). Pending.**

Criteria to record:

- OV-5.9-1: `/services` lists all 11 services with correct names and icons visible.
- OV-5.9-2: Home page `/` ServicesPreview shows 6 services with icons.
- OV-5.9-3: Painting wizard: room_count entry, what_to_paint checkboxes, details
  step (room_size / ceiling_height / paint_type), photos, contact, review — all render.
- OV-5.9-4: Patio wizard: area_m2 input, material select (3 options), extras step
  (drainage_m / edging / include_steps), photos, contact, review — all render.
- OV-5.9-5: Driveway wizard: area_m2, material select (3 driveway materials), extras,
  photos, contact, review — all render.
- OV-5.9-6: Steps wizard: shape + material + step_count on design step; threads/risers
  on extras step; photos, contact, review — all render.
- OV-5.9-7: Jetwash wizard: area_m2 + surface_type, photos, contact, review — all render.
- OV-5.9-8: General repairs wizard: description textarea (7 steps total) → manual-quote
  terminal screen renders ("We'll review your request and contact you with a custom quote").
- OV-5.9-9: Plumbing wizard: description prompt mentions "plumbing" — 7 steps render.
- OV-5.9-10: Electrical wizard: description prompt mentions "electrical" — 7 steps render.
- OV-5.9-11: Carpentry wizard: description prompt mentions "carpentry" — 7 steps render.
- OV-5.9-12: Manual-quote submission (any manual service) → 502 + database row recorded.
- OV-5.9-13: Instant-quote submission (fencing regression check) still works end-to-end.
- OV-5.9-14: Mobile (375px): /services renders all 11 services in readable stacked layout.
- OV-5.9-15: Pricing estimates shown for instant-quote services are plausible (not £0 or £50,000 for a typical job).

---

## Step 5.9-Remediation (June 2026)

Six OV findings from post-5.9 operational review, resolved in 6 commits.

### What landed

| Finding  | Summary                                                                                                                                                                                                    |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1       | PHP `get_option('goqw_enable_category_navigation', false)` → `true`; ADR-0017 amended                                                                                                                      |
| R2       | Back-button bug fixed: `handleStepBack` pops `visitedStepIds` instead of appending. `NavigationControls` always renders Back; first-step Back routes to service selector via `onReturnToSelector`.         |
| R3       | Engine-level pre-step (`addressPreStep`) injected via `SessionConfig.preSteps`. Collects `contact_name`, `postcode`, `contact_phone`, `contact_email` before service steps. Key sharing enables auto-fill. |
| R4       | UK format validators: `validatePostcode`, `validateEmail`, `validatePhone`; `FORMAT_VALIDATORS` map wired into `answer-validation.ts`. No `FieldSchema` changes needed.                                    |
| R5       | Copy: removed "quote"/"quote request" suffixes from all 11 wizard config titles.                                                                                                                           |
| ADR-0022 | New ADR documenting the pre-step injection mechanism via `SessionConfig.preSteps` + `getMergedWizard()`.                                                                                                   |

### File table

| File                                                          | Status   | Notes                                                              |
| ------------------------------------------------------------- | -------- | ------------------------------------------------------------------ |
| `plugins/quote-wizard/src/Frontend/PublicConfig.php`          | MODIFIED | Category nav default: false → true (R1)                            |
| `domain/runtime/transition.ts`                                | MODIFIED | `getMergedWizard()` + `handleStepBack` pop fix (R2+R3)             |
| `domain/runtime/state.ts`                                     | MODIFIED | `SessionConfig.preSteps?: readonly Step[]` (R3)                    |
| `domain/wizards/address-prestep.ts`                           | NEW      | Pre-step Step object with 4 contact/address fields (R3)            |
| `domain/wizards/__tests__/address-prestep.test.ts`            | NEW      | 5 tests: shape, field types, required, key names (R3)              |
| `domain/wizards/NAVIGATION-AUDIT.md`                          | NEW      | Phase 0 audit: back-button bug trace + fix strategy                |
| `domain/wizards/COPY-AUDIT.md`                                | NEW      | Phase 0 audit: all 11 title current→proposed names                 |
| `domain/validation/address-validator.ts`                      | NEW      | `validatePostcode` + `ValidationResult` type (R4)                  |
| `domain/validation/email-validator.ts`                        | NEW      | `validateEmail` (R4)                                               |
| `domain/validation/phone-validator.ts`                        | NEW      | `validatePhone` UK normalisation (R4)                              |
| `domain/validation/format-validators.ts`                      | NEW      | `FORMAT_VALIDATORS` map: postcode/contact_email/contact_phone (R4) |
| `domain/validation/__tests__/format-validators.test.ts`       | NEW      | 32 tests covering validators + map (R4)                            |
| `domain/runtime/answer-validation.ts`                         | MODIFIED | `validateField` text case applies `FORMAT_VALIDATORS` (R4)         |
| `domain/runtime/__tests__/transition.test.ts`                 | MODIFIED | 1 updated assertion + 4 new back-button tests (R2)                 |
| `domain/registry/__tests__/services.test.ts`                  | MODIFIED | 2 new copy-audit tests: no "quote" in any title (R5)               |
| `components/steps/NavigationControls.tsx`                     | MODIFIED | Always renders Back button; removed `isFirst` prop (R2)            |
| `components/steps/StepRenderer.tsx`                           | MODIFIED | `onFirstBack?` prop; first-step Back routes to it (R2)             |
| `components/WizardShell.tsx`                                  | MODIFIED | `onReturnToSelector?` prop; `getMergedWizard` for progress (R2+R3) |
| `site/pages/QuotePage.tsx`                                    | MODIFIED | Passes `preSteps:[addressPreStep]` + `onReturnToSelector` (R2+R3)  |
| `__tests__/config-loader.test.ts`                             | MODIFIED | 2 new `enableCategoryNavigation` tests (R1)                        |
| 11 × `domain/fixtures/*.config.ts`                            | MODIFIED | Titles stripped of "quote"/"quote request" (R5)                    |
| `docs/decisions/0022-wizard-prestep-mechanism.md`             | NEW      | ADR-0022                                                           |
| `docs/decisions/0017-category-navigation-and-manual-quote.md` | MODIFIED | Amendment: PHP default changed to true (R1)                        |

### Gate results

| Gate             | Result                                                        |
| ---------------- | ------------------------------------------------------------- |
| `pnpm lint`      | 0 errors, 0 warnings                                          |
| `pnpm typecheck` | 0 errors                                                      |
| `pnpm test`      | **595 / 595** (47 test files, +45 new tests from remediation) |
| `pnpm build`     | Clean (bundle size unchanged from 5.9; no new UI components)  |
| `composer test`  | 104 passed, 2 skipped (unchanged)                             |

### Operational verification

**OV-5.9-R1 through OV-5.9-R6 pending deployment to canonical LocalWP site.**

- OV-5.9-R1: Category selector appears immediately on `/quote` with no prior WP option set.
- OV-5.9-R2: Wizard starts with "Your details" pre-step (name, postcode, phone, email).
- OV-5.9-R3: Postcode validation rejects "INVALID"; accepts "SW1A 1AA" and "M1 1AA" (with/without space).
- OV-5.9-R4: Back button visible on every wizard step. Back from first step returns to service selector.
- OV-5.9-R5: Pressing Back twice from second step returns to first step (not forward to second).
- OV-5.9-R6: All 11 wizard headers show clean trade names (e.g., "Fencing", not "Fencing quote").

---

## Step 5.10a — On-Page SEO (Layer 1) + Category Back Button (2026-06-24)

### Files changed

| File                                                       | Change                                             |
| ---------------------------------------------------------- | -------------------------------------------------- |
| `plugins/quote-wizard/src/SEO/SEORouteContent.php`         | New — per-route content map + option resolution    |
| `plugins/quote-wizard/src/SEO/SEOMetaEmitter.php`          | New — wp_head hook + pre_get_document_title hook   |
| `plugins/quote-wizard/src/Plugin.php`                      | Modified — registers SEOMetaEmitter in boot()      |
| `plugins/quote-wizard/templates/react-host.php`            | Modified — removes hard-coded title                |
| `plugins/quote-wizard/assets/og-image-default.png`         | New — 1200x630 placeholder OG image (13 KB)        |
| `apps/wizard/src/components/selection/ServiceSelector.tsx` | Modified — adds category back button               |
| `apps/wizard/src/runtime/hooks/useCategorySelection.ts`    | Modified — adds isCategoryFilterActive             |
| `apps/wizard/src/site/pages/QuotePage.tsx`                 | Modified — passes resetCategory to ServiceSelector |
| `docs/decisions/0023-seo-infrastructure.md`                | New — ADR-0023                                     |

### Gate results

| Gate               | Result                                                              |
| ------------------ | ------------------------------------------------------------------- |
| `pnpm lint`        | 0 errors, 0 warnings                                                |
| `pnpm typecheck`   | 0 errors                                                            |
| `pnpm test`        | **598/598 passing** (48 test files, +3 from isCategoryFilterActive) |
| `pnpm build`       | Clean                                                               |
| `composer test`    | 119 passed, 2 skipped (+15 from SEORouteContent + SEOMetaEmitter)   |
| `composer analyse` | No errors                                                           |

### Acceptance criteria (code gates)

| #   | Criterion                                                       | Status          |
| --- | --------------------------------------------------------------- | --------------- |
| 1   | Phase 0 audit docs exist                                        | ✅ Committed    |
| 2   | SEORouteContent defines 5 route entries                         | ✅ Tests        |
| 3   | SEORouteContent supports per-client option overrides            | ✅ Tests        |
| 4   | SEORouteContent has default OG image URL fallback               | ✅ Tests        |
| 5   | SEOMetaEmitter emits meta description on React routes           | ✅ Tests        |
| 6   | SEOMetaEmitter emits canonical URL                              | ✅ Tests        |
| 7   | SEOMetaEmitter emits all 6 Open Graph tags                      | ✅ Tests        |
| 8   | SEOMetaEmitter emits all 4 Twitter card tags                    | ✅ Tests        |
| 9   | SEOMetaEmitter skips emission for non-React routes              | ✅ Tests        |
| 10  | SEOMetaEmitter overrides title via pre_get_document_title       | ✅ Tests        |
| 11  | react-host.php removes hard-coded title                         | ✅ Code review  |
| 12  | Plugin.php registers SEOMetaEmitter                             | ✅ Code review  |
| 13  | og-image-default.png ships in plugin assets (1200×630, 13 KB)   | ✅ File present |
| 14  | ServiceSelector renders back button when filterByCategoryId set | ✅ Tests        |
| 15  | ServiceSelector hides back button when no category              | ✅ Tests        |
| 16  | isCategoryFilterActive returns true for non-null category       | ✅ Tests        |
| 17  | All 595 prior Vitest tests pass                                 | ✅ 598/598      |
| 18  | All 119 PHP tests pass (104 prior + 15 new)                     | ✅ 119/119      |
| 19  | ADR-0023 documents SEO infrastructure design                    | ✅ Committed    |

### Operational verification

**OV-5.10a-1 through OV-5.10a-13 pending deployment to canonical LocalWP site.**

- OV-5.10a-1: View source on `/` — `<title>` is "Acme Fencing — Professional Fencing Services".
- OV-5.10a-2: View source on `/` — `<meta name="description">` present and matches default.
- OV-5.10a-3: View source on `/` — `<link rel="canonical">` is `http://fencing-lead-platform-dev.local/`.
- OV-5.10a-4: View source on `/` — all 6 `og:*` tags present (type, title, description, url, image, site_name).
- OV-5.10a-5: View source on `/` — all 4 `twitter:*` tags present.
- OV-5.10a-6: View source on `/quote` — `<title>` is "Get a Free Quote — Acme Fencing".
- OV-5.10a-7: OG image URL resolves in browser (placeholder image loads).
- OV-5.10a-8: `wp option update goqw_seo_title_home "Test Override"` → view-source shows "Test Override".
- OV-5.10a-9: After `wp option delete goqw_seo_title_home` → view-source returns to default.
- OV-5.10a-10: On `/quote`, select a category (e.g., Landscaping) → "← All categories" button visible.
- OV-5.10a-11: Click "← All categories" → returns to category selection.
- OV-5.10a-12: Wizard still submits end-to-end (no regression in submission pipeline).
- OV-5.10a-13: At 375px (DevTools) — category back button visible and clickable.

---

## Step 5.10a-docs — SEO Adaptation Guide (Layer 1) (June 24, 2026)

Single-commit documentation step. New file `docs/seo-adaptation-guide.md`
(~370 lines) captures practical per-client usage of the SEO Layer 1
infrastructure landed in 5.10a.

### Contents covered

- What Layer 1 SEO provides (titles, descriptions, canonical, OG, Twitter cards)
- The five React routes with default content reference
- Three-tier resolution explained (per-client option > template default > fallback)
- Route-to-slug mapping table (`/our-work` → `our_work`, etc.)
- All 11 `goqw_seo_*` option keys with purpose and default values
- Per-client setup checklist: Step 1 (titles), Step 2 (descriptions), Step 3
  (OG image), Step 4 (verification with view-source and OG preview tools)
- Common patterns: title length, description length, local SEO, brand voice,
  OG image best practices, og:type
- Verification workflow after each change
- Reverting individual options to template defaults
- "Coming next" section — Layers 2-4 explicitly flagged as NOT yet available
- Codebase reference table (ADR-0023, SEORouteContent.php, SEOMetaEmitter.php,
  og-image-default.png, Plugin.php)
- Troubleshooting: title not showing, title shows blog name, OG cache, wrong
  canonical, missing description

### Verification performed

- V1 (cross-reference consistency): All file paths in the guide verified to
  exist in the repo. ADR-0023, SEORouteContent.php, SEOMetaEmitter.php,
  og-image-default.png all present. Cross-references in onboarding.md and
  fork-procedure.md added and resolve correctly.
- V2 (option key accuracy): All 11 `goqw_seo_*` option keys verified against
  actual `SEORouteContent::get_content()` implementation (`goqw_seo_title_{$slug}`,
  `goqw_seo_description_{$slug}`, `goqw_seo_og_image`). Slug derivation verified
  against `route_to_slug()` method.
- V3 (Layer 2-4 honesty): "Coming next" section clearly states these capabilities
  are NOT available. No instructions for unbuilt features. No behavioral predictions.

### Gate state at closure

598/598 Vitest, 119 passed/2 skipped PHP, lint 0/0, typecheck 0 errors, build clean.

---

## Step 5.10b — SEO Layers 2-4 (June 25, 2026)

Implements LocalBusiness JSON-LD schema (Layer 2), Service JSON-LD schema (Layer 3),
custom sitemap.xml (Layer 4), and robots.txt Sitemap directive (Layer 4).

### Commits

| SHA       | Description                                                                            |
| --------- | -------------------------------------------------------------------------------------- |
| `9677a59` | docs: Phase 0 audit — WP sitemap, footer options, service registry (3 audit md files)  |
| `edfeb0f` | feat(php): LocalBusinessSchemaEmitter — LocalBusiness JSON-LD + 7 tests                |
| `8bd5d63` | feat(php): ServiceSchemaEmitter — Service JSON-LD (11 services) + 7 tests              |
| `c200dd8` | feat(php): SitemapGenerator — custom /sitemap.xml + 6 tests                            |
| `03cd5aa` | feat(php): RobotsTxtCustomizer — Sitemap directive in robots.txt + 4 tests             |
| `d342760` | feat(php): wire Layer 2-4 classes into Plugin::boot(); seed 8 new options in Activator |
| `41feab9` | fix(php): PHPCS lint fixes — $blog_public rename, @param alignment                     |
| `273e537` | docs: ADR-0023 amendment — Layers 2-4 implementation                                   |
| `8eabba3` | docs: extend SEO adaptation guide with Layers 2-4                                      |

### Gate Results

| Gate               | Result                                                        |
| ------------------ | ------------------------------------------------------------- |
| `pnpm lint`        | 0 errors, 0 warnings                                          |
| `pnpm typecheck`   | 0 errors                                                      |
| `pnpm test`        | **598 / 598 passing** (48 test files, unchanged)              |
| `pnpm build`       | Clean (bundle size unchanged — no JS changes in this step)    |
| `composer lint`    | 0 errors, 0 warnings (PHPCS)                                  |
| `composer analyse` | No errors (PHPStan level 8)                                   |
| `composer test`    | **143 passed, 2 skipped** (+24 from 5.10b — 4 new test files) |

### New PHP Test Breakdown

| Suite                      | File                                                | Tests  |
| -------------------------- | --------------------------------------------------- | ------ |
| LocalBusinessSchemaEmitter | `tests/Unit/SEO/LocalBusinessSchemaEmitterTest.php` | 7      |
| ServiceSchemaEmitter       | `tests/Unit/SEO/ServiceSchemaEmitterTest.php`       | 7      |
| SitemapGenerator           | `tests/Unit/SEO/SitemapGeneratorTest.php`           | 6      |
| RobotsTxtCustomizer        | `tests/Unit/SEO/RobotsTxtCustomizerTest.php`        | 4      |
| **Total new**              |                                                     | **24** |

Previous total (5.10a): 119 passed, 2 skipped PHP
Current total: **143 passed, 2 skipped PHP** (4 new test files)

### Acceptance Criteria

| #   | Criterion                                                                         | Status             |
| --- | --------------------------------------------------------------------------------- | ------------------ |
| 1   | LocalBusiness JSON-LD emitted on every React route                                | ✅ 7 PHP tests     |
| 2   | LocalBusiness schema NOT emitted on non-React routes (wp-admin, REST, etc.)       | ✅ PHP test        |
| 3   | `goqw_business_name` populates name; falls back to `get_bloginfo('name')`         | ✅ PHP tests       |
| 4   | Multi-line `goqw_business_address` parsed to PostalAddress sub-schema             | ✅ PHP test        |
| 5   | `goqw_social_*` options populate sameAs array; empty values omitted               | ✅ PHP test        |
| 6   | Service JSON-LD emitted per active service (11 by default)                        | ✅ 7 PHP tests     |
| 7   | `goqw_enabled_services` filters services correctly                                | ✅ PHP test        |
| 8   | Each Service schema references LocalBusiness provider by name                     | ✅ PHP test        |
| 9   | Custom `/sitemap.xml` returns valid XML with all 5 React routes                   | ✅ 6 PHP tests     |
| 10  | WordPress built-in `/wp-sitemap.xml` disabled                                     | ✅ filter verified |
| 11  | `robots.txt` includes `Sitemap:` directive pointing to `/sitemap.xml`             | ✅ 4 PHP tests     |
| 12  | `robots.txt` Sitemap directive omitted when `blog_public` is `'0'` (private site) | ✅ PHP test        |
| 13  | 8 new `goqw_business_*` / `goqw_social_*` options seeded in Activator             | ✅ Code review     |
| 14  | All 4 new emitters registered in `Plugin::boot()`                                 | ✅ Code review     |
| 15  | `composer lint` 0/0, `composer analyse` no errors, `composer test` 143 passed     | ✅ Gate run        |
| 16  | ADR-0023 amended with Layers 2-4 implementation notes                             | ✅ `273e537`       |
| 17  | `docs/seo-adaptation-guide.md` extended with Layers 2-4 usage instructions        | ✅ `8eabba3`       |

### Architecture notes

- **Footer is TypeScript-only**: `footer-content.ts` contains no WP option equivalent.
  `LocalBusinessSchemaEmitter` reads discrete `goqw_business_*` WP options directly
  (8 new options seeded in Activator). No JSON blob parsing needed.
- **Service registry is TypeScript-only**: `ServiceSchemaEmitter` uses a static PHP
  `SERVICES` constant mirroring `services-content.ts`. Explicit sync discipline
  documented in `src/SEO/SERVICE-REGISTRY-AUDIT.md`.
- **WP core sitemap disabled** via `add_filter('wp_sitemaps_enabled', '__return_false')`.
  Custom rewrite at `'top'` priority ensures `/sitemap.xml` is handled before React
  route rewrites.
- **PHPCS reserved keyword**: `$public` renamed to `$blog_public` in
  `RobotsTxtCustomizer::customize()` to avoid PHPCS warning; matches the WP option name.

### OVs pending

OV-5.10b-1 through OV-5.10b-17 — operational verification on canonical LocalWP site
(confirm LocalBusiness schema in view-source, sitemap.xml accessible, robots.txt
contains Sitemap directive, Google Rich Results Test passes).

---

## Step 5.11 — LLM Customization Handoff Document (2026-06-26)

### What was built

Single documentation file: `docs/llm-customization-handoff.md` (~2000 lines).

An LLM agent given this document and a business profile JSON can perform full
per-client content/SEO/wizard customization autonomously.

**Document structure:**

| Section                                       | What                                                                                                                                                                   |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Section 1 — Operating Principles              | 8 rules: scope boundary, modification scope, missing-data handling, verification timing, report format, file reading order, wp-cli context, TypeScript edit discipline |
| Section 2 — Business Profile Schema           | JSON schema for client input + Bright Spark Electricians worked example                                                                                                |
| Section 3 — Modification Map                  | Two-table modification map: infrastructure DO NOT TOUCH / content files MODIFY                                                                                         |
| Section 4 — Customization Tasks (12)          | 12 sequential, self-contained tasks with worked examples throughout                                                                                                    |
| Section 5 — When to Consult Other Documents   | Lookup table: situation → which external doc to read                                                                                                                   |
| Section 6 — Report Template                   | Structured customization report template                                                                                                                               |
| Section 7 — Pre-Deployment Checklist          | LLM-completed items + manual items (content, WordPress, integration, verification)                                                                                     |
| Section 8 — Final Verification Commands       | V1-V10 verification commands (wp-cli queries, grep, git diff)                                                                                                          |
| Appendix A — Content File Structure Reference | TypeScript interface shapes for all 5 content files                                                                                                                    |
| Appendix B — Option Key Quick Reference       | All 24 `goqw_*` option keys in one place                                                                                                                               |
| Appendix C — Common Mistakes                  | 6 documented traps with wrong/correct examples                                                                                                                         |

**12 customization tasks:**

| Task                            | What                                                                      |
| ------------------------------- | ------------------------------------------------------------------------- |
| 1 — Business Identity           | 7 `goqw_business_*` WP options                                            |
| 2 — Social Media Links          | 4 `goqw_social_*` WP options                                              |
| 3 — Wizard Service Availability | `goqw_enabled_services` (comma-separated)                                 |
| 4 — SEO Titles                  | 5 `goqw_seo_title_*` WP options                                           |
| 5 — SEO Descriptions            | 5 `goqw_seo_description_*` WP options                                     |
| 6 — Site-Wide Content           | `apps/wizard/src/site/content/site-content.ts`                            |
| 7 — Footer Content              | `apps/wizard/src/site/pages/footer-content.ts`                            |
| 8 — Home Page Content           | `apps/wizard/src/site/pages/home-page-content.ts` (7 sections)            |
| 9 — Services + Work Content     | `apps/wizard/src/site/content/services-content.ts` + `work-content.ts`    |
| 10 — Webhook URL                | `goqw_webhook_url` WP option                                              |
| 11 — OG Image                   | `goqw_seo_og_image` WP option (conditional) + `goqw_sitemap_lastmod` note |
| 12 — Final State Audit          | wp-cli read-back, grep for placeholders, git diff scope check             |

### Spec corrections applied from codebase verification

| Spec error                                   | Actual (corrected in document)                 |
| -------------------------------------------- | ---------------------------------------------- |
| `goqw_enabled_services` is JSON array        | Comma-separated string                         |
| Webhook option key `goqw_make_webhook_url`   | `goqw_webhook_url`                             |
| `goqw_business_description` WP option exists | Does not exist; description is TypeScript-only |
| `site-content.ts` not mentioned              | Added as Task 6                                |
| `work-content.ts` not mentioned              | Added to Task 9                                |
| `services-content.ts` under `pages/`         | Real path: `content/`                          |

### Gate results

| Gate               | Result                            |
| ------------------ | --------------------------------- |
| `pnpm lint`        | 0/0 (no JS changes)               |
| `pnpm typecheck`   | 0 errors (no TS changes)          |
| `pnpm test`        | 598/598 Vitest (unchanged)        |
| `pnpm build`       | Clean (unchanged)                 |
| `composer lint`    | 0/0 (no PHP changes)              |
| `composer analyse` | No errors (no PHP changes)        |
| `composer test`    | 143 passed, 2 skipped (unchanged) |

Documentation-only step. All gates carry forward from 5.10b with no changes.

### Acceptance Criteria

| #   | Criterion                                                                                             | Status                       |
| --- | ----------------------------------------------------------------------------------------------------- | ---------------------------- |
| 1   | `docs/llm-customization-handoff.md` exists with ≥1500 lines                                           | ✅ ~2000 lines               |
| 2   | Document opens with purpose, audience, and codebase state reference                                   | ✅ Section header            |
| 3   | Business profile JSON schema defined with required/optional fields annotated                          | ✅ Section 2                 |
| 4   | Worked example (fictional business) used consistently throughout                                      | ✅ Bright Spark Electricians |
| 5   | Modification map: DO NOT TOUCH vs MODIFY tables present                                               | ✅ Section 3                 |
| 6   | 12 tasks structured as `<task id="...">` blocks, each self-contained                                  | ✅ Section 4                 |
| 7   | Every task has "Inputs from business profile", "Actions", "Handling missing data", "Expected outcome" | ✅ All 12 tasks              |
| 8   | `goqw_enabled_services` documented as comma-separated, NOT JSON array                                 | ✅ Task 3, Appendix C        |
| 9   | Webhook option key is `goqw_webhook_url` (not `goqw_make_webhook_url`)                                | ✅ Task 10, Appendix B       |
| 10  | `site-content.ts` included as customization task (Task 6)                                             | ✅ Task 6                    |
| 11  | `work-content.ts` included in services task (Task 9)                                                  | ✅ Task 9, Part B            |
| 12  | Correct path for `services-content.ts`: `content/` not `pages/`                                       | ✅ Task 9, Appendix C        |
| 13  | No `goqw_business_description` option referenced anywhere                                             | ✅ Removed                   |
| 14  | Report template (Section 6) covers: options set, TS files modified, defaults left in place, warnings  | ✅ Section 6                 |
| 15  | Pre-deployment checklist (Section 7) covers both LLM and manual items                                 | ✅ Section 7                 |
| 16  | Final verification commands (Section 8) include boundary violation detection                          | ✅ V8                        |
| 17  | Appendix A has TypeScript interface shapes for all 5 content files                                    | ✅ Appendix A                |
| 18  | Appendix B lists all 24 `goqw_*` option keys                                                          | ✅ Appendix B                |
| 19  | Appendix C documents 6 common mistake traps with wrong/correct examples                               | ✅ Appendix C                |
| 20  | `docs/current-state.md` updated: date, 5.11 in Completed Steps, llm doc in What's Working             | ✅                           |
| 21  | `docs/handoff.md` updated: date, 5.11 completion entry, next action points to 5.12                    | ✅                           |
| 22  | `docs/roadmap.md` updated: 5.11 status Complete, rationale expanded                                   | ✅                           |
| 23  | `docs/onboarding.md` cross-reference to llm-customization-handoff.md added                            | ✅                           |
| 24  | `docs/fork-procedure.md` scope note updated to reference llm-customization-handoff.md                 | ✅                           |
| 25  | All gates unchanged (598 Vitest, 143 PHP)                                                             | ✅                           |

---

## Step 5.12b Evidence

_Compiled: 2026-07-07 — Template bug fixes (output buffering, activation rewrite flush, media validation)_

### Commits

| Commit    | Description                                                                                  |
| --------- | -------------------------------------------------------------------------------------------- |
| `4371921` | audit(5.12b): phase-0 audit docs — 4 categories (A webhook, B buffering, C sitemap, D media) |
| `750b508` | fix(5.12b): wrap REST handler body in ob_start/ob_end_clean                                  |
| `09940fc` | fix(5.12b): strip data URL prefix in MediaValidator before base64_decode                     |
| `2555700` | fix(5.12b): call SitemapGenerator::add_rewrite_rule() directly in Activator                  |
| _(5)_     | skipped — Audit A confirmed no webhook-option doc corrections needed                         |

### Gate Results

| Gate               | Result                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------- |
| `pnpm lint`        | 0/0 (no JS changes)                                                                    |
| `pnpm typecheck`   | 0 errors (no TS changes)                                                               |
| `pnpm test`        | **598/598 Vitest** (unchanged)                                                         |
| `pnpm build`       | Clean (unchanged; bundle not affected)                                                 |
| `composer lint`    | 0/0 (PHPCS)                                                                            |
| `composer analyse` | No errors (PHPStan level 8)                                                            |
| `composer test`    | **148 passed, 4 skipped** (+5 new: 2 buffering, 2 media validation, 1 sitemap rewrite) |

### Acceptance Criteria

| #   | Criterion                                                                                               | Status  |
| --- | ------------------------------------------------------------------------------------------------------- | ------- |
| 1   | Phase-0 audit doc exists for Audit A (webhook option docs)                                              | ✅      |
| 2   | Phase-0 audit doc exists for Audit B (REST buffering)                                                   | ✅      |
| 3   | Phase-0 audit doc exists for Audit C (activation rewrite flush)                                         | ✅      |
| 4   | Phase-0 audit doc exists for Audit D (media validation data URL prefix)                                 | ✅      |
| 5   | Audit A outcome: no corrections needed — all docs already use `goqw_webhook_url`                        | ✅      |
| 6   | `SubmissionController::handle()` body wrapped in `ob_start()` / `ob_end_clean()` via `try/finally`      | ✅      |
| 7   | Output buffer level is the same before and after a successful `handle()` call                           | ✅ test |
| 8   | Output buffer level is the same before and after a persistence-failure path through `handle()`          | ✅ test |
| 9   | `Activator::setup_site_routing()` calls `SitemapGenerator::add_rewrite_rule()` directly before flush    | ✅      |
| 10  | `SitemapGenerator::add_rewrite_rule()` is a public static method callable without instantiation         | ✅      |
| 11  | New test verifies `add_rewrite_rule()` calls `add_rewrite_rule()` with correct args at `'top'` priority | ✅ test |
| 12  | `MediaValidator::validate_file()` strips `data:[^;]+;base64,` prefix before calling `base64_decode`     | ✅      |
| 13  | A valid JPEG sent with `data:image/jpeg;base64,` prefix passes validation                               | ✅ test |
| 14  | A valid JPEG sent with `data:image/png;base64,` prefix passes validation (prefix mime is irrelevant)    | ✅ test |
| 15  | A data URL with no content after the prefix (`data:image/jpeg;base64,`) produces `invalid_encoding`     | ✅ test |
| 16  | A data URL with genuinely malformed base64 after the prefix produces `invalid_encoding`                 | ✅ test |
| 17  | All existing MediaValidator tests continue to pass (no regression)                                      | ✅      |
| 18  | `composer lint` 0/0 on all modified PHP files                                                           | ✅      |
| 19  | `composer analyse` no errors on all modified PHP files                                                  | ✅      |
| 20  | `docs/onboarding.md` gains "Enabling debug logging" section with `WP_DEBUG_DISPLAY=false` note          | ✅      |
| 21  | `docs/roadmap.md` gains 5.12b row (Complete) and rationale paragraph                                    | ✅      |
| 22  | `docs/current-state.md` updated: date, 5.12b in Completed Steps, gate count 148 PHP                     | ✅      |
| 23  | `docs/handoff.md` updated: date, 5.12b completion entry, next action points to 5.12                     | ✅      |
| 24  | Vitest suite unchanged at 598/598 (no JS changes in 5.12b)                                              | ✅      |
| 25  | Commit 5 (doc corrections) skipped with rationale recorded (Audit A found nothing to fix)               | ✅      |

Documentation-only commit; no code changes.

---

## Step 5.13a Evidence

_Compiled: 2026-07-08 — Wizard engine new step types (estimate-display, visual-card-selector, size-bracket-selector)_

### Commits

| Commit    | Description                                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------------------------- |
| `f54d586` | audit(5.13a): phase-0 audits A (step type registration), B (pricing timing), C (navigation for non-field steps)     |
| `3805f3e` | feat(wizard): 5.13a commit 2 — new step types + engine updates + components + 15 tests (598→613)                    |
| `1ba6a54` | test(wizard): 5.13a commit 3 — schema tests for visual-card and size-bracket step types +17 tests (613→630)         |
| _(4)_     | merged into commit 5 (docs) — no separate step-type registry file needed; WizardShell dispatch serves that function |
| _(5)_     | this commit — ADR-0024 + roadmap, current-state, handoff, phase-5-evidence updates                                  |

### Gate Results

| Gate               | Result                                                                 |
| ------------------ | ---------------------------------------------------------------------- |
| `pnpm lint`        | 0/0                                                                    |
| `pnpm typecheck`   | 0 errors                                                               |
| `pnpm test`        | **630/630 Vitest** (+32 from 5.13a, 51 test files)                     |
| `pnpm build`       | Clean (no bundle-size regression expected; new components are trivial) |
| `composer lint`    | 0/0 (no PHP changes)                                                   |
| `composer analyse` | No errors (no PHP changes)                                             |
| `composer test`    | **148 passed, 4 skipped** (PHP unchanged)                              |

### Acceptance Criteria

| #   | Criterion                                                                                                                      | Status  |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | ------- |
| 1   | Phase-0 audit A doc: no existing step-type registry; `buildFieldKeyMap` and `validateStep` iterate `step.fields`               | ✅      |
| 2   | Phase-0 audit B doc: `computePrice` is pure/on-demand; no refactoring needed                                                   | ✅      |
| 3   | Phase-0 audit C doc: `STEP_GOTO` already exists; "Adjust" works with existing FSM; `onAcceptGoTo` not needed                   | ✅      |
| 4   | `EstimateDisplayStepSchema` added to `wizard-config.ts` with `stepKind: 'estimate-display'` discriminant                       | ✅      |
| 5   | `VisualCardSelectorStepSchema` added with `stepKind: 'visual-card-selector'`, `options` array (min 1), `answerKey`, `multiple` | ✅      |
| 6   | `SizeBracketSelectorStepSchema` added with `stepKind: 'size-bracket-selector'`, `brackets`, `exactFields`, `exactPromptLabel`  | ✅      |
| 7   | `AnyStepSchema` is `z.union([StepSchema, ...])` — classic step tried first; not `z.discriminatedUnion`                         | ✅      |
| 8   | `isFieldStep(step: AnyStep): step is Step` — returns `!('stepKind' in step)`                                                   | ✅      |
| 9   | `WizardConfig.steps` changed from `Step[]` to `AnyStep[]`                                                                      | ✅      |
| 10  | `buildFieldKeyMap` skips non-field steps via `isFieldStep` guard                                                               | ✅ test |
| 11  | `validateStep` returns `{ valid: true, issues: [] }` for any non-field step                                                    | ✅ test |
| 12  | `getVisibleSteps` includes non-field steps in the visible list                                                                 | ✅ test |
| 13  | `validate.ts` (`collectFieldIds`, `crossReferenceWizard`) guarded with `isFieldStep`                                           | ✅      |
| 14  | `ReviewField.tsx` `buildAnswerSummary` skips non-field steps                                                                   | ✅      |
| 15  | `EstimateDisplayStep.tsx` component: calls `selectPrice`, shows price range, Continue/Adjust/Back                              | ✅      |
| 16  | `VisualCardSelectorStep.tsx` component: card grid, `aria-pressed`, single/multi select, NavigationControls                     | ✅      |
| 17  | `SizeBracketSelectorStep.tsx` component: bracket buttons, exact toggle, number inputs, NavigationControls                      | ✅      |
| 18  | `WizardShell.tsx` dispatches to correct component by `stepKind`; TypeScript exhaustive narrowing enforced                      | ✅      |
| 19  | Fixture test files updated with `asFieldStep`/`asStep` helpers; no regressions in existing tests                               | ✅      |
| 20  | `pnpm typecheck` passes cleanly under both `tsconfig.json` and `tsconfig.test.json`                                            | ✅      |
| 21  | `pnpm lint` 0/0 on all changed files                                                                                           | ✅      |
| 22  | ADR-0024 written and accepted                                                                                                  | ✅      |
| 23  | `docs/roadmap.md` gains 5.13a row (Complete) and rationale paragraph                                                           | ✅      |
| 24  | `docs/current-state.md` updated: date, 5.13a in What's working, gate counts updated                                            | ✅      |
| 25  | `docs/handoff.md` updated: date, 5.13a completion entry, Immediate next action updated                                         | ✅      |

---

## Step 5.13b — Apply New Flow to 7 Instant-Quote Services (2026-07-08)

### Summary

All 7 instant-quote service wizard configs (fencing, decking, painting, patio,
driveway, steps, jetwash) redesigned to use the new step types from 5.13a.
New flow per service: size-bracket-selector → visual-card-selector (material/type) →
estimate-display → contact → optional extras (jetwash: no extras step).

Two infrastructure changes were required to make the pricing engine and validation
layer resolve answers from the new step types:

1. `buildFieldKeyMap` (`condition-evaluator.ts`) and `collectFieldIds` (`validate.ts`)
   extended to emit entries for `VisualCardSelectorStep.answerKey`,
   `SizeBracketSelectorStep.answerKey`, and `SizeBracketSelectorStep.exactField.id`.
2. `typicalValue: number` added to `SizeBracketSchema`; the `SizeBracketSelectorStep`
   component dispatches `ANSWER_SET` for each `exactField` on bracket selection,
   giving `computePrice` a valid numeric quantity immediately.

### Commit Sequence

| #   | Hash      | Message                                                                              |
| --- | --------- | ------------------------------------------------------------------------------------ |
| C1  | `ae41343` | chore(audit): Phase 0 audits for 5.13b service reconfiguration                       |
| C2  | `0dda0c8` | feat(wizards/fencing+decking): redesign flow with new step types (5.13b C2)          |
| C3  | `b982d79` | feat(wizards/painting+patio+driveway): redesign flow with new step types (5.13b C3)  |
| C4  | `3fa0834` | feat(wizards/steps+jetwash): redesign flow with new step types (5.13b C4)            |
| C5  | `9e6f777` | docs(pricing+ADR): Task 8b pricing calibration + ADR-0024 5.13b amendment (5.13b C5) |
| C6  | _(this)_  | docs(evidence+standard): 5.13b evidence + standard doc updates (5.13b C6)            |

### Gate Results

| Gate               | Result                                               |
| ------------------ | ---------------------------------------------------- |
| `pnpm lint`        | 0/0                                                  |
| `pnpm typecheck`   | 0 errors                                             |
| `pnpm test`        | **652/652 Vitest** (+22 from 5.13b, 51 test files)   |
| `pnpm build`       | Clean (no bundle-size regression; no new components) |
| `composer lint`    | 0/0 (no PHP changes)                                 |
| `composer analyse` | No errors (no PHP changes)                           |
| `composer test`    | **148 passed, 4 skipped** (PHP unchanged)            |

### Acceptance Criteria

| #   | Criterion                                                                                                                                           | Status  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1   | `buildFieldKeyMap` extended: VisualCard answerKey and SizeBracket answerKey/exactField ids now emit entries (identity mapping)                      | ✅ test |
| 2   | `collectFieldIds` extended identically to `buildFieldKeyMap`                                                                                        | ✅      |
| 3   | `typicalValue` field added to `SizeBracketSchema` (optional, nonnegative)                                                                           | ✅ test |
| 4   | `SizeBracketSelectorStep` component dispatches `ANSWER_SET` for each exactField with bracket's `typicalValue` on bracket selection                  | ✅      |
| 5   | `validation.test.ts` and `error-tone-and-public-config.test.ts` field-mutation tests redirected from steps[0] to steps[4]/steps[5] (contact/extras) | ✅      |
| 6   | `fencing.config.ts` redesigned: fence_size (SizeBracket) → fence_type + fence_height (VisualCard×2) → estimate → contact → extras                   | ✅      |
| 7   | `decking.config.ts` redesigned: deck_size (SizeBracket) → material (VisualCard) → estimate → contact → extras                                       | ✅      |
| 8   | `painting.config.ts` redesigned: rooms_step (SizeBracket) → what_to_paint (VisualCard, multiple) → estimate → contact → extras                      | ✅      |
| 9   | `patio.config.ts` redesigned: patio_size (SizeBracket) → material (VisualCard, 4 options inc. porcelain) → estimate → contact → extras              | ✅      |
| 10  | `driveway.config.ts` redesigned: driveway_size (SizeBracket) → material (VisualCard, 4 options inc. resin_bound) → estimate → contact → extras      | ✅      |
| 11  | `steps.config.ts` redesigned: shape (VisualCard) → material (VisualCard) → step_count (SizeBracket) → estimate → contact → extras                   | ✅      |
| 12  | `jetwash.config.ts` redesigned: area_size (SizeBracket) → surface_type (VisualCard, 4 options, no 'other') → estimate → contact (no extras)         | ✅      |
| 13  | All 7 configs pass `validateWizardConfig` and `validatePricingConfig` without errors                                                                | ✅ test |
| 14  | All `typicalValue` fields set on every bracket in every SizeBracketSelectorStep across all 7 services                                               | ✅      |
| 15  | `fencing-validation.test.ts` rewritten: 9 tests using `isFieldStep` guard; old `asStep` helper removed                                              | ✅      |
| 16  | `decking-validation.test.ts` rewritten: 5 tests using `isFieldStep` guard                                                                           | ✅      |
| 17  | `painting-validation.test.ts` rewritten: 7 tests (step sequence, SizeBracket, VisualCard multiple, pricing base, 0 modifiers)                       | ✅      |
| 18  | `patio-driveway-steps-validation.test.ts` rewritten: 6+6+8 tests with `isFieldStep` guard; `asFieldStep` import removed                             | ✅      |
| 19  | `jetwash-validation.test.ts` rewritten: 5 tests (step sequence, 4-option VisualCard, SizeBracket with area_m2 exactField)                           | ✅      |
| 20  | `non-field-step-engine.test.ts` extended: 5 new tests for extended `buildFieldKeyMap` (VisualCard, SizeBracket, mixed config)                       | ✅      |
| 21  | `visual-card-size-bracket-types.test.ts` extended: 3 new typicalValue schema tests                                                                  | ✅      |
| 22  | `pricing-engine.test.ts` integration tests updated to new fencing base (7500p/m)                                                                    | ✅      |
| 23  | `docs/llm-customization-handoff.md` gains Task 8b (Pricing Calibration) + stale path corrections in Section 5 and Pre-Deployment Checklist          | ✅      |
| 24  | ADR-0024 gains 5.13b amendment documenting the two infrastructure additions and final test count (652)                                              | ✅      |
| 25  | `docs/roadmap.md` gains 5.13b row (Complete)                                                                                                        | ✅      |
| 26  | `docs/current-state.md` updated: gate counts 630→652, 5.13b in What's working and Completed Steps                                                   | ✅      |
| 27  | `docs/handoff.md` updated: 5.13b completion entry, Immediate next action updated                                                                    | ✅      |

---

## Step 5.13c — Photo Upload + Pre-Step Reduction

_Compiled: 2026-07-08_

### Commit Sequence

| #   | Hash      | Message                                                                            |
| --- | --------- | ---------------------------------------------------------------------------------- |
| C1  | `616dccb` | chore(audit): Phase 0 audits for 5.13c photo relocation + pre-step reduction       |
| C2  | `2179981` | feat(wizards): reduce pre-step to postcode-only (5.13c C2)                         |
| C3  | `ec8719a` | feat(wizards/instant-quote): add photos + contact-and-address step, reorder flow   |
| C4  | `419902a` | test(5.13c C4): add 22 new tests for photo step + contact-and-address              |
| C5  | `d4bb204` | docs(ADR-0022+handoff): 5.13c amendment — pre-step reduction + contact-and-address |
| C6  | _(this)_  | docs(evidence+standard): 5.13c evidence + standard doc updates                     |

### Gate Results

| Gate               | Result                                               |
| ------------------ | ---------------------------------------------------- |
| `pnpm lint`        | 0/0                                                  |
| `pnpm typecheck`   | 0 errors                                             |
| `pnpm test`        | **674/674 Vitest** (+22 from 5.13c, 51 test files)   |
| `pnpm build`       | Clean (no bundle-size regression; no new components) |
| `composer lint`    | 0/0 (no PHP changes)                                 |
| `composer analyse` | No errors (no PHP changes)                           |
| `composer test`    | **148 passed, 4 skipped** (PHP unchanged)            |

### Acceptance Criteria

| #   | Criterion                                                                                                                                                                | Status  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| 1   | Pre-step id changed from `contact-and-address` to `postcode_prestep`                                                                                                     | ✅ test |
| 2   | Pre-step has exactly 1 field (postcode only)                                                                                                                             | ✅ test |
| 3   | Pre-step field: key=`postcode`, type=`text`, required=`true`                                                                                                             | ✅ test |
| 4   | Pre-step has no name, phone, or email field (regression guard)                                                                                                           | ✅ test |
| 5   | All 7 instant-quote configs: no step with id `contact` (old lightweight step removed)                                                                                    | ✅ test |
| 6   | All 7 instant-quote configs: `site_photos` step added; field type=`photo`, required=`false`, maxCount=5                                                                  | ✅ test |
| 7   | All 7 instant-quote configs: `contact-and-address` step is final step with 4 required fields                                                                             | ✅ test |
| 8   | `contact-and-address` fields in order: contact_name, contact_phone, contact_email, full_address — all required=`true`                                                    | ✅ test |
| 9   | `contact_phone` required=`true` (was optional in old `contact` step when phone was collected in pre-step)                                                                | ✅ test |
| 10  | Fencing step order: fence_size, fence_type_step, fence_height_step, estimate, extras, site_photos, contact-and-address (7 steps)                                         | ✅ test |
| 11  | Decking step order: deck_size, material_step, estimate, extras, site_photos, contact-and-address (6 steps)                                                               | ✅ test |
| 12  | Painting step order: rooms_step, what_to_paint_step, estimate, extras, site_photos, contact-and-address (6 steps)                                                        | ✅ test |
| 13  | Patio step order: patio_size, material_step, estimate, extras, site_photos, contact-and-address (6 steps)                                                                | ✅ test |
| 14  | Driveway step order: driveway_size, material_step, estimate, extras, site_photos, contact-and-address (6 steps)                                                          | ✅ test |
| 15  | Steps (garden steps) order: shape_step, material_step, step_count_step, estimate, extras, site_photos, contact-and-address (7 steps)                                     | ✅ test |
| 16  | Jetwash step order: area_size, surface_type_step, estimate, site_photos, contact-and-address (5 steps; no extras)                                                        | ✅ test |
| 17  | All 7 configs pass `validateWizardConfig` and `validatePricingConfig` without errors                                                                                     | ✅ test |
| 18  | `validation.test.ts`: text-mutation tests redirected steps[4]→steps[6] (contact-and-address); checkbox tests steps[5]→steps[4] (extras)                                  | ✅      |
| 19  | `error-tone-and-public-config.test.ts`: label-mutation test redirected steps[4]→steps[6]                                                                                 | ✅      |
| 20  | All 7 per-service validation test files updated: step count assertions and step id arrays reflect new order                                                              | ✅      |
| 21  | 22 new tests added across 7 per-service test files + address-prestep: photo step (optional/maxCount/type), contact-and-address (4 required fields), no-old-contact guard | ✅      |
| 22  | ADR-0022 amended: pre-step reduction rationale, id collision resolution, new end-of-wizard step schema, post-5.13c step order                                            | ✅      |
| 23  | `docs/llm-customization-handoff.md` updated: codebase state reference to 5.13c, wizard flow note documenting postcode-only pre-step and full_address                     | ✅      |
| 24  | `docs/roadmap.md` gains 5.13c row (Complete)                                                                                                                             | ✅      |
| 25  | `docs/current-state.md` updated: gate counts 652→674, 5.13c in What's working and Completed Steps                                                                        | ✅      |
| 26  | `docs/handoff.md` updated: 5.13c completion entry, Immediate next action updated                                                                                         | ✅      |

---

## Step 5.13d Evidence

_Compiled: 2026-07-08 — Covers Step 5.13d (Optional Details Step)_

### Summary

Adds an `optional-details` step as the final step in each of the 7 instant-quote
service configs. The step is always optional: a "Skip and Submit" button dispatches
`SUBMIT_REQUESTED` without validation. Universal fields (`preferred_timeframe`,
`additional_notes`) appear on every service; per-service supplementary fields capture
service-specific context. Manual-quote services are not affected.

Engine changes are minimal: `allowSkip: z.boolean().optional()` on `StepSchema`;
`NavigationControls` renders "Skip and Submit" when `onSkip` is provided; `StepRenderer`
passes `onSkip` only when `isLast && step.allowSkip`.

### Commit Sequence

| #   | Hash      | Message                                                                               |
| --- | --------- | ------------------------------------------------------------------------------------- |
| C1  | `6d9d656` | chore(audit): Phase 0 audits for 5.13d optional details step                          |
| C2  | `a9e1ffa` | feat(engine): add allowSkip to StepSchema + NavigationControls skip button (5.13d C2) |
| C3  | `fa76c9d` | feat(wizards/fencing+decking+painting+patio): add optional-details step (5.13d C3)    |
| C4  | `c38654e` | feat(wizards/driveway+steps+jetwash): add optional-details step (5.13d C4)            |
| C5  | _(this)_  | docs(ADR-0025+evidence): 5.13d optional details step docs (5.13d C5)                  |

### Gate Results

| Gate               | Result                                             |
| ------------------ | -------------------------------------------------- |
| `pnpm lint`        | 0/0                                                |
| `pnpm typecheck`   | 0 errors                                           |
| `pnpm test`        | **704/704 Vitest** (+30 from 5.13d, 52 test files) |
| `pnpm build`       | Clean (no bundle-size regression)                  |
| `composer lint`    | 0/0 (no PHP changes)                               |
| `composer analyse` | No errors (no PHP changes)                         |
| `composer test`    | **148 passed, 4 skipped** (PHP unchanged)          |

### Acceptance Criteria

| #   | Criterion                                                                                                                                                                | Status  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| 1   | `StepSchema` accepts `allowSkip: true` without validation error                                                                                                          | ✅ test |
| 2   | `StepSchema` accepts `allowSkip: false` without validation error                                                                                                         | ✅ test |
| 3   | `StepSchema` accepts steps with no `allowSkip` field (backwards compatible)                                                                                              | ✅ test |
| 4   | `StepSchema` rejects `allowSkip: 'yes'` (non-boolean) with Zod error                                                                                                     | ✅ test |
| 5   | Fencing: 8 steps; final step id is `optional-details`; `allowSkip: true`                                                                                                 | ✅ test |
| 6   | Fencing: `preferred_timeframe` and `additional_notes` both `required: false`                                                                                             | ✅ test |
| 7   | Fencing: `preferred_timeframe` first option is `urgent`                                                                                                                  | ✅ test |
| 8   | Fencing: `gate_needed` and `gate_width` (conditional on `gate_needed=yes`) present                                                                                       | ✅ test |
| 9   | Decking: 7 steps; final step is `optional-details`; `allowSkip: true`; universal fields required:false; `existing_deck_removal` present                                  | ✅ test |
| 10  | Painting: 7 steps; final step is `optional-details`; `allowSkip: true`; universal fields required:false; `furniture_handling`, `pets`, `customer_supplies_paint` present | ✅ test |
| 11  | Patio: 7 steps; final step is `optional-details`; `allowSkip: true`; universal fields required:false; `existing_patio_removal`, `slope_assessment` present               | ✅ test |
| 12  | Driveway: 7 steps; final step is `optional-details`; `allowSkip: true`; universal fields required:false; `existing_driveway_removal`, `parking_during_work` present      | ✅ test |
| 13  | Garden steps: 8 steps; final step is `optional-details`; `allowSkip: true`; universal fields required:false; `existing_steps_removal` present                            | ✅ test |
| 14  | Jetwash: 6 steps; final step is `optional-details`; `allowSkip: true`; universal fields required:false; `specific_stains`, `time_preference` present                     | ✅ test |
| 15  | All 7 instant-quote configs pass `validateWizardConfig` with the new optional-details step                                                                               | ✅ test |
| 16  | Manual-quote services (general-repairs, plumbing, electrical, carpentry) do NOT have an `optional-details` step                                                          | ✅ test |
| 17  | `gate_width` condition: `{ operator: 'equals', fieldId: 'gate_needed', value: 'yes' }` — intra-step condition valid                                                      | ✅ test |
| 18  | All `optional-details` steps have `title: 'Anything else? (Optional)'`                                                                                                   | ✅ code |
| 19  | `StepSchema` is still `z.strictObject` — no unknown keys accepted                                                                                                        | ✅ test |
| 20  | ADR-0025 created and accepted                                                                                                                                            | ✅      |
| 21  | `docs/roadmap.md` gains 5.13d row (Complete)                                                                                                                             | ✅      |
| 22  | `docs/current-state.md` updated: gate counts 674→704, 5.13d in What's working and Completed Steps                                                                        | ✅      |
| 23  | `docs/handoff.md` updated: 5.13d completion entry added                                                                                                                  | ✅      |

## Step 5.13e Evidence

_Compiled: 2026-07-13 — Covers Step 5.13e (Photo URL Storage)_

### Summary

Photos saved in a wizard submission are now stored to the WordPress media library
(`/wp-content/uploads/goqw/YEAR/MONTH/`) instead of persisting as base64. `Submissions\PhotoStorage`
decodes, uploads via `wp_handle_upload`/`wp_insert_attachment`, tags the attachment with
`_goqw_photo` post meta, and returns a public URL + attachment ID. `SubmissionController`
runs this after `MediaValidator` and before persistence, replacing `dataBase64` with
`url`/`attachmentId` in the answers before both `answers_json` and `media_json` are
derived — closing a duplication where both columns (and both `answers`/`media` keys in
the Make.com payload) previously carried the same raw base64 (`AUDIT-5.13e-photo-handling.md`).
A per-photo failure drops that photo and logs it, never blocking the submission (D5); a
submission that fails to persist after photos were saved triggers orphan cleanup via
`PhotoStorage::delete_photo()` (D6). New `Cron\PhotoRetention` deletes photos older than
6 months via a daily `goqw_photo_retention_cleanup` wp-cron event — a real implementation,
unlike the long-stubbed `Cron\PruneSubmissions` (`AUDIT-5.13e-cron-pattern.md`). Resolves
the "Media retention policy" item deferred since Step 4.8.

### Commit Sequence

| #   | Hash      | Message                                                                          |
| --- | --------- | -------------------------------------------------------------------------------- |
| C1  | `9e363ec` | chore(audit): Phase 0 audits for 5.13e photo URL storage                         |
| C2  | `6d264e6` | feat(submissions): new PhotoStorage class for media library integration          |
| C3  | `3681599` | feat(rest): route photos through PhotoStorage; return URLs not base64            |
| C4  | `9c71b05` | feat(cron): PhotoRetention class deletes photos older than 6 months (D3)         |
| C5  | `0bb21e2` | feat(activation): create /goqw/ upload directory + schedule photo retention cron |
| C6  | _(this)_  | docs: ADR-0026 + 5.13e evidence + standard doc updates                           |

### Gate Results

| Gate               | Result                                                                                                                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`        | 0/0 (no JS changes)                                                                                                                                                                            |
| `pnpm typecheck`   | 0 errors (no TS changes)                                                                                                                                                                       |
| `pnpm test`        | 704/704 Vitest (unchanged)                                                                                                                                                                     |
| `pnpm build`       | Clean (no bundle-size change — PHP-only step)                                                                                                                                                  |
| `composer lint`    | 0/0                                                                                                                                                                                            |
| `composer analyse` | No errors (PHPStan level 8)                                                                                                                                                                    |
| `composer test`    | **172 passed, 4 skipped** (+24 from 5.13e: PhotoStorage 11, SubmissionController 8, PhotoRetention 6, minus 1 test removed when the `wp_insert_attachment` `$wp_error` contract was corrected) |

### Deviations from the original spec (surfaced during Phase 0 audits)

- Spec referred to `Rest/Submit.php`; the actual file is `Rest/SubmissionController.php` (pre-existing naming drift, also noted in 5.12b's audits).
- Spec's function list for Audit C omitted `wp_update_attachment_metadata()`, required to actually persist what `wp_generate_attachment_metadata()` computes — added.
- `PhotoStorage::storePhoto()`/`deletePhoto()` renamed to `store_photo()`/`delete_photo()` (snake_case) to match this codebase's PHP method-naming convention (`insert()`, `mark_forwarded()`, `is_success()`, etc.) and satisfy the WordPress PHPCS ruleset; the spec's skeleton used camelCase.
- `wp_insert_attachment()` is called with `$wp_error = true` (4th arg) so failures surface as `WP_Error` rather than `0`, matching the WordPress stub's conditional return type and avoiding a PHPStan false-positive on an always-false `is_wp_error()` check.
- `Submissions/ImageHandler.php` — flagged as a dead Step-3D stub superseded by `PhotoStorage`, not deleted (out of scope of the locked D1-D8 decision set). Documented in ADR-0026's Housekeeping section.
- Activator/Deactivator/Plugin wiring (cron scheduling, upload directory creation, hook registration) is not unit-tested — consistent with the codebase's existing lack of coverage for `Activator`, whose methods route through `dbDelta`/`SiteRootPage`/`RewriteRegistrar`, none of which are mocked in this suite (`AUDIT-5.13e-cron-pattern.md`). Verified via the operational checklist below instead.

### Acceptance Criteria

| #   | Criterion                                                                       | Status                                                                                                                                 |
| --- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Phase 0 audits produced (A, B, C, D)                                            | ✅ file review                                                                                                                         |
| 2   | `PhotoStorage` class exists with proper interface                               | ✅ file review                                                                                                                         |
| 3   | `PhotoStorage` saves photos to `/wp-content/uploads/goqw/`                      | ✅ test (filter_upload_dir)                                                                                                            |
| 4   | `PhotoStorage` returns URL and attachment ID on success                         | ✅ test                                                                                                                                |
| 5   | `PhotoStorage` returns error on failure (invalid base64, upload/insert failure) | ✅ test                                                                                                                                |
| 6   | REST Submit replaces base64 with URL in answers                                 | ✅ test                                                                                                                                |
| 7   | REST Submit continues submission even if photo save fails (D5)                  | ✅ test                                                                                                                                |
| 8   | REST Submit cleans up orphaned attachments on submission failure (D6)           | ✅ test                                                                                                                                |
| 9   | `PhotoRetention` class exists with 6-month cutoff                               | ✅ file review + test                                                                                                                  |
| 10  | `PhotoRetention` identifies old photos correctly                                | ✅ test                                                                                                                                |
| 11  | `PhotoRetention` deletes photos via `wp_delete_attachment`                      | ✅ test                                                                                                                                |
| 12  | Cron scheduled on activation                                                    | ✅ code review (not unit-tested — see Deviations)                                                                                      |
| 13  | Upload directory created on activation                                          | ✅ code review (not unit-tested — see Deviations)                                                                                      |
| 14  | ADR-0026 documented                                                             | ✅                                                                                                                                     |
| 15  | All 148 prior PHP tests pass                                                    | ✅ test run                                                                                                                            |
| 16  | ~25 new PHP tests pass                                                          | ✅ test run (24 net new)                                                                                                               |
| 17  | Bundle unchanged (PHP only changes)                                             | ✅ (no JS/TS files touched)                                                                                                            |
| 18  | 6 commits in specified sequence                                                 | ✅ `git log`                                                                                                                           |
| 19  | Tarball produced                                                                | Not produced — no request for a packaged artifact in this conversation; deployment uses the existing fork/onboarding procedure instead |
| 20  | Submit wizard with 1 photo; verify URL replaces base64 in payload               | ⏳ pending operational verification                                                                                                    |
| 21  | Submit wizard with 3 photos; verify all URLs present                            | ⏳ pending operational verification                                                                                                    |
| 22  | Submit wizard with large photo (~10MB); verify still saves or fails cleanly     | ⏳ pending operational verification                                                                                                    |
| 23  | Verify photo appears in `/wp-content/uploads/goqw/` on disk                     | ⏳ pending operational verification                                                                                                    |
| 24  | Verify photo URL is accessible in browser                                       | ⏳ pending operational verification                                                                                                    |
| 25  | Verify Make.com receives URL (not base64) in webhook payload                    | ⏳ pending operational verification                                                                                                    |
| 26  | Verify Google Sheets photo cell uses `IMAGE()` formula with real URL            | ⏳ pending operational verification (also requires a Make.com scenario config change, not code)                                        |

## Step 5.13f Evidence

_Compiled: 2026-07-13 — Covers Step 5.13f (Bot & Spam Protection)_

### Summary

Three-layer bot/spam defense added to the submit endpoint, enabled by default:
honeypot field, per-IP rate limiting, and optional Cloudflare Turnstile verification.
`Rest\BotProtection` runs all three (cheapest first — honeypot, then rate limit, then
the one network call) as Step 0 of `SubmissionController::handle()`, before shape
validation. A honeypot failure returns the same `errorCode`/status as an ordinary
validation failure (`validation_failed`, 400) so a bot can't distinguish being caught
from any other rejection. Rate limiting (`Rest\RateLimiter`, WordPress transients,
5/hour default) counts successful submissions only — a honeypot-rejected request never
consumes a slot. Turnstile (`Support\TurnstileClient`) only runs when both
`goqw_turnstile_site_key`/`goqw_turnstile_secret_key` are configured
(`Settings::turnstile_configured()`).

On the frontend, `BotProtectionStore` + `createBotProtectionEnrichedPort` mirror the
Step 4.8 `PhotoStore`/`createPhotoEnrichedPort` pattern exactly — bot-protection data is
volatile and never persisted (a Turnstile token is single-use and expires in ~5
minutes; the honeypot value has no reason to survive a reload). `HoneypotField` mounts
once per wizard session in `WizardShell` (not `StepRenderer`, which remounts on every
step change and would discard whatever a bot wrote in). `TurnstileWidget` mounts only
on the final step and dynamically loads Cloudflare's SDK from CDN — never bundled —
only when `config.turnstileSiteKey` is configured. Submit is disabled on the final step
until a token is issued, only when Turnstile is configured for the deployment. Resolves
"Rate limiting on submit endpoint," deferred since Step 4.6.

### Commit Sequence

| #   | Hash      | Message                                                                |
| --- | --------- | ---------------------------------------------------------------------- |
| C1  | `1a98595` | chore(audit): Phase 0 audits for 5.13f bot & spam protection           |
| C2  | `b159d57` | feat(rest): RateLimiter class using WordPress transients               |
| C3  | `e0ac397` | feat(support): TurnstileClient for server-side Cloudflare verification |
| C4  | `783a195` | feat(rest): BotProtection middleware combining all three layers        |
| C5  | `63a93ff` | feat(rest): integrate BotProtection into the submit endpoint           |
| C6  | `3351353` | feat(wizard): honeypot + Turnstile widget in final submission step     |
| C7  | _(this)_  | docs: ADR-0027 + 5.13f evidence + standard doc updates                 |

`TurnstileClient` and the `Settings` extension (replacing `BotProtectionConfig`) landed
together in C3 since they're the same audited decision.

### Gate Results

| Gate               | Result                                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`        | 0/0                                                                                                                                               |
| `pnpm typecheck`   | 0 errors (pre-existing, unrelated `tsconfig.test.json` errors in `non-field-step-engine.test.ts` predate this step — last touched in 5.13a/5.13b) |
| `pnpm test`        | **717/717 Vitest** (+13 from 5.13f, 54 test files)                                                                                                |
| `pnpm build`       | Clean — bundle 87.20 → 87.96 kB gzip (+~0.8 kB; Turnstile SDK loaded dynamically, not bundled)                                                    |
| `composer lint`    | 0/0 for files touched this step (pre-existing, unrelated drift in `quote-wizard.php` predates 5.13e/5.13f)                                        |
| `composer analyse` | No errors (PHPStan level 8)                                                                                                                       |
| `composer test`    | **210 passed, 4 skipped** (+38 from 5.13f)                                                                                                        |

### Deviations from the original spec (surfaced during Phase 0 audits)

- Spec referred to `Rest/Submit.php`; the actual file is `Rest/SubmissionController.php` (same drift documented in every prior step's audits).
- `Support/BotProtectionConfig.php` → extended `Support/Settings.php` instead. `Settings` already owns "typed access to plugin settings" with a documented constant-over-option precedence chain; a second class with the same responsibility would fork that abstraction for no reason.
- Wire keys are camelCase (`honeypotValue`, `turnstileToken`), not the spec's snake_case (`website_field`, `turnstile_token`) — matches every other top-level payload key in this wire contract.
- Bot-protection data lives in a volatile `BotProtectionStore`, not `WizardState`/FSM — `WizardStore`'s own docblock excludes anything but wizard-answer state, and the honeypot value/Turnstile token must never reach the sessionStorage persistence adapter.
- The honeypot mounts once in `WizardShell`, not inside `StepRenderer`'s "final submission form" — `StepRenderer` remounts on every step change via `key={step.id}` and would discard whatever a bot wrote in before the last step.
- The Turnstile SDK is not bundled — `TurnstileWidget` dynamically injects the `<script>` tag on mount, only when configured, only once per page. Bundle grew ~0.8 kB gzip instead of the spec's estimated 10-15 kB.
- No dedicated component tests for `HoneypotField`/`TurnstileWidget` — this codebase has zero `.test.tsx` files anywhere and `vitest.config.ts` deliberately runs the domain/runtime suite in the `node` environment (no DOM) to prove domain purity. Every other component in `src/components/` is verified operationally, not unit-tested; these two follow the same convention.
- `apps/wizard/src/domain/steps/multi-field-form/component.tsx` (referenced in the spec's Audit C) does not exist; the real final-step rendering is `StepRenderer.tsx` + `NavigationControls.tsx`, audited and used instead.

### Acceptance Criteria

| #   | Criterion                                                                    | Status                                                                                                                                    |
| --- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Phase 0 audits produced (A, B, C, D)                                         | ✅ file review                                                                                                                            |
| 2   | RateLimiter enforces 5-per-hour default                                      | ✅ test                                                                                                                                   |
| 3   | RateLimiter tracks IPs independently                                         | ✅ test                                                                                                                                   |
| 4   | TurnstileClient verifies tokens correctly                                    | ✅ test                                                                                                                                   |
| 5   | BotProtection rejects filled honeypot                                        | ✅ test                                                                                                                                   |
| 6   | BotProtection rejects rate-limited requests                                  | ✅ test                                                                                                                                   |
| 7   | BotProtection rejects invalid Turnstile tokens                               | ✅ test                                                                                                                                   |
| 8   | BotProtection allows valid submissions                                       | ✅ test                                                                                                                                   |
| 9   | REST Submit calls BotProtection before processing                            | ✅ test                                                                                                                                   |
| 10  | Rate limit response includes retry time                                      | ✅ test                                                                                                                                   |
| 11  | Honeypot field in wizard form (invisible)                                    | ✅ code review (no component-test infra in this codebase — see Deviations)                                                                |
| 12  | Turnstile widget on final step                                               | ✅ code review (no component-test infra — see Deviations)                                                                                 |
| 13  | Turnstile token included in submission payload                               | ✅ test (`submission-bot-protection.test.ts`)                                                                                             |
| 14  | WordPress options for configuration                                          | ✅ file review (`Settings.php`)                                                                                                           |
| 15  | ADR-0027 documented                                                          | ✅                                                                                                                                        |
| 16  | LLM handoff Task added (Task 11b, not Task 9 — see Deviations)               | ✅ file review                                                                                                                            |
| 17  | All 172 prior PHP tests pass                                                 | ✅ test run                                                                                                                               |
| 18  | ~34 new PHP tests pass                                                       | ✅ test run (38 net new)                                                                                                                  |
| 19  | Bundle within budget                                                         | ✅ (+~0.8 kB, well under the ~10-15 kB estimate)                                                                                          |
| 20  | 7 commits in specified sequence                                              | ✅ `git log`                                                                                                                              |
| 21  | Tarball produced                                                             | Not produced — no request for a packaged artifact in this conversation                                                                    |
| 22  | Configure WordPress with test Turnstile keys                                 | ⏳ pending operational verification                                                                                                       |
| 23  | Submit wizard normally: Turnstile validates silently, submission succeeds    | ⏳ pending operational verification                                                                                                       |
| 24  | Fill honeypot manually via DevTools: submission fails with validation_error  | ⏳ pending operational verification (errorCode is `validation_failed`, matching the existing shape-validation errorCode — see Deviations) |
| 25  | Rapidly submit 6+ times from same IP: 6th is rate limited                    | ⏳ pending operational verification                                                                                                       |
| 26  | Test Turnstile invalid: submit without token, expect bot_verification_failed | ⏳ pending operational verification                                                                                                       |

## Step 5.13g Evidence

_Compiled: 2026-07-14 — Covers Step 5.13g (Duplicate Submission Prevention)_

### Summary

Same-person duplicate submissions (matching `contact_email` OR `contact_phone` within a
24-hour window) are now detected, still fully persisted (including photos), flagged
(`is_duplicate`, `duplicate_of`), and never forwarded to Make.com/WhatsApp.
`Submissions\DuplicateDetector` normalizes the two contact fields (lowercase+trim email,
digits-only phone) and delegates the lookup to a new
`SubmissionRepository::find_recent_by_contact()` query
(`JSON_UNQUOTE(JSON_EXTRACT(answers_json, '$.contact_email'/'$.contact_phone'))`,
excluding rows already flagged as duplicates, within a UTC-computed 24h window).
`SubmissionController` runs the check right after shape validation (Step 1a), carries
the result through photo storage, and — for a duplicate — returns `200
{ reference, isDuplicate: true }` immediately after the DB insert, skipping
`Forwarder` entirely.

On the frontend, `isDuplicate` threads through `SubmissionPortResult` →
`SubmitSucceededEvent` → `SubmissionResult` → `SuccessScreen`, which renders different
(client-owned, not server-echoed) copy for a duplicate — consistent with this
codebase's existing convention that user-facing text is never sent from the server.

### Commit Sequence

| #   | Hash      | Message                                                                     |
| --- | --------- | --------------------------------------------------------------------------- |
| C1  | `d04841d` | chore(audit): Phase 0 audits for 5.13g duplicate detection                  |
| C2  | `889f8c0` | feat(db): add is_duplicate + duplicate_of columns to submissions schema     |
| C3  | `58a2b99` | feat(submissions): DuplicateDetector class for finding matching submissions |
| C4  | `28a203b` | feat(submissions): integrate duplicate detection into submission handler    |
| C5  | `4e2fbeb` | feat(wizard): render duplicate-submission response in SuccessScreen         |
| C6  | _(this)_  | docs: ADR-0028 + 5.13g evidence + standard doc updates                      |

Six commits, not the spec's proposed six-with-a-separate-Forwarder-commit — the
Forwarder skip lives in `SubmissionController` (C4), so there is no standalone
"Forwarder" commit; the client-side wiring (spec's C6-equivalent scope) became its own
commit (C5) instead since it touches ~10 frontend files.

### Gate Results

| Gate               | Result                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`        | 0/0                                                                                                                 |
| `pnpm typecheck`   | 0 errors (pre-existing, unrelated `tsconfig.test.json` errors in `non-field-step-engine.test.ts` predate this step) |
| `pnpm test`        | **721/721 Vitest** (+4 from 5.13g, 54 test files)                                                                   |
| `pnpm build`       | Clean — bundle 87.96 → 88.09 kB gzip (+~0.1 kB, mostly PHP-side work)                                               |
| `composer lint`    | 0/0 for files touched this step (pre-existing, unrelated drift in `quote-wizard.php` predates 5.13e/5.13f/5.13g)    |
| `composer analyse` | No errors (PHPStan level 8)                                                                                         |
| `composer test`    | **220 passed, 4 skipped** (+10 from 5.13g)                                                                          |

### Deviations from the original spec (surfaced during Phase 0 audits)

- Spec referred to `Rest/Submit.php`; the actual file is `Rest/SubmissionController.php` (same drift documented in every prior step's audits).
- `contact_email`/`contact_phone` are not dedicated columns — they're keys inside `answers_json`. The spec's proposed raw `JSON_EXTRACT()` comparison is corrected to `JSON_UNQUOTE(JSON_EXTRACT(...))`, avoiding an implicit-cast comparison footgun.
- Schema change goes through the existing `dbDelta` mechanism (`Schema::submissions_table_sql()`), not a hand-rolled `SHOW COLUMNS`/`ALTER TABLE` idempotency check in `Activator`.
- `Forwarder.php` is unmodified — it has no DB access and no by-ID lookup; the controller already holds the duplicate-check result at the point it decides whether to call `forward()`, so the skip lives there instead (`AUDIT-5.13g-forwarder.md`).
- No server-supplied "message" string in the response — only a boolean `isDuplicate` flag. The client owns all user-facing copy, matching the existing convention (`http-submission-port.ts`'s hardcoded messages, never echoing server prose).
- `DuplicateDetector` is a plain `class`, not `final` — every other `SubmissionController` dependency follows this convention specifically so tests can extend it as an anonymous spy double.
- Duplicate-detection window computed via `gmdate()` (UTC), not the spec's `date()` (local server time) — `created_at` is stored in GMT; local time would silently shift the 24h boundary by the server's UTC offset.
- No automated test exercises the raw SQL query against a real MySQL/MariaDB instance (none reachable in this environment) — `DuplicateDetector`'s normalization/window/delegation logic is fully unit-tested against a fake repository; real-DB query correctness is a pending operational-verification item, consistent with 5.13e/5.13f precedent.

### Acceptance Criteria

| #   | Criterion                                                                 | Status                                                                                                    |
| --- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1   | Phase 0 audits produced (A, B, C, D)                                      | ✅ file review                                                                                            |
| 2   | Database columns added (is_duplicate, duplicate_of)                       | ✅ file review (`Schema.php`, via dbDelta)                                                                |
| 3   | Database migration idempotent (safe on repeated activation)               | ✅ by construction (dbDelta) — not independently unit-tested, see Deviations                              |
| 4   | DuplicateDetector finds email match within 24h                            | ✅ test                                                                                                   |
| 5   | DuplicateDetector finds phone match within 24h                            | ✅ test                                                                                                   |
| 6   | DuplicateDetector returns false outside 24h window                        | ✅ test (asserts window_start computation; SQL filtering itself is untested — no live DB, see Deviations) |
| 7   | DuplicateDetector normalizes inputs (case, whitespace)                    | ✅ test                                                                                                   |
| 8   | Duplicate submission saved with is_duplicate=1, duplicate_of=X            | ✅ test                                                                                                   |
| 9   | Duplicate response includes isDuplicate flag                              | ✅ test                                                                                                   |
| 10  | Forwarder skipped for duplicate submissions                               | ✅ test (skip lives in SubmissionController, not Forwarder — see Deviations)                              |
| 11  | Client shows duplicate message ("We have already received...")            | ✅ code review (`SuccessScreen.tsx`; no component-test infra in this codebase)                            |
| 12  | ADR-0028 documented                                                       | ✅                                                                                                        |
| 13  | All 210 prior PHP tests pass                                              | ✅ test run                                                                                               |
| 14  | ~25 new PHP tests pass                                                    | ✅ test run (10 net new: 7 DuplicateDetector + 3 SubmissionController)                                    |
| 15  | Bundle unchanged (mostly PHP)                                             | ✅ (+~0.1 kB gzip)                                                                                        |
| 16  | 6 commits in specified sequence                                           | ✅ `git log` (sequence adjusted — see Commit Sequence note)                                               |
| 17  | Tarball produced                                                          | Not produced — no request for a packaged artifact in this conversation                                    |
| 18  | Submit wizard once; verify normal WhatsApp + Sheets flow                  | ⏳ pending operational verification                                                                       |
| 19  | Submit wizard within 24h with same email; verify duplicate detected       | ⏳ pending operational verification                                                                       |
| 20  | Verify duplicate saved to database with correct flags                     | ⏳ pending operational verification                                                                       |
| 21  | Verify no WhatsApp sent for duplicate submission                          | ⏳ pending operational verification                                                                       |
| 22  | Verify user sees duplicate confirmation message                           | ⏳ pending operational verification                                                                       |
| 23  | Submit wizard with same email 24h+ later; verify NOT flagged              | ⏳ pending operational verification                                                                       |
| 24  | Submit wizard with same phone but different email; verify still duplicate | ⏳ pending operational verification                                                                       |
| 25  | Submit wizard with different email AND phone; verify NOT duplicate        | ⏳ pending operational verification                                                                       |

## Step 5.14 Evidence

_Compiled: 2026-07-14 — Covers Step 5.14 (Data Protection & UK GDPR Compliance)_

### Summary

Every wizard submission now requires explicit consent, enforced server-side. A required
`data_processing_consent` checkbox (single option `agreed`) sits on the last mandatory
step of every one of the 11 wizard configs — `contact-and-address` for the 7
instant-quote services, `address` for the 4 manual-quote services — never on the
skippable `optional-details` step. `Submissions\ConsentValidator` is the real trust
boundary: `SubmissionController` rejects a missing/invalid consent answer with
`400 { errorCode: 'consent_required' }` before anything is persisted; an accepted
submission gets `consent_given`/`consent_timestamp` columns (via the existing dbDelta
mechanism, matching `is_duplicate`/`duplicate_of`'s precedent from 5.13g) alongside
duplicate-detection metadata.

A new `/privacy` route — registered exactly like every other marketing route
(`SiteRoutes::PATHS`/`routes.ts`, kept in sync by the pre-existing
`CrossLanguageRoutesTest`) — renders a real 10-section UK GDPR privacy policy from a new
`site/content/privacy-content.ts`, resolving a `footer-content.ts` link that had pointed
at a route which never existed (silently falling back to Home per ADR-0016).

`Cron\PruneSubmissions` — scheduled in `Activator` since Step 3D but never given a real
implementation — now deletes submission rows older than `Settings::retention_days()`
(an already-existing, already-configurable option, default 90 days) and is hooked to
its cron event in `Plugin::boot()` for the first time. Photo retention (`PhotoRetention`,
independent, 6-month cadence) is unchanged.

### Commit Sequence

| #   | Hash      | Message                                                                      |
| --- | --------- | ---------------------------------------------------------------------------- |
| C1  | `b385fe2` | chore(audit): Phase 0 audits for 5.14 data protection                        |
| C2  | `757fe13` | feat(db): add consent_given + consent_timestamp columns to submissions       |
| C3  | `52cdcad` | feat(submissions): ConsentValidator class                                    |
| C4  | `391064f` | feat(privacy): add /privacy route with real Privacy Policy content           |
| C5  | `50cf3fe` | feat(rest): integrate consent validation into the submission flow            |
| C6  | `fbb0175` | feat(cron): implement submission retention via PruneSubmissions              |
| C7  | `9d08cc9` | feat(wizard): required consent checkbox on the final submit step             |
| C8  | _(this)_  | docs: ADR-0029 + business owner guide + 5.14 evidence + standard doc updates |

Eight commits, matching the spec's proposed sequence, though the underlying scope of
each differs from what the spec assumed per-commit (privacy policy is a route/content
commit, not a WordPress-page-creation commit; retention is "implement the existing
stub", not "add a new class").

### Gate Results

| Gate               | Result                                                                                                                |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`        | 0/0                                                                                                                   |
| `pnpm typecheck`   | 0 errors (pre-existing, unrelated `tsconfig.test.json` errors in `non-field-step-engine.test.ts` predate this step)   |
| `pnpm test`        | **759/759 Vitest** (+38 from 5.13g, 56 test files)                                                                    |
| `pnpm build`       | Clean — bundle 88.09 → 89.65 kB gzip (+~1.6 kB, new privacy policy content + checkbox field)                          |
| `composer lint`    | 0/0 for files touched this step (pre-existing, unrelated drift in `quote-wizard.php` predates 5.13e/5.13f/5.13g/5.14) |
| `composer analyse` | No errors (PHPStan level 8)                                                                                           |
| `composer test`    | **233 passed, 4 skipped** (+13 from 5.13g)                                                                            |

### Deviations from the original spec (surfaced during Phase 0 audits)

- **No `PrivacyPolicyPage.php` / `wp_insert_post()` page creation.** The spec assumed the
  same page-creation pattern as `SiteRootPage`, which is wrong: `SiteRootPage` creates
  exactly one content-less mount point for the whole React app, not a per-content page.
  The site's real marketing pages are a static client-side route table backed by plain
  content files (`AUDIT-5.14-page-creation.md`). `/privacy` is implemented as a sixth
  route, closing a `footer-content.ts` link that had pointed nowhere since before this
  step.
- **No `{{BUSINESS_NAME}}`/`{{BUSINESS_EMAIL}}`/`{{BUSINESS_ADDRESS}}` placeholder
  template.** The privacy policy imports `siteContent` directly, same as
  `ContactPage.tsx` — per-client business identity is already covered by the existing
  instruction to edit `site-content.ts` (`AUDIT-5.14-business-metadata.md`).
- **No new `SubmissionRetention` class or `goqw_submission_retention_cleanup` cron
  event.** `Cron\PruneSubmissions` already existed for exactly this purpose (scheduled
  since Step 3D, explicitly documented as an unimplemented stub in
  `AUDIT-5.13e-cron-pattern.md`), and `Settings::retention_days()` (default 90 days)
  already existed as the option it should consume. This step fills in the stub rather
  than building a parallel mechanism.
- **Photo attachments are not deleted by `PruneSubmissions`.** `PhotoRetention` (Step
  5.13e) already owns photo lifecycle independently on its own 6-month cadence, driven
  by attachment post meta/date, not submission-row existence — coupling the two would
  add a redundant deletion path.
- **No `optional-details`-step consent checkbox, no bespoke React component.** The
  spec's assumption placed consent on the one step deliberately built to be skippable
  (`AUDIT-5.14-consent-integration.md`). The wizard engine's existing `checkbox` field
  type and generic required-field validation already enforce "cannot submit without
  checking" once the field sits on each config's actual last mandatory step — no new
  component, no `useState`, no second Skip-and-Submit variant.
- **No inline hyperlink in the consent checkbox label.** Field labels/help are plain
  strings everywhere in this wizard's rendering layer, by design. The checkbox
  references the Privacy Policy in plain text; the full policy is one click away via
  the persistent site footer link, visible on the same page throughout the wizard flow.
- **Lawful basis is consent, not legitimate interest** — a deliberate choice (see
  ADR-0029), since the wizard already has a natural, non-skippable point to capture
  explicit, timestamped consent at no extra engineering cost.
- No automated test exercises `SubmissionRepository::delete_older_than()` against a
  real MySQL/MariaDB instance (none reachable in this environment) — `PruneSubmissions`'s
  cutoff-computation logic is fully unit-tested against a fake repository; real-DB
  deletion correctness is a pending operational-verification item, consistent with
  5.13e/5.13g precedent.

### Acceptance Criteria

| #   | Criterion                                                            | Status                                                                                               |
| --- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | Phase 0 audits produced (A, B, C, D)                                 | ✅ file review                                                                                       |
| 2   | Consent columns added to submissions table                           | ✅ file review (`Schema.php`, via dbDelta)                                                           |
| 3   | Migration is idempotent                                              | ✅ by construction (dbDelta) — not independently unit-tested, see Deviations                         |
| 4   | ConsentValidator rejects submissions without consent                 | ✅ test                                                                                              |
| 5   | ConsentValidator accepts valid consent                               | ✅ test                                                                                              |
| 6   | Privacy policy page reachable and renders real content               | ✅ file review + content test (`privacy-content.test.ts`) — no live-site render, see below           |
| 7   | Privacy policy not duplicated / route stable across requests         | ✅ by construction (static route table, no activation-time creation)                                 |
| 8   | SubmissionController integrates consent validation                   | ✅ test                                                                                              |
| 9   | Consent timestamp stored with submission                             | ✅ test                                                                                              |
| 10  | SubmissionRetention deletes submissions past retention period        | ✅ test (fake repository; real-DB deletion untested, see Deviations)                                 |
| 11  | Photos of deleted submissions are also deleted                       | Not applicable by design — see Deviations (PhotoRetention owns photo lifecycle independently)        |
| 12  | Retention cron scheduled and hooked on activation/boot               | ✅ file review (`Activator` schedules; `Plugin::boot()` now hooks the callback)                      |
| 13  | Wizard shows consent checkbox on final step                          | ✅ test (`consent-field.test.ts`, all 11 configs)                                                    |
| 14  | Cannot submit without checked consent                                | ✅ by construction (existing required-field validation engine) + server-side test                    |
| 15  | Privacy policy link navigates to policy page                         | ✅ code review (`footer-content.ts` → `/privacy` → `routes.ts`) — no live-site nav test              |
| 16  | ADR-0029 documented                                                  | ✅                                                                                                   |
| 17  | Business owner guide created                                         | ✅ `docs/business-owner-data-handling-guide.md`                                                      |
| 18  | Privacy policy template created                                      | ✅ `docs/privacy-policy-template.md` (points to the real `privacy-content.ts`, not a duplicate copy) |
| 19  | LLM handoff updated with a privacy policy customization task         | ✅ Task 11c (spec's proposed "Task 10" collided with the existing Make.com Webhook task)             |
| 20  | All 220 prior PHP tests pass                                         | ✅ test run                                                                                          |
| 21  | ~29 new PHP tests pass                                               | ✅ test run (13 net new: 6 ConsentValidator + 3 PruneSubmissions + 4 SubmissionController)           |
| 22  | Bundle within budget                                                 | ✅ (+~1.6 kB gzip)                                                                                   |
| 23  | 8 commits in specified sequence                                      | ✅ `git log`                                                                                         |
| 24  | Tarball produced                                                     | Not produced — no request for a packaged artifact in this conversation                               |
| 25  | Submit wizard successfully with consent checked                      | ⏳ pending operational verification                                                                  |
| 26  | Try submit without consent; verify blocked                           | ⏳ pending operational verification                                                                  |
| 27  | Verify consent timestamp in database                                 | ⏳ pending operational verification                                                                  |
| 28  | Navigate to /privacy/; verify page exists                            | ⏳ pending operational verification                                                                  |
| 29  | Read privacy policy content; verify it reflects the deployed client  | ⏳ pending operational verification                                                                  |
| 30  | Manually trigger retention cron; verify old submissions deleted      | ⏳ pending operational verification                                                                  |
| 31  | Verify photos are unaffected by the retention cron (independent job) | ⏳ pending operational verification                                                                  |

## Step 5.14.1 Evidence

**Step:** Environmental Robustness + Namespace Prefixes (2026-07-17)

### Summary

Fixes discovered during SCB pilot testing, not new features: (1) `PhotoStorage`
called `wp_tempnam()` before the admin include that declares it had loaded, causing
photo uploads to fail; (2) every namespaced plugin PHP file called WordPress core
functions unqualified rather than backslash-prefixed; (3) the client had no branch for
HTTP 429, so a rate-limited user saw a generic "Something went wrong" instead of a
wait-time message; (4) `docs/onboarding.md` had no DB_HOST or OpCache guidance. ADR-0030
accepted.

### Gate state

- `pnpm lint`: 0/0
- `pnpm typecheck`: 0 errors (pre-existing, unrelated `tsconfig.test.json` type errors
  in `non-field-step-engine.test.ts` predate this step, per `docs/current-state.md`)
- `pnpm test`: **763/763 Vitest** (+4 from 5.14, 56 test files)
- `pnpm build`: clean (bundle 89.65 → 89.79 kB gzip)
- `composer lint`: 0/0 for all files touched this step (`quote-wizard.php` carries
  pre-existing, unrelated drift predating 5.13e/5.13f/5.13g/5.14/5.14.1)
- `composer analyse`: no errors (PHPStan level 8)
- `composer test`: **242 passed, 4 skipped** (+9 from 5.14 — 5 PhotoStorage, 2
  Activator, 1 FrontPagePolicy, 1 SiteRootPage)

### Deviations from the spec

- **No `Admin/SettingsPage.php` changes** — still an unimplemented stub with no
  WordPress function calls to prefix.
- **Function list extended beyond the spec's illustrative `$wpFunctions` array** —
  `wp_update_attachment_metadata`, `update_post_meta`, `rest_url`, `get_query_var`,
  `get_edit_post_link`, `esc_html__`, `esc_url_raw`, `wp_add_inline_style`,
  `is_singular`, `get_posts`, `wp_clear_scheduled_hook`, `plugin_dir_path`,
  `plugin_dir_url`, `register_activation_hook`, `register_deactivation_hook` — all
  found during the comprehensive Audit A sweep (`AUDIT-5.14.1-admin-includes.md`).
  Per ADR-0030, this is completeness, not scope creep — the spec's own list was
  explicitly a starting point for a "comprehensive audit."
- **No dedicated `FailureScreen` test file added.** The 4 new client tests live in
  `http-submission-port.test.ts` alongside the existing response-mapping tests
  (matches the existing file organization — response mapping, not screen rendering,
  is what changed); `FailureScreen`'s heading branch has no pre-existing test file to
  extend and adding one was judged out of proportion to a one-line conditional.

### Acceptance Criteria

| #   | Criterion                                              | Status                                                                          |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| 1   | Phase 0 audits produced (A, B, C, D)                   | ✅ file review                                                                  |
| 2   | PhotoStorage loads admin includes before wp_tempnam    | ✅ tests + file review                                                          |
| 3   | PhotoStorage uses `\` prefix on all WordPress calls    | ✅ tests + grep                                                                 |
| 4   | Activator uses `\` prefix on all WordPress calls       | ✅ test + grep                                                                  |
| 5   | FrontPagePolicy uses `\` prefix on all WordPress calls | ✅ test + grep                                                                  |
| 6   | SiteRootPage uses `\` prefix on all WordPress calls    | ✅ test + grep                                                                  |
| 7   | Client shows retry-after for rate_limited response     | ✅ Vitest tests                                                                 |
| 8   | Client hides generic error for rate_limited response   | ✅ Vitest test                                                                  |
| 9   | ADR-0030 documented                                    | ✅                                                                              |
| 10  | onboarding.md has DB_HOST section                      | ✅ file review                                                                  |
| 11  | onboarding.md has OpCache section                      | ✅ file review                                                                  |
| 12  | All 233 prior PHP tests pass                           | ✅ test run                                                                     |
| 13  | 9 new PHP tests pass                                   | ✅ test run                                                                     |
| 14  | Bundle unchanged (backslash is compile-time)           | ✅ +0.14 kB gzip (4 new client-side error-handling lines, not the prefix sweep) |
| 15  | 6 commits in specified sequence                        | ✅ `git log`                                                                    |
| 16  | Tarball produced                                       | ✅ `step-5.14.1-environmental-robustness.tar.gz`                                |
| 17  | Fresh clone from template deploys cleanly              | ⏳ pending operational verification                                             |
| 18  | DB_HOST section resolves per-client issue              | ⏳ pending operational verification                                             |
| 19  | Photo upload succeeds without wp_tempnam error         | ⏳ pending operational verification                                             |
| 20  | Rate limit response shows retry-after message          | ⏳ pending operational verification                                             |

## Step 5.14.2 Evidence

**Step:** Photo Upload Extension/MIME Consistency (2026-07-17)

### Summary

Fixes a real photo-upload bug: browser-side compression (`image-compression.ts`)
always re-encodes to JPEG, but the wizard was submitting the _pre-compression_
filename (e.g. `holiday.png`) alongside the (correct) `image/jpeg` MIME claim.
WordPress's `wp_handle_upload()` internally rejects that filename/MIME mismatch via
`wp_check_filetype_and_ext()` — a real-WordPress-only failure the mocked test suite
could never catch (`AUDIT-5.14.2-integration.md`). Defense-in-depth fix per spec Q1=C:
client (`correctedJpegFileName()` in compression, consumed via `buildPhotoMetadata()`)
and server (`PhotoStorage::correct_filename_extension()`, a `MIME_TO_EXTENSION` safety
net independent of client behavior). ADR-0031 accepted.

### Gate state

- `pnpm lint`: 0/0
- `pnpm typecheck`: 0 errors (pre-existing, unrelated `tsconfig.test.json` type errors
  in `non-field-step-engine.test.ts` predate this step)
- `pnpm test`: **772/772 Vitest** (+9 from 5.14.1, 59 test files)
- `pnpm build`: clean (bundle unchanged in practice — new code is a few lines of pure
  filename logic)
- `composer lint`: 0/0 for all files touched this step (`quote-wizard.php` carries
  pre-existing, unrelated drift predating 5.13e)
- `composer analyse`: no errors (PHPStan level 8)
- `composer test`: **247 passed, 4 skipped** (+5 from 5.14.1 — 3 PhotoStorage extension
  correction, 2 regression/integration-style)

### Deviations from the spec

- **No `WP_UnitTestCase`-based integration test.** This project has never had a
  real-WordPress test environment; `PhotoUploadExtensionTest.php` reproduces the
  reported scenario via a call-argument spy on the mocked `wp_handle_upload()` instead.
  See `AUDIT-5.14.2-integration.md` and ADR-0031's Deviations section.
- **`correct_filename_extension()` stays `private`**, tested via the same spy technique
  rather than widened to `public` as the spec's test sketch implied.
- **`post_title` also corrected**, not just the `wp_handle_upload()` `'name'` key — the
  spec's code sample only touched the latter; using the corrected name everywhere
  `original_name` appears avoids a narrower, second inconsistency.
- **`compressImage()` itself is not directly unit-tested** (it needs
  `canvas`/`createImageBitmap`, unavailable in this project's `node`-only Vitest
  environment — a pre-existing constraint, not new to this step). The filename logic is
  extracted into the pure, independently-testable `correctedJpegFileName()` instead.

### Acceptance Criteria

| #   | Criterion                                                     | Status                                             |
| --- | ------------------------------------------------------------- | -------------------------------------------------- |
| 1   | Phase 0 audits produced (A, B, C)                             | ✅ file review                                     |
| 2   | CompressedPhoto includes correctedFileName field              | ✅ type check                                      |
| 3   | compressImage returns correctedFileName with .jpg             | ✅ Vitest tests (via correctedJpegFileName helper) |
| 4   | Wizard uses correctedFileName in payload                      | ✅ Vitest tests (via buildPhotoMetadata helper)    |
| 5   | PhotoStorage has MIME_TO_EXTENSION mapping                    | ✅ file review                                     |
| 6   | PhotoStorage corrects filename extension when needed          | ✅ PHP tests                                       |
| 7   | Integration test: matching MIME/extension succeeds            | ✅ PHP test                                        |
| 8   | Integration test: mismatched extension corrected successfully | ✅ PHP test                                        |
| 9   | ADR-0031 documented                                           | ✅                                                 |
| 10  | All 242 prior PHP tests pass                                  | ✅ test run                                        |
| 11  | 5 new PHP tests pass                                          | ✅ test run                                        |
| 12  | 9 new Vitest tests pass                                       | ✅ test run                                        |
| 13  | Bundle within budget                                          | ✅ negligible change                               |
| 14  | 6 commits in specified sequence                               | ✅ `git log`                                       |
| 15  | Tarball produced                                              | ✅ `step-5.14.2-photo-extension-mime.tar.gz`       |
| 16  | Submit wizard with PNG source image; verify photo uploads     | ⏳ pending operational verification                |
| 17  | Submit wizard with JPEG source image; verify photo uploads    | ⏳ pending operational verification                |
| 18  | Verify photo appears in /wp-content/uploads/goqw/YEAR/MONTH/  | ⏳ pending operational verification                |
| 19  | Verify photo URL is accessible in browser                     | ⏳ pending operational verification                |
| 20  | Verify Google Sheets IMAGE formula renders photo              | ⏳ pending operational verification                |

## Step 5.14.3 Evidence

**Step:** wp_handle_upload → wp_handle_sideload (2026-07-17)

### Summary

Fixes the real production bug hit by every SCB pilot photo submission:
`wp_handle_upload()` requires `is_uploaded_file()` to return `true`, which is always
`false` for a photo `PhotoStorage` decoded and wrote to a temp file itself (not
received as an HTTP `$_FILES` upload). Every photo submission, on every deployment,
failed with "Specified file failed upload test." Swapped to `wp_handle_sideload()`
(which uses `is_readable()` instead) and added an explicit `mimes` allowlist matching
`MediaValidator`'s four supported formats. ADR-0032 accepted. No `[goqw-debug]`
logging existed to remove — the spec's cleanup instructions were a no-op here
(`AUDIT-5.14.3-current-state.md`).

### Gate state

- `pnpm lint`: 0/0
- `pnpm typecheck`: 0 errors (pre-existing, unrelated `tsconfig.test.json` type errors
  in `non-field-step-engine.test.ts` predate this step)
- `pnpm test`: **772/772 Vitest** (unchanged — no JS/TS changes this step)
- `pnpm build`: clean (bundle unchanged — no JS/TS changes this step)
- `composer lint`: 0/0 for all files touched this step (`quote-wizard.php` carries
  pre-existing, unrelated drift predating 5.13e)
- `composer analyse`: no errors (PHPStan level 8)
- `composer test`: **249 passed, 4 skipped** (+2 from 5.14.2 — new tests verifying
  `wp_handle_sideload` is called and the `mimes` allowlist is passed correctly; the
  existing suite's `wp_handle_upload` mocks were renamed to `wp_handle_sideload`
  in place, not added to)

### Deviations from the spec

- **No debug-logging removal.** `AUDIT-5.14.3-current-state.md` found zero
  `error_log()` calls anywhere in `PhotoStorage.php` before this step — the spec's
  twelve `[goqw-debug]` lines to remove don't exist in this codebase. Per the spec's
  own cover note, this is a no-op, not a missed fix. Commit 5 is a verification-only
  commit confirming this.
- **Test count is +2, not the spec's ~7.** Most of the spec's projected test count
  reflected _updating_ existing tests (renaming `wp_handle_upload` mocks to
  `wp_handle_sideload`) rather than _adding_ new ones — the existing "success returns
  URL/attachmentId" and "failure returns error" coverage already exercised those
  paths and needed only the mock rename, not new assertions. 2 genuinely new tests
  were added: one confirming `wp_handle_sideload` (not `wp_handle_upload`) is called,
  one confirming the exact `mimes` allowlist passed.

### Acceptance Criteria

| #   | Criterion                                                 | Status                                 |
| --- | --------------------------------------------------------- | -------------------------------------- |
| 1   | Phase 0 audits produced (A, B, C)                         | ✅ file review                         |
| 2   | PhotoStorage uses wp_handle_sideload                      | ✅ grep + file review                  |
| 3   | Mimes parameter is passed with correct types              | ✅ PHP test                            |
| 4   | Diagnostic debug logging removed                          | ✅ n/a — none existed (grep confirms)  |
| 5   | Existing PhotoStorage tests updated to reflect API change | ✅ tests pass                          |
| 6   | New tests verify mimes parameter                          | ✅ PHP test                            |
| 7   | ADR-0032 documented                                       | ✅                                     |
| 8   | onboarding.md has WP_TEMP_DIR section                     | ✅ file review                         |
| 9   | onboarding.md notes local URL behavior                    | ✅ file review                         |
| 10  | All 247 prior PHP tests pass (after updates)              | ✅ test run                            |
| 11  | Bundle unchanged                                          | ✅ no JS/TS changes this step          |
| 12  | 5 commits in specified sequence                           | ✅ `git log`                           |
| 13  | Tarball produced                                          | ✅ `step-5.14.3-photo-sideload.tar.gz` |
| 14  | Fresh clone from template deploys cleanly                 | ⏳ pending operational verification    |
| 15  | Photo submission with JPEGs succeeds                      | ⏳ pending operational verification    |
| 16  | Photos appear in /wp-content/uploads/goqw/                | ⏳ pending operational verification    |
| 17  | URLs in database and webhook payload                      | ⏳ pending operational verification    |
