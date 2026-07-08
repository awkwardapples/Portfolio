# Current State

_Last updated: 2026-07-08 (post Step 5.13a)_

## What's working

- Wizard engine (FSM, validation, navigation, persistence).
- Pricing engine (computePrice, gate enforcement).
- Manual-quote routing: wizards with `quoteMode: 'manual'` bypass pricing and go directly to submission.
- Category navigation (optional): CategorySelector phase before service selection when `enableCategoryNavigation` is true.
- Submission pipeline end-to-end in WordPress (validate → persist → forward → respond).
- Site shell with 5 routes (Home, Services, Our Work, Contact, Quote).
- Service abstraction (fencing + decking verticals).
- Photo upload (multi-photo, browser compression, server-side validation, base64 in payload).
- WordPress page mapping (single root page + rewrite rules + non-invasive front-page policy).
- SEO Layer 1: per-route titles, meta descriptions, canonical URLs, Open Graph tags, Twitter cards.
- SEO Layer 2: LocalBusiness JSON-LD schema (name, address, phone, email, hours, sameAs).
- SEO Layer 3: Service JSON-LD schema per active service (11 services, filterable by goqw_enabled_services).
- SEO Layer 4: custom `/sitemap.xml` (5 React routes); `robots.txt` Sitemap directive.
- LLM customization handoff document (`docs/llm-customization-handoff.md`): 12-task instruction set for per-client content, SEO, and wizard configuration.
- REST endpoint output buffering: PHP warnings from WP_DEBUG_DISPLAY no longer corrupt JSON responses.
- Plugin activation rewrite flush: `/sitemap.xml` now accessible immediately after activation without manual `wp rewrite flush`.
- Media validation: data URL prefix accepted, allowing browsers that prepend `data:image/jpeg;base64,` to succeed.
- Wizard engine step types: `estimate-display`, `visual-card-selector`, and `size-bracket-selector` steps added alongside classic field steps. `AnyStep` discriminated union and `isFieldStep` guard applied throughout the engine and UI.

## Gate state (last verified)

- `pnpm lint`: 0/0
- `pnpm typecheck`: 0 errors
- `pnpm test`: 630/630 (51 test files, +32 from 5.13a)
- `pnpm build`: clean
- `composer test`: 148 passed, 4 skipped (PHP unchanged from 5.12b)
- `composer analyse`: clean (PHPStan level 8, no errors)
- `composer lint`: 0/0 (PHPCS)

## Gate state (5.13a, 2026-07-08)

- `pnpm lint`: 0/0
- `pnpm typecheck`: 0 errors
- `pnpm test`: **630/630 Vitest** (+32 from 5.13a, 51 test files)
- `pnpm build`: clean (no bundle size change expected — new step components add negligible weight)
- `composer lint`: 0/0 (no PHP changes)
- `composer analyse`: no errors (no PHP changes)
- `composer test`: **148 passed, 4 skipped** (PHP unchanged)

## Gate state (5.12b, 2026-07-07)

- `pnpm lint`: 0/0 (no JS changes)
- `pnpm typecheck`: 0 errors (no TS changes)
- `pnpm test`: 598/598 Vitest (unchanged)
- `pnpm build`: clean (unchanged)
- `composer lint`: 0/0
- `composer analyse`: no errors
- `composer test`: **148 passed, 4 skipped** (+5 from 5.12b)

## OV-001 verification

**Closed June 5, 2026.** End-to-end functional verification of the system in a
real WordPress install (LocalWP). All Criterion 21 sub-criteria met. See
`docs/phase-5-evidence.md` for the full verification record.

The system is now verified to work end-to-end in WordPress for the first time
across the project. Step 5.3 (Adaptation Runbook) is no longer gated.

## What's NOT yet built

- Step 5.12 (SCB-specific deployment) — gated on 5.8-5.11.
- Media retention policy (deferred per 4.8 spec).
- Idempotency for submission retry (deferred; trigger: first observed duplicate).
- Rate limiting on submit endpoint (deferred; trigger: >100 submissions/day).
- Admin replay UI for failed forwards (deferred; trigger: ops team need).
- Second client deployment (Step 6 candidate; trigger: business decision).

