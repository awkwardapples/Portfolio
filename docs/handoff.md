# Handoff

_Last updated: 2026-07-22 (post Step 6.5)_

## Status

- Step 6.5 complete (July 22, 2026): Pre-Existing Cleanup. Three
  long-standing issues resolved, each root-caused before fixing (D3=C
  — no ADR, per D4=C, this is routine hygiene). (1) `quote-wizard.php`
  PHPCS drift: 4 unrelated whitespace findings (missing blank line
  after the file docblock, two misaligned assignment operators in the
  PSR-4 autoloader closure, a missing trailing newline) — 3 fixed via
  `phpcbf`, 1 manual one-line insertion; `composer lint` is 0/0 across
  all 46 plugin files for the first time. (2) `non-field-step-
engine.test.ts`'s two TS2322 errors: the real cause was
  `allStepTypesConfig`'s fixture omitting two Zod-`.default()` fields
  (`multiple`, `showRangeAsRange`) — optional on the schema's parse
  input, but required on `z.infer`'s output type (`WizardConfig`); not
  the "missing types/wrong assertions/deprecated APIs" the spec's own
  Audit B guessed at. Every real service config already sets both
  fields explicitly; only this one test fixture (from 5.13a/5.13b)
  missed them. (3) The "`tsconfig.test.json` error" — investigated and
  found to be the _same_ issue as (2), not an independent third defect:
  the config has no bug; it's simply the only tsconfig that
  type-checks `.test.ts` files at all (production `tsconfig.json`
  explicitly excludes them), so it correctly surfaced the same two
  errors. Fixing (2) was the complete fix for both spec items 2 and 3.
  `pnpm typecheck` is fully clean (production + test) for the first
  time since Step 5.13a/5.13b — the recurring "pre-existing, unrelated
  ..." caveat that's appeared in every gate-state entry since Step
  5.13e is retired starting with this step. Zero functional changes: 0
  new tests (820/820 unchanged), PHP unchanged (250/250), bundle
  byte-identical.
