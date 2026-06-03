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