## Critical context

- The plugin is a template, not a feature plugin. It assumes the WordPress
  install is clean (no conflicting existing content at `/services`, `/contact`,
  etc., and either no front page configured or Sample Page only).
- Every step from this point forward includes operational verification, not
  just code gates. See planning discipline addition in `docs/technical-debt.md`.

## Completed Steps

- Step 4.0 — UX shell (design-system primitives: Button, Input, IconButton, Skeleton, Tooltip)
- Step 4.1 — Config schema + validation architecture (Zod schemas, cross-reference validation, fencing fixture)
- Step 4.2 — Wizard state machine (FSM, events, transition(), selectors, navigation helpers, replay, WizardStore, WizardProvider, useWizard/useWizardSelector, persistence, submission port)
- Step 4.3 — Pricing engine integration (computePrice, PricingResult/PricingBreakdown, pricing selectors, pricing gate in transition: validating → submitting blocked when pricing invalid)
- Step 4.4 — React rendering layer (composites, field registry, step renderer, phase screens, WizardShell, App.tsx wired to fencing fixture)
- Step 4.5 — Vertical registry + config resolution (closed registry, resolveVertical, PublicConfig v2, wizardId)
- Step 4.6 — WordPress REST submission adapter — Phase 4 CLOSED
- Step 4.7 — Service abstraction layer
- Step 4.8 — Photo upload pipeline (browser compression + server validation)
- Step 5.0 — Site shell + reference pages
- Step 5.1 — WordPress page mapping + production routing
- **Step 5.2 — OV-001 remediation (F5+F6 code fixes; F1+F3 operational; F2+F4 deferred with triggers)**
- **Step 5.3 — Adaptation runbook (`docs/adaptation-runbook.md`; documentation only)**
- **Step 5.4 — Make.com integration guide (`docs/make-com-integration.md`; documentation only)**
- Step 5.5a-remediation — Wire contract fix and operational verification
  (June 2026). Resolved post-5.5a wire contract drift where the submission
  payload builder hardcoded contractVersion: 2 and omitted quoteMode.
  Both LocalWP sites verified end-to-end per ADR-0018. The `pnpm build`
  command is now composed to run both Vite build and plugin-staging in
  one step, preventing the build-pipeline gap that caused multiple
  debugging episodes during verification.
- **Step 5.5b — Operational fork procedure documentation** (`docs/fork-procedure.md`).
  Captures the corrected clone-and-merge workflow incorporating lessons
  from 5.5a-remediation: sibling-directory layout, `template` remote
  naming, composed `pnpm build`, post-merge verification, and common
  pitfalls. Documentation-only; no code changes.
- **Step 5.5b-architecture — Rendering architecture implementation** (ADR-0019).
  Plugin-provided minimal page template (`templates/react-host.php`) replaces
  the active theme's template for React-hosted routes via the `template_include`
  filter. WordPress/Kadence chrome no longer appears alongside the React app.
  Theme rendering preserved for wp-admin and non-React surfaces. 7 new PHP tests.
- **Step 5.5b-architecture-fix — Asset enqueue gate fix** (June 2026).
  `AssetLoader` was gating bundle enqueueing on `current_page_has_shortcode()`,
  which never fired under the minimal template (no `the_content()` call). React
  never mounted; pages rendered blank. Fix: `SiteRoutes::is_current_request_react_route()`
  added as shared helper; `AssetLoader::should_enqueue_for_request()` returns
  true on React routes regardless of shortcode. `RenderingArchitecture` and
  `RouteInterceptor` inline guard chains refactored to delegate to the helper.
  ADR-0018 and ADR-0019 amended. 6 new PHP tests.
- **Step 5.6 — Product vision rewrite + roadmap revision** (June 2026).
  Updated `docs/product-vision.md` with the comprehensive template definition:
  7-section homepage library, behavioral/visual layer separation principle,
  9-service wizard library, manual-quote flow, SEO Layers 1-4, per-client
  customization model, 21st.dev workflow, and deployment lifecycle. Revised
  roadmap to reflect template-completeness sequence (5.7-5.11) before
  SCB-specific deployment (5.12). Documentation-only; no code or test changes.
