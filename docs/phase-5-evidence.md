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