- Step 6.4 complete (July 22, 2026): Service Customization Guide.
  Documentation-only. New `docs/service-customization-guide.md`
  (~1100 lines): a comprehensive, LLM-followable reference covering
  every service-level customization operation (adding, removing,
  modifying questions, adjusting pricing, updating metadata, managing
  categories, toggling quote modes), each with a worked example, the
  reasoning behind it, an explicit sync-obligation checklist, and
  per-operation testing guidance. Four Phase 0 audits
  (`docs/AUDIT-6.4-sync-obligations.md` and three more under
  `apps/wizard/src/`) verified every claim against the real source
  rather than the planning spec's assumptions — several of which were
  wrong: there is no per-service pricing function (`computePrice()` is
  one shared engine evaluating declarative `PricingConfig` data, never
  per-service code); there is no second "category enumeration" file
  beyond `domain/registry/categories.ts`; `ServiceSchemaEmitter.php`'s
  `category` field mirrors but never assigns a category (the real
  assignment is `verticals.ts`'s `categoryId`); and instant-quote
  services have no shared parametrized test suite the way manual-quote
  services do via `MANUAL_CONFIGS`, so adding one always needs a
  bespoke test file. A plausible-looking "6th sync-obligation file"
  (`ICON_MAP`/`services-preview.test.ts`) was investigated and cleared
  — it's a curated homepage-feature subset, not a full-registry mirror,
  so it's correctly _not_ in sync with the 12-service count. Also
  surfaced and resolved a real scope conflict: `llm-customization-
handoff.md`'s Rule 1 explicitly forbids the per-client customization
  LLM from touching `domain/`, PHP, or tests — exactly what the new
  guide instructs an engineer to do — so the new guide's reference in
  that document is framed as a separate, broader task, not something
  Rule 1's narrower persona is now authorized to do. 0 new tests
  (820/820 unchanged), PHP unchanged (250/250), bundle byte-identical
  (90.76 kB gzip — this step also caught and corrected a stale bundle
  figure from 6.3's own evidence doc, recorded mid-step rather than
  after its final commit). ADR-0036 accepted.
- Step 6.3 complete (July 22, 2026): "Other" Service Category. New 12th
  vertical, `other.config.ts`, registered as the last key in
  `domain/registry/verticals.ts`'s `VERTICALS` object literal — the only
  ordering mechanism that exists (no explicit position/displayOrder field
  on `Vertical`), so it appears last in the default service list. Phase 0
  audits found the spec's assumed shape didn't match reality on several
  points: there is no `domain/fixtures/index.ts` aggregator (registration
  is in `domain/registry/verticals.ts`); the manual-quote flow's real
  order is `description → urgency → property → site_photos →
contact_preference → contact → address` — description first, postcode
  last (bundled with consent) — not the assumed postcode-first order, and
  postcode is actually injected engine-side by `QuotePage.tsx` ahead of
  _every_ wizard (instant or manual), unconditionally; and no
  manual-quote service has an `optional-details` step at all. "Other"
  follows the exact uniform structure the other four manual-quote
  services already share (ADR-0021 Decision 3) and deliberately keeps the
  standard `description`/`work_description` field naming rather than the
  spec's `project_description`, so it plugs into the existing shared
  parametrized test suites (`manual-quote-configs.test.ts`,
  `consent-field.test.ts`) as a fifth manual-quote service with zero
  special-casing. Deliberately left uncategorized (no `categoryId`) since
  none of the four existing categories fit a long-tail catch-all; enabled
  by default automatically, no WordPress admin toggle needed, since
  `listEnabledServiceIds()`'s no-override case already returns every
  registered vertical. 17 new Vitest tests (803→820), plus 5 files with
  hardcoded "11 services" counts/lists updated to 12. `ServiceSchemaEmitter.php`
  (PHP SEO Layer 3) also gained an "other" entry per its own documented
  same-commit sync-discipline contract with the JS registry — `category`
  made optional on that one array, omitted for services with none, 1 new
  PHP test (249→250). No other wizard touched. ADR-0035 accepted. Operational verification
  pending (fresh-clone check that "Other" appears last, the description
  step is required, and the submission reaches the database/Google
  Sheets/Make.com payload).
- Step 6.2 complete (July 22, 2026): Fencing Mandatory Post-Estimate
  Questions. New `fencing-details` classic field step inserted in
  `fencing.config.ts` between `extras` and `site_photos` — after the user
  has seen the estimate, before photos/contact. Three required `radio`
  fields: `terrain` (soft/hard/concrete), `post_material`
  (concrete/timber), `gravel_boards` (yes/no) — pure metadata for the
  business owner's final quote prep, no pricing wiring. Phase 0 audits
  found the spec's assumed `multi-field-form` step type doesn't exist
  (the classic `Step`/`fields[]` type — the same one `extras` and
  `contact-and-address` already use — covers this with no schema change),
  that `FieldSchema` has no per-option helper-text field (per-option
  nuance folded into option labels instead; `gravel_boards`' explanation
  uses the existing field-level `help` string), and that there is no
  "Continue disabled" button state anywhere in this codebase — required
  fields are enforced by `validateStep()` blocking the `STEP_NEXT`
  transition, tested directly against the real config instead of a
  nonexistent disabled-button state. `WizardStore.buildRequest()` already
  spreads the whole answers map unfiltered into the submission payload,
  so no plumbing changes were needed for the new fields to reach it. 12
  new Vitest tests (791→803), plus 8 hardcoded `steps[6]` index
  references fixed in `domain/__tests__/validation.test.ts` (shifted to
  index 7). No PHP changes. Fencing-only — no other wizard touched. ADR-
  0034 accepted. Operational verification pending (fresh-clone check that
  the step appears, blocks on incomplete answers, and the new fields
  reach the database/Make.com payload).
- Step 6.1 complete (July 22, 2026): Wizard UX Improvements. Three
  independent UX fixes, scoped to the four instant-quote hard-landscaping
  wizards (fencing, decking, patio, driveway). (1) **Duplicate gate
  question:** fencing asked about a gate twice — `include_gate` in `extras`
  (wired to `fencingPricingConfig`, adds £350) and `gate_needed`/
  `gate_width` in `optional-details` (never wired to pricing, purely
  informational). Removed the unwired duplicate. (2) **Feet equivalents:**
  new `apps/wizard/src/utils/units.ts` converts metric measurements to
  feet/square-feet, correctly distinguishing linear metres (`unit: 'm'`,
  ×3.28084) from square metres (`unit: 'm²'`, ×3.28084² ≈ ×10.76) — the
  spec's suggested single conversion factor would have misreported every
  area-based wizard's brackets by ~3.3×. Wired into the shared
  `SizeBracketSelectorStep.tsx` component (bracket ranges + live
  exact-dimension value), so every wizard on that step kind benefits from
  one fix rather than per-config edits; fencing's static fence-height
  labels ("Up to 1.2m") were edited directly since they have no structured
  numeric backing. (3) **Photo guidance:** the `site_photos` field's help
  text — previously just restating file-format constraints already shown a
  second time by `PhotoField.tsx`'s own hardcoded tip — now gives
  landscaping-quote photo guidance (full-length shots, obstacles, problem
  areas, boundary connection) on the four in-scope wizards. This project
  has zero React Testing Library / `.test.tsx` files anywhere, so the
  conversion math is unit-tested (`units.test.ts`, 13 tests) and the
  component wiring relies on manual/build verification rather than adding a
  new component-testing architecture for a UX-copy step. 20 new Vitest
  tests (772→791 net +19), no PHP changes. ADR-0033 accepted. Operational
  verification pending (fresh-clone manual check of all three changes in
  the browser).
- Step 5.14.3 complete (July 17, 2026): wp_handle_upload → wp_handle_sideload. The
  real production bug behind every SCB pilot photo-upload failure:
  `wp_handle_upload()` requires `is_uploaded_file()` to return true, which is always
  false for a photo `Submissions\PhotoStorage` decoded and wrote to a temp file
  itself — never an actual HTTP `$_FILES` upload. Every photo submission, on every
  deployment, was rejected with "Specified file failed upload test." Swapped to
  `wp_handle_sideload()` (uses `is_readable()` instead — the correct WordPress API
  for programmatic uploads) with an explicit `mimes` allowlist matching
  `MediaValidator`'s four supported formats. `docs/onboarding.md` gained `WP_TEMP_DIR`
  (LocalWP) configuration guidance and a note on why locally-hosted photo URLs don't
  render via Google Sheets' `IMAGE()` formula. No `[goqw-debug]` logging existed to
  remove (audited and confirmed absent — the spec's cleanup instructions were a no-op
  here). 2 new PHP tests (247→249); no JS/TS changes. ADR-0032 accepted. Operational
  verification pending (fresh-clone photo submission on a live site).
- Step 5.14.2 complete (July 17, 2026): Photo upload extension/MIME consistency.
  Browser-side compression (`image-compression.ts`) always re-encodes selected photos
  to JPEG, but the wizard was submitting each photo's pre-compression filename (e.g.
  `holiday.png`) alongside the correct `image/jpeg` MIME claim — WordPress's
  `wp_handle_upload()` rejects that mismatch via `wp_check_filetype_and_ext()`, a
  real-WordPress-only failure the mocked test suite could never catch. Fixed
  client-side (`correctedJpegFileName()` helper in `image-compression.ts`, consumed via
  a new `buildPhotoMetadata()` helper `PhotoField.tsx` now calls) and server-side
  (`Submissions\PhotoStorage::correct_filename_extension()`, a `MIME_TO_EXTENSION`
  safety net applied before `wp_handle_upload()` runs, independent of client behavior —
  defense-in-depth per ADR-0031). This project has no `WP_UnitTestCase`/real WordPress
  test environment, so the regression test spies on the mocked `wp_handle_upload()`'s
  call arguments rather than exercising a real upload pipeline (see
  `AUDIT-5.14.2-integration.md`). 5 new PHP tests (242→247), 9 new Vitest tests
  (763→772). Operational verification pending (PNG/JPEG source uploads on a live site,
  Google Sheets IMAGE formula rendering).