- **Step 5.7 — Section library** (June 2026). ADR-0020 accepted.
  7 sections built (Hero, Intro, ServicesPreview, Process, Projects,
  WhyChooseUs, FAQ), each following behavioral/visual layer separation.
  `home-page-content.ts` established as the per-client composition file.
  `HomePage.tsx` replaced with a composition renderer. 30 new Vitest tests.
- **Step 5.7-remediation — CTA routing, canonical redirect, viewport sizing**
  (June 2026). Three OV findings resolved: WordPress canonical redirect
  suppressed for React routes (`CanonicalRedirectGuard`); section Layouts use
  `SectionLink` for client-side navigation; Hero gains `lg:min-h-screen` and
  content sections gain spacing upgrades within the closed token set.
  ADR-0020 amended. OV-5.7R-1 through OV-5.7R-9 pending operational
  verification.
- **Step 5.8 — Footer template** (June 2026). Template-fixed footer with
  per-client content slots. Follows behavioral/visual layer separation pattern
  from ADR-0020. `Footer/index.tsx` (behavioral) + `Footer/Layout.tsx` (visual)
  - `Footer/types.ts` + `Footer/icons/` (4 inline SVG social icons).
    Per-client content in `footer-content.ts`. Responsive grid (4-col lg / 2-col
    md / stacked mobile). `SiteShell` renders Footer below Router — appears on
    every React route. 8 new pure TS tests. OV-5.8-1 through OV-5.8-12 pending
    operational verification.
- **Step 5.9 — Wizard service library** (June 2026). ADR-0021 accepted.
  11 total services (9 new + 2 existing): 5 instant-quote (painting, patio,
  driveway, steps, jetwash) + 4 manual-quote (general-repairs, plumbing,
  electrical, carpentry). Shared `manualQuotePricingStub` for manual services.
  4 categories populated in `registry/categories.ts` (landscaping, decorating,
  exterior-cleaning, handyman). 11 inline SVG service icons in
  `ServicesPreview/icons/` with string-keyed `ICON_MAP`. `ServicesPreview/Layout.tsx`
  resolves icon keys at render time. `services-content.ts` expanded to 11 services.
  `home-page-content.ts` ServicesPreview shows 6 services with icons. 84 new
  pure TS tests (466→550, 45 test files). Bundle 81.12 kB gzip.
  OV-5.9-1 through OV-5.9-15 pending operational verification.
- **Step 5.9-Remediation** (June 2026). 6 OV findings resolved in 6 commits.
  R1: category nav PHP default → true (ADR-0017 amended). R2: back-button bug
  fixed (pop not append) + Back always visible + first-step Back returns to selector.
  R3: engine-level pre-step (`addressPreStep`) via `SessionConfig.preSteps` +
  `getMergedWizard()` — collects contact details before service steps with
  shared keys for auto-fill. R4: UK format validators (`validatePostcode`,
  `validateEmail`, `validatePhone`) wired via `FORMAT_VALIDATORS` map. R5:
  "quote"/"quote request" suffixes removed from all 11 wizard titles. ADR-0022
  accepted. 45 new tests (550→595, 47 test files).
  OV-5.9-R1 through OV-5.9-R6 pending operational verification.
