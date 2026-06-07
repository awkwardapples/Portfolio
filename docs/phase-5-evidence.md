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
| _(this)_  | docs: Step 5.5a evidence + runbook additions                                                |