- Step 5.14.1 complete (July 17, 2026): Environmental robustness + namespace
  prefixes. Fixes discovered during SCB pilot testing, not new features. (1)
  `Submissions\PhotoStorage::store_photo()` called `wp_tempnam()` before
  `ensure_upload_functions_loaded()` had run — the require now runs first,
  unconditionally, fixing a real photo-upload failure. (2) Every WordPress core
  function call in namespaced plugin PHP (33 files, 208 call sites) is now
  backslash-prefixed, per `AUDIT-5.14.1-admin-includes.md` and ADR-0030. (3)
  `httpSubmissionPort.mapResponse()` had no branch for HTTP 429 — a rate-limited
  submission fell through to a generic `server_error` and discarded
  `retryAfterSeconds` entirely; it now returns a `'rate_limited'` code with a
  "Please try again in N minute(s)" message, `retryable: false`, and
  `FailureScreen` shows "Please wait a moment" instead of "Something went
  wrong." (4) `docs/onboarding.md` gained LocalWP `DB_HOST` port configuration
  and PHP OpCache troubleshooting sections. 9 new PHP tests (233→242), 4 new
  Vitest tests (759→763). Operational verification pending (fresh-clone deploy,
  photo upload on a live site, rate-limit UX on a live site).
- Step 5.14 complete (July 14, 2026): Data protection & UK GDPR compliance.
  A required `data_processing_consent` checkbox on the last mandatory step of every
  wizard config (never the skippable `optional-details`); `Submissions\ConsentValidator`
  rejects a missing/invalid consent answer with `400 consent_required` before anything
  is persisted. Accepted submissions gain `consent_given`/`consent_timestamp` columns
  (via dbDelta, matching 5.13g's precedent). New `/privacy` route renders a real UK
  GDPR privacy policy (10 sections) from `site/content/privacy-content.ts`, resolving a
  footer link that had pointed nowhere. `Cron\PruneSubmissions` — scheduled since Step
  3D but never implemented — now deletes submissions past `Settings::retention_days()`
  (default 90 days) and is hooked in `Plugin::boot()` for the first time; photo
  retention (`PhotoRetention`, 6 months) is unchanged. 13 new PHP tests (220→233), 38
  new Vitest tests (721→759). ADR-0029 accepted. Operational verification pending
  (consent enforcement, retention cron, and the privacy policy page on a live site).
- Step 5.13g complete (July 14, 2026): Duplicate submission prevention.
  `Submissions\DuplicateDetector` flags a submission whose normalized `contact_email` or
  `contact_phone` matches a non-duplicate submission from the last 24 hours (UTC
  window). A duplicate is still fully persisted (photos included) but marked
  `is_duplicate`/`duplicate_of` and never forwarded to Make.com/WhatsApp — response is
  still `200 { reference, isDuplicate: true }`. `SubmissionController` runs the check
  right after shape validation, before photo storage. `Forwarder.php` is unmodified —
  the skip lives in the controller, which already holds the check result at the point
  it decides whether to forward. Schema gains `is_duplicate`/`duplicate_of`/
  `idx_duplicate_lookup` via the existing `dbDelta` mechanism. Frontend: `isDuplicate`
  threads through `SubmissionPortResult` → `SubmitSucceededEvent` → `SubmissionResult` →
  `SuccessScreen`, which owns its own "already received" copy (server never echoes
  prose). 10 new PHP tests (210→220), 4 new Vitest tests (717→721). ADR-0028 accepted.
  Operational verification pending (live-DB duplicate detection, 24h window boundary,
  WhatsApp suppression on a live site).
- Step 5.13f complete (July 13, 2026): Bot & spam protection. Three-layer defense on
  the submit endpoint, enabled by default: honeypot field (`honeypotValue`, rejected as
  an ordinary `validation_failed`/400 so a bot can't tell it was caught), rate limiting
  (`Rest\RateLimiter`, WordPress transients, 5/hour default via
  `goqw_rate_limit_per_hour`), and optional Cloudflare Turnstile verification
  (`Support\TurnstileClient`, only runs when both Turnstile keys are configured).
  `Rest\BotProtection` runs all three (cheapest first) before shape validation.
  `Settings` gains the bot-protection getters instead of a new `BotProtectionConfig`
  class. `PublicConfig` exposes `turnstileSiteKey` (public by Cloudflare's design).
  Frontend: `BotProtectionStore` + `createBotProtectionEnrichedPort` mirror the Step
  4.8 photo-enrichment pattern (volatile, never persisted). `HoneypotField` mounts once
  per wizard session in `WizardShell`; `TurnstileWidget` mounts only on the final step
  and dynamically loads Cloudflare's SDK from CDN only when configured (bundle grew
  ~0.8 kB gzip, not the ~10-15 kB the spec estimated for a bundled SDK). Resolves the
  "Rate limiting on submit endpoint" item deferred since Step 4.6. 38 new PHP tests
  (172→210), 13 new Vitest tests (704→717). ADR-0027 accepted. Operational verification
  pending (Turnstile widget behavior, rate-limit trip, honeypot trip on a live site).
- Step 5.13e complete (July 13, 2026): Photo URL storage. `Submissions\PhotoStorage`
  saves submission photos to the WordPress media library
  (`/wp-content/uploads/goqw/YEAR/MONTH/`) instead of persisting base64, tags each
  attachment with `_goqw_photo` post meta, and returns a public URL + attachment ID.
  `SubmissionController` runs this after `MediaValidator` and before persistence,
  closing a prior duplication where both `answers_json` and `media_json` (and both
  `answers`/`media` keys in the Make.com webhook payload) carried the same raw base64.
  A per-photo failure drops that photo and logs it without blocking the submission
  (D5); if the submission then fails to persist, any attachments already created are
  deleted (D6, orphan cleanup). New `Cron\PhotoRetention` deletes photos older than 6
  months via a daily `goqw_photo_retention_cleanup` wp-cron event — a real
  implementation, unlike the still-stubbed `Cron\PruneSubmissions`. Resolves the
  "Media retention policy" item deferred since Step 4.8. 24 new PHP tests (148→172).
  No JS/bundle changes. ADR-0026 accepted. Operational verification pending
  (submit-with-photo end-to-end on a live WordPress install).
- Step 5.5a-remediation complete and operationally verified (June 8, 2026).
- Step 5.5b complete (June 9, 2026): fork procedure documented in
  `docs/fork-procedure.md`.
- Step 5.5b-architecture complete (June 9, 2026): plugin-provided minimal
  page template for React-hosted routes; WordPress/Kadence chrome no longer
  appears alongside the React app. ADR-0019 accepted.
- Step 5.5b-architecture-fix complete (June 12, 2026): asset enqueue gate bug
  fixed. `AssetLoader` now enqueues the React bundle on recognized routes
  regardless of shortcode presence. React app mounts and renders visible UI.
  ADR-0018 and ADR-0019 amended with lessons learned.
- Step 5.6 complete (June 14, 2026): product vision rewritten with the full
  template definition — 7-section homepage library, behavioral/visual layer
  separation, 9-service wizard library, SEO layers, per-client customization
  model, 21st.dev workflow. Roadmap revised to reflect template-completeness
  sequence (5.7-5.11) before SCB-specific deployment (5.12).
- Step 5.7 complete (June 14, 2026): section library implemented. ADR-0020
  accepted. 7 sections built (Hero, Intro, ServicesPreview, Process, Projects,
  WhyChooseUs, FAQ) following behavioral/visual layer separation. `home-page-content.ts`
  established as the per-client composition file. `HomePage.tsx` replaced with
  composition renderer. 30 new Vitest tests.
- Step 5.7-remediation complete (June 15, 2026): three OV findings resolved.
  (1) `CanonicalRedirectGuard` PHP class suppresses WordPress canonical redirect
  for React routes — direct URL access to /quote, /services, /our-work, /contact
  now returns 200. (2) All section Layouts use `SectionLink` for client-side
  navigation on internal hrefs. (3) Hero gains `lg:min-h-screen`; content
  sections gain internal spacing upgrades within the closed token set. ADR-0020
  amended. 458/458 Vitest; 104/104 PHP; 75.82 kB gzip.
  Operational verification pending (OV-5.7R-1 through OV-5.7R-9).
- Step 5.8 complete (June 21, 2026): footer template implemented. Footer follows
  behavioral/visual layer separation (ADR-0020 amended). `Footer/index.tsx` +
  `Footer/Layout.tsx` + `FooterContent` type + 4 inline SVG social icons.
  Per-client content in `footer-content.ts`. Responsive grid (4-col lg / 2-col
  md / stacked mobile). Footer rendered by `SiteShell` on every React route.
  8 new Vitest tests (466/466). Bundle 75.77 kB gzip.
  Operational verification pending (OV-5.8-1 through OV-5.8-12).
- Step 5.9 complete (June 22, 2026): wizard service library implemented. ADR-0021
  accepted. 11 total services (9 new + 2 existing). 5 instant-quote services
  (painting, patio, driveway, steps, jetwash) + 4 manual-quote services
  (general-repairs, plumbing, electrical, carpentry). Shared `manualQuotePricingStub`.
  4 categories in `registry/categories.ts`. 11 inline SVG icons in
  `ServicesPreview/icons/` with string-keyed `ICON_MAP`. `services-content.ts`
  expanded to 11; `home-page-content.ts` ServicesPreview shows 6 with icons.
  84 new Vitest tests (466→550). Bundle 81.12 kB gzip. Spec deviation: 11 services
  implemented (vs 9 planned) — patio/driveway/steps split into 3 separate configs.
  Operational verification pending (OV-5.9-1 through OV-5.9-15).
- Step 5.9-Remediation complete (June 24, 2026): 6 OV findings resolved. R1:
  category nav PHP default → true (ADR-0017 amended). R2: back-button bug fixed
  (pop not append); Back always visible; first-step Back returns to service
  selector. R3: engine-level pre-step collects name/postcode/phone/email before
  service steps via `SessionConfig.preSteps` + `getMergedWizard()` (ADR-0022).
  R4: UK format validators for postcode, email, phone wired into
  `answer-validation.ts` via `FORMAT_VALIDATORS` map. R5: "quote"/"quote request"
  removed from all 11 wizard titles. 45 new Vitest tests (550→595, 47 test files).
  Operational verification pending (OV-5.9-R1 through OV-5.9-R6).
- Step 5.10a complete (June 24, 2026): SEO Layer 1 (on-page basics) + category
  back button. ADR-0023 accepted. `SEORouteContent` + `SEOMetaEmitter` PHP module
  emits per-route titles (via `pre_get_document_title`), meta descriptions, canonical
  URLs, 6 OG tags, 4 Twitter card tags into `wp_head()`. `react-host.php`
  hard-coded `<title>` removed. `og-image-default.png` placeholder (1200×630, 13 KB)
  ships in plugin assets. `ServiceSelector` category back button ("← All categories")
  shown when category filter is active. 3 Vitest + 15 PHP tests (598 Vitest, 119 PHP).
  Operational verification pending (OV-5.10a-1 through OV-5.10a-13).
- Step 5.10a-docs complete (June 24, 2026): SEO Adaptation Guide (Layer 1).
  New `docs/seo-adaptation-guide.md` provides practical, per-client usage
  documentation for the Layer 1 SEO infrastructure. Covers all 11 `goqw_seo_*`
  option keys, a 4-step per-client setup checklist (titles, descriptions, OG image,
  verification), common patterns, troubleshooting, and codebase reference. Cross-
  referenced from `onboarding.md` and `fork-procedure.md`. Documentation-only;
  all gates unchanged (598 Vitest, 119 PHP).
- Step 5.11 complete (June 26, 2026): LLM customization handoff document.
  New `docs/llm-customization-handoff.md` (~2000 lines) provides a complete,
  LLM-optimized instruction set for per-client content/SEO/wizard customization.
  An LLM agent with this document and a business profile JSON can perform all
  12 customization tasks autonomously: business identity WP options, social links,
  service availability, per-route SEO titles and descriptions, `site-content.ts`,
  `footer-content.ts`, `home-page-content.ts` (7 sections), `services-content.ts`
  - `work-content.ts`, webhook URL, OG image, and final state audit. Includes
    business profile JSON schema, modification map, report template, pre-deployment
    checklist, verification commands, and three appendices. Spec corrections applied
    from codebase read: `goqw_enabled_services` is comma-separated; correct webhook
    key is `goqw_webhook_url`; `site-content.ts` and `work-content.ts` added as
    customization targets omitted from the original spec. Documentation-only;
    all gates unchanged (598 Vitest, 143 PHP).
- Step 5.10b complete (June 25, 2026): SEO Layers 2-4. ADR-0023 amended.
  `LocalBusinessSchemaEmitter` (Layer 2) emits LocalBusiness JSON-LD with name,
  address (PostalAddress heuristic), phone, email, hours, sameAs social links.
  8 new `goqw_business_*` / `goqw_social_*` options seeded in Activator.
  `ServiceSchemaEmitter` (Layer 3) emits one Service JSON-LD block per active service
  (11 services, static PHP constant mirroring services-content.ts, filtered by
  `goqw_enabled_services`). `SitemapGenerator` (Layer 4) serves custom `/sitemap.xml`
  with all 5 React routes; disables WP core sitemap. `RobotsTxtCustomizer` (Layer 4)
  appends `Sitemap:` directive to `robots.txt`, respecting `blog_public` setting.
  24 new PHP tests (143 total). `docs/seo-adaptation-guide.md` extended with Layers 2-4
  usage instructions, options reference, and troubleshooting.
  Operational verification pending (OV-5.10b-1 through OV-5.10b-17).
- Step 5.13a complete (July 8, 2026): Wizard engine new step types. Three new
  step kinds added to the wizard engine and UI: `estimate-display` (computes and
  displays price mid-wizard; user continues forward or jumps back to adjust),
  `visual-card-selector` (image card grid, single or multi-select), and
  `size-bracket-selector` (preset bracket buttons with an exact-dimensions
  fallback). `AnyStep` discriminated union and `isFieldStep` type guard
  introduced in `wizard-config.ts`; all domain engine files updated to guard
  `.fields` access; three new React components added; ADR-0024 accepted.
  32 new Vitest tests (598→630, 51 test files). PHP and bundle unchanged.
- Step 5.13d complete (July 8, 2026): Optional details step added to all 7
  instant-quote services. Each service now ends with an `optional-details` step
  (allowSkip: true) after `contact-and-address`. Universal fields: `preferred_timeframe`
  (select) and `additional_notes` (textarea), all `required: false`. Per-service
  supplementary fields: fencing adds `gate_needed` + conditional `gate_width`; decking
  adds `existing_deck_removal`; painting adds `furniture_handling`, `pets`,
  `customer_supplies_paint`; patio adds `existing_patio_removal` + `slope_assessment`;
  driveway adds `existing_driveway_removal` + `parking_during_work`; steps adds
  `existing_steps_removal`; jetwash adds `specific_stains` + `time_preference`. Engine
  changes: `allowSkip: z.boolean().optional()` added to `StepSchema`; `NavigationControls`
  gains `onSkip?: () => void` prop rendering "Skip and Submit"; `StepRenderer` dispatches
  `SUBMIT_REQUESTED` on skip without triggering `showAllErrors`. Manual-quote services
  (general-repairs, plumbing, electrical, carpentry) do NOT receive this step — confirmed
  by regression tests. 30 new Vitest tests (674→704, 52 test files). PHP unchanged
  (148/148). ADR-0025 accepted.
- Step 5.13c complete (July 8, 2026): Photo upload + pre-step reduction.
  Pre-step (`addressPreStep`) reduced to postcode only; step id renamed to
  `postcode_prestep` (was `contact-and-address`) to avoid collision with new
  end-of-wizard step. All 7 instant-quote configs updated: old `contact` step
  removed, `site_photos` step added (optional, maxCount=5), and `contact-and-address`
  step added as final step with 4 required fields (name, phone, email, full_address).
  `contact_phone` now required; `full_address` is a new key. ADR-0022 amended.
  `docs/llm-customization-handoff.md` updated. 22 new Vitest tests (652→674, 51
  test files). PHP unchanged (148/148).
- Step 5.13b complete (July 8, 2026): All 7 instant-quote service wizard flows
  redesigned to use the new step types from 5.13a. New flow per service:
  size-bracket-selector → visual-card-selector (material/type) → estimate-display →
  contact → optional extras (jetwash has no extras step). Two infrastructure
  additions: `buildFieldKeyMap` and `collectFieldIds` extended to resolve
  `VisualCardSelectorStep.answerKey` and `SizeBracketSelectorStep` fields from the
  pricing/validation layer; `typicalValue: number` added to `SizeBracketSchema` so
  bracket selection auto-populates the pricing quantity field. 22 new Vitest tests
  (630→652). PHP unchanged (148/148). ADR-0024 amended with 5.13b details;
  `docs/llm-customization-handoff.md` gains Task 8b (Pricing Calibration) table.
- Step 5.12b complete (July 7, 2026): Template bug fixes. Three bugs surfaced during
  SCB pilot deployment triage and fixed in the template before SCB customization.
  (1) **REST output buffering:** `SubmissionController::handle()` body wrapped in
  `ob_start()` / `ob_end_clean()` via `try/finally` — PHP notices from
  `WP_DEBUG_DISPLAY=true` no longer corrupt the JSON response body. (2) **Activation
  rewrite flush:** `Activator::setup_site_routing()` now calls
  `SitemapGenerator::add_rewrite_rule()` directly before `flush_rewrite_rules()`.
  The sitemap rewrite was registered via `add_action('init')` which fires before the
  activation hook; `/sitemap.xml` previously returned 404 until a manual flush.
  (3) **Media validation data URL prefix:** `MediaValidator` strips `data:mime/type;base64,`
  prefix before decoding, accepting the format browsers produce when reading files via
  the FileReader API. 5 new PHP tests (143→148). 4 phase-0 audit docs. `onboarding.md`
  gains a debug logging section with the `WP_DEBUG_DISPLAY=false` recommendation.
  Commit 5 (docs webhook-option correction) skipped — all docs already used correct
  option key `goqw_webhook_url`. No JS changes; bundle and Vitest suite unchanged.
- Build pipeline corrected: `pnpm build` composes Vite build and plugin
  staging in one command.
- Fork-and-customize architecture demonstrated end-to-end.

The system is functionally complete for a single-client deployment. All React
routes are accessible via direct URL. Section CTAs use client-side navigation.
The remaining work is template completeness (footer, wizard service library,
SEO infrastructure, customization tooling), followed by SCB-specific deployment,
then production.

See `docs/roadmap.md` for the full sequence and `docs/product-vision.md` for
the medium-term product direction.

## What to read first if you're new

1. `docs/roadmap.md` — single-page project shape and status.
2. `docs/current-state.md` — what works right now.
3. `docs/technical-debt.md` — known deferred work with triggers.
4. `docs/onboarding.md` — how to develop, build, and deploy.
5. `docs/adaptation-runbook.md` — how to clone and adapt the template for a
   new client. Read this before Step 5.5.
6. `docs/make-com-integration.md` — how to configure Make.com to receive
   quote submissions from a deployed install. Read this alongside 5.5.
7. ADRs in `docs/decisions/` in numerical order — record of every architectural
   decision. Read 0014 first if you want to understand the product direction
   (template-clone repository, not multi-tenant SaaS, not operator-editing CMS).

## What to do first

If you are starting a new step:

1. Read this file. Read `current-state.md`. Read the most recent ADR amendment.
2. Run all gates locally and confirm they match what `current-state.md` claims.
   If they don't, that's a finding before you start any work.
3. If your step affects the WordPress-deployed system, run OV-001-style
   verification at the end. See the planning discipline in `technical-debt.md`.

## What NOT to do

- Do not add new architectural surface without explicit approval. The system
  is structurally complete for its target (b — reusable template repository).
- Do not begin a new development step until the prior step's verification is
  recorded in evidence and the documentation set (current-state, handoff,
  technical-debt, roadmap, relevant ADRs) reflects reality.
- Do not skip the deploy procedure in `onboarding.md`. The OV-001 episode (June 2026) demonstrated what happens when redeployment is improvised.

## Next candidate steps

The roadmap is sequenced explicitly. See `docs/roadmap.md` for full detail.

**Immediate next action:** Step 5.12 — SCB-specific deployment (first real client).
Template is now bug-fixed, engine-complete (5.12b + 5.13a), all 7 instant-quote service
flows use the new step kinds (5.13b), and photo upload + contact collection are
restructured for better UX (5.13c). Activate the plugin on a LocalWP SCB site, then
run `docs/llm-customization-handoff.md` against SCB's business profile to perform the
full content/SEO/services customization pass. Task 8b covers pricing calibration for
instant-quote services. Outstanding OVs (OV-5.10b, OV-5.10a, OV-5.9-R, etc.) can be
batched into the 5.12 deploy session and recorded in `docs/phase-5-evidence.md`.

Each step is sized small and verified before the next begins. See
`docs/roadmap.md` "Step rationale and dependencies" for why each step is
shaped the way it is.

## Core Architecture

### Layer boundaries (enforced by ESLint)

```
src/domain/**          Pure, React-free. No UI imports. Independently testable.
src/domain/registry/** Vertical registry. Pure lookup; no React.
src/runtime/**         React adapter. WizardStore, hooks, persistence, submission.
src/components/
  primitives/          Button, Input, Skeleton, etc. No composites/steps/screens.
  composites/          Stateless UI pieces. No steps/screens.
  steps/               Field renderers, StepRenderer. May import composites + runtime.
  screens/             Phase screens. May import primitives + composites.
  WizardShell.tsx      Phase switcher. Imports everything.
src/site/              Website shell + five reference pages. May NOT import
                       @/domain/runtime/** or @/domain/pricing/** directly.
src/App.tsx            Entry. One-line mount of <SiteApp />.
```

### Vertical registry

- `resolveVertical(wizardId): SessionConfig | null` — pure, deterministic, no I/O
- Fallback: `resolveFallbackVertical()` returns `'fencing'` entry
- `QuotePage`: resolves vertical via `listEnabledServiceIds` + `resolveService`
- Adding a vertical: new fixture in `src/domain/fixtures/` + one entry in `verticals.ts`

### State machine

- `transition(state, event, config): WizardState` — pure, total, no side effects
- `WizardStore` owns side effects: persistence, submission, auto-advance from `validating`
- Phases: `idle → answering → validating → submitting → submit_success | submit_failure`
- `validating` is instantaneous (auto-advanced by WizardStore immediately after entry)

### Submission pipeline

- `httpSubmissionPort`: appends `/submit` to `restUrl` namespace base (F5 fix, ADR-0015 amendment 2026-06-05)
- `devSubmissionPort`: fallback when `config.restUrl === ''`
- HTTP 200 → `SUBMIT_SUCCEEDED`; all other outcomes → `SUBMIT_FAILED`
- No internal retry: retry is a user-initiated FSM event (`SUBMIT_RETRY`)

## Core Constraints (unchanged)

- React-free pure domain layer in `src/domain/**`
- No side effects in `transition()`
- Zod-first schemas
- Integer pence arithmetic only (no floats for money)
- Deterministic pricing
- No arbitrary code evaluation
- Config-driven field registry
- Optimistic UI, no false success states
- All state serializable
- Fail-closed validation
- ADR-0012: flat UI, no gradients, no blur, no spinners (Skeleton only), no inline styles, no hex in components, no marketing language, no emoji
- PublicConfig v2 lockstep: PHP plugin and JS bundle must be upgraded together

## Key Files

| File                                      | Purpose                                                    |
| ----------------------------------------- | ---------------------------------------------------------- |
| `src/site/SiteApp.tsx`                    | Application root; pathname state + site shell              |
| `src/site/pages/QuotePage.tsx`            | Quote page; wizard selection + mount                       |
| `src/site/content/site-content.ts`        | Site-wide copy — edit for each client                      |
| `src/domain/registry/index.ts`            | Registry public surface                                    |
| `src/domain/registry/verticals.ts`        | VERTICALS map + FALLBACK_VERTICAL_ID                       |
| `src/domain/fixtures/fencing.config.ts`   | Canonical reference config (WizardConfig + PricingConfig)  |
| `src/domain/runtime/transition.ts`        | State machine transition function                          |
| `src/domain/pricing/pricing-engine.ts`    | Pure pricing computation                                   |
| `src/runtime/WizardStore.ts`              | Effect orchestration                                       |
| `src/runtime/http-submission-port.ts`     | Production submission adapter (appends /submit to restUrl) |
| `src/components/WizardShell.tsx`          | Phase → screen mapping                                     |
| `src/components/steps/field-registry.tsx` | Closed FieldType → renderer map                            |
| `src/config-loader.ts`                    | Reads window.GOQW_CONFIG; falls back to safe defaults      |
| `docs/decisions/`                         | All ADRs — read before making structural changes           |