- **Step 5.10a — On-Page SEO (Layer 1) + Category Back Button** (June 2026).
  ADR-0023 accepted. `SEOMetaEmitter` hooks `wp_head` (priority 5) to emit per-route
  meta description, canonical URL, 6 OG tags, 4 Twitter card tags. `pre_get_document_title`
  filter overrides title for each React route via `SEORouteContent` (5 routes, default
  Acme Fencing content, per-client goqw option overrides). `react-host.php` hard-coded
  `<title>` removed; now emitted by WordPress `_wp_render_title_tag()` inside `wp_head()`.
  `og-image-default.png` (1200×630, 13 KB) ships as placeholder; replaced via
  `goqw_seo_og_image` option. `ServiceSelector` gains category back button ("← All
  categories") shown when `filterByCategoryId` is set. 3 Vitest + 15 PHP tests
  (595→598 Vitest, 104→119 PHP). OV-5.10a-1 through OV-5.10a-13 pending.
- **Step 5.10a-docs — SEO Adaptation Guide (Layer 1)** (June 2026). New
  `docs/seo-adaptation-guide.md` documents how per-client deployments use and
  customize Layer 1 SEO. Covers: all 11 `goqw_seo_*` option keys, per-client setup
  checklist (titles, descriptions, OG image), verification steps, common patterns,
  troubleshooting, and codebase reference. Cross-referenced from `onboarding.md`,
  `fork-procedure.md`, and ADR-0023. Documentation-only; all gates unchanged.
- **Step 5.12b — Template Bug Fixes** (July 2026). Three bugs surfaced during
  SCB pilot deployment, fixed in the template. (1) **REST output buffering:**
  `SubmissionController::handle()` wraps its body in `ob_start()` / `ob_end_clean()`
  via `try/finally` — PHP warnings from `WP_DEBUG_DISPLAY=true` no longer corrupt
  the JSON response body. (2) **Activation rewrite flush:** `Activator::setup_site_routing()`
  now calls `SitemapGenerator::add_rewrite_rule()` directly before `flush_rewrite_rules()`.
  The sitemap rewrite was missing from the flush (it was hook-bound to `init` which
  fires before the activation hook). `/sitemap.xml` now works immediately after
  plugin activation. (3) **Media validation data URL prefix:** `MediaValidator`
  strips `data:mime/type;base64,` prefix before decoding, so browsers that prepend
  this prefix succeed validation. Security unchanged — magic-byte and dimension
  checks still run against decoded bytes. 5 new PHP tests (143→148). 4 audit docs.
  Documentation: debug logging guidance added to `onboarding.md`; 5.12b row added
  to roadmap. No code-gate changes; Commit 5 (docs webhook option) skipped — all
  docs already used correct option name.
- **Step 5.11 — LLM Customization Handoff Document** (June 2026).
  New `docs/llm-customization-handoff.md` (~2000 lines) provides a complete,
  LLM-optimized instruction set for per-client content/SEO/wizard customization.
  Covers 12 sequential tasks (business identity WP options, social links,
  `goqw_enabled_services`, per-route SEO titles and descriptions,
  `site-content.ts`, `footer-content.ts`, `home-page-content.ts` 7 sections,
  `services-content.ts` + `work-content.ts`, webhook URL, OG image, final audit),
  plus the business profile JSON schema, modification map, report template,
  pre-deployment checklist, final verification commands, and three appendices.
  Documentation-only; all gates unchanged (598 Vitest, 143 PHP).
- **Step 5.10b — SEO Layers 2-4** (June 2026). ADR-0023 amended.
  `LocalBusinessSchemaEmitter` emits LocalBusiness JSON-LD at `wp_head` priority 10;
  reads from 8 new `goqw_business_*` / `goqw_social_*` options (seeded in Activator).
  PostalAddress parsed from multi-line `goqw_business_address` or structured JSON override.
  `ServiceSchemaEmitter` emits one Service JSON-LD block per active service (11 services,
  filtered by `goqw_enabled_services`) at `wp_head` priority 11. `SitemapGenerator` serves
  a custom `/sitemap.xml` listing all 5 React routes; disables WP core sitemap.
  `RobotsTxtCustomizer` appends `Sitemap:` directive to `robots.txt` (omitted when private).
  24 new PHP tests (119→143 passed). `docs/seo-adaptation-guide.md` extended with
  Layers 2-4 usage instructions, troubleshooting, and options reference.
  OV-5.10b-1 through OV-5.10b-17 pending operational verification.

## Key Architectural Facts

### Site layer (src/site/\*\*)

- `src/site/content/` — typed TypeScript const modules (site-content.ts,
  services-content.ts, work-content.ts). Edit to adapt for a new client.
- `src/site/routing/` — hand-rolled router. `Link.tsx` dispatches `goqw:navigate`;
  `Router.tsx` is a pure function of `pathname` prop; `routes.ts` is the static table.
- `src/site/layout/` — `SiteShell`, `Header`, `Nav`, `SkipLink`.
- `src/site/Footer/` — `Footer` behavioral component, `Layout.tsx`, `types.ts`, `icons/` (4 social SVGs).
- `src/site/sections/ServicesPreview/icons/` — 11 inline SVG service icons + `ICON_MAP`.
- `src/site/pages/` — five concrete page components. `QuotePage` owns the wizard
  selection/mount (moved from App.tsx in 5.0).
- `SiteApp` owns pathname state + event subscriptions; renders `SiteShell → Router`.
- ESLint boundary: `src/site/**` may NOT import `@/domain/runtime/**` or
  `@/domain/pricing/**` directly.

### Submission pipeline (Step 4.6 — ADR-0015)

Strict ordering: validate → persist → forward → respond.

| HTTP Status | Meaning                                               |
| ----------- | ----------------------------------------------------- |
| 200         | Persisted and forwarded; `{ reference: 'GOQW-<id>' }` |
| 400         | Payload invalid; nothing stored                       |
| 500         | DB failure; nothing forwarded                         |
| 502         | Persisted but forward failed; data is safe            |

- `httpSubmissionPort`: production port; appends `/submit` to `restUrl` namespace base (ADR-0015 amendment 2026-06-05).
- `devSubmissionPort`: fallback when `config.restUrl === ''` (standalone Vite dev).
- `WizardStore.buildRequest()`: builds `SubmissionRequest` including pricing snapshot
  and `clientTimestamp: new Date().toISOString()`.

### Vertical registry (`src/domain/registry/**`)

- `VERTICALS`: closed `Readonly<Record<string, Vertical>>`, frozen at runtime
- `resolveVertical(wizardId): SessionConfig | null` — pure, total, no I/O
- `resolveFallbackVertical()` — returns the `FALLBACK_VERTICAL_ID` entry (`'fencing'`)
- `QuotePage` resolves the vertical from `config.wizardId` (set by PHP → `window.GOQW_CONFIG`)
- Adding a vertical = one PR (new fixture + registry entry)

### PublicConfig v3 contract

- `contractVersion: 3` (bumped from 2 in Step 5.5a; wire payload fix in 5.5a-remediation)
- `wizardId: string` (selects the vertical)
- `enableCategoryNavigation: boolean` (defaults false; opt-in from 5.5a)
- `restUrl`, `restNonce` (used by `httpSubmissionPort`)
- PHP: `PublicConfig::CONTRACT_VERSION = 3`, `goqw_wizard_id` option seeded on activation
- Lockstep requirement: PHP plugin and JS bundle must be upgraded together
- Wire payload must include `quoteMode: 'instant' | 'manual'` (validated by SubmissionController)

### WordPress Routing Layer (Step 5.1)

| Class                      | What                                                                                                     |
| -------------------------- | -------------------------------------------------------------------------------------------------------- |
| `Routing\SiteRoutes`       | PHP copy of the 5 recognized paths; `normalize()`, `is_recognized()`, `is_current_request_react_route()` |
| `Routing\SiteRootPage`     | Idempotent lifecycle for the single WP page backing all routes                                           |
| `Routing\FrontPagePolicy`  | Sets Site Root as front page if not already configured; admin notice otherwise                           |
| `Routing\RewriteRegistrar` | Registers WP rewrite rules for the 4 non-root paths; exposes `goqw_route` query var                      |
| `Routing\RouteInterceptor` | `pre_get_posts` filter — rewrites main query to Site Root for recognized paths                           |
| `Routing\SelfHealer`       | `init` check — recreates Site Root if manually deleted                                                   |
| `Routing\SiteRenderer`     | `the_content` filter (priority 5) — outputs `<div id="qw-root" data-initial-path="...">`                 |
| `CrossLanguageRoutesTest`  | Parses routes.ts and asserts it matches SiteRoutes::PATHS exactly                                        |

## Required Gates

- lint (`pnpm lint` → 0 errors, 0 warnings)
- typecheck (`pnpm typecheck`)
- vitest (`pnpm test` → 598/598)
- build (`pnpm build`)
- PHP: `composer lint` → 0/0, `composer analyse` → no errors, `composer test` → 143 passed (2 skipped)
