# Current State

_Last updated: 2026-07-22 (post Step 6.4)_

## What's working

- Wizard engine (FSM, validation, navigation, persistence).
- Pricing engine (computePrice, gate enforcement).
- Manual-quote routing: wizards with `quoteMode: 'manual'` bypass pricing and go directly to submission.
- Category navigation (optional): CategorySelector phase before service selection when `enableCategoryNavigation` is true.
- Submission pipeline end-to-end in WordPress (validate → persist → forward → respond).
- Site shell with 6 routes (Home, Services, Our Work, Contact, Quote, Privacy Policy).
- Service abstraction (fencing + decking verticals).
- Photo upload (multi-photo, browser compression, server-side validation). Photos are saved to the WordPress media library and forwarded as public URLs (`url` + `attachmentId`), not base64 — see Step 5.13e / ADR-0026.
- WordPress page mapping (single root page + rewrite rules + non-invasive front-page policy).
- SEO Layer 1: per-route titles, meta descriptions, canonical URLs, Open Graph tags, Twitter cards.
- SEO Layer 2: LocalBusiness JSON-LD schema (name, address, phone, email, hours, sameAs).
- SEO Layer 3: Service JSON-LD schema per active service (12 services, filterable by goqw_enabled_services; `other` omits the `category` field since it has none — Step 6.3).
- SEO Layer 4: custom `/sitemap.xml` (5 React routes); `robots.txt` Sitemap directive.
- LLM customization handoff document (`docs/llm-customization-handoff.md`): 12-task instruction set for per-client content, SEO, and wizard configuration.
- REST endpoint output buffering: PHP warnings from WP_DEBUG_DISPLAY no longer corrupt JSON responses.
- Plugin activation rewrite flush: `/sitemap.xml` now accessible immediately after activation without manual `wp rewrite flush`.
- Media validation: data URL prefix accepted, allowing browsers that prepend `data:image/jpeg;base64,` to succeed.
- Wizard engine step types: `estimate-display`, `visual-card-selector`, and `size-bracket-selector` steps added alongside classic field steps. `AnyStep` discriminated union and `isFieldStep` guard applied throughout the engine and UI.
- All 7 instant-quote service wizard configs redesigned to use the new step types (size-bracket → visual-card → estimate → contact flow). Pricing infrastructure extended to resolve `VisualCardSelectorStep.answerKey` and `SizeBracketSelectorStep` fields. `typicalValue` on `SizeBracket` auto-populates the quantity field for immediate pricing on bracket selection.
- Pre-step (addressPreStep) reduced to postcode only (id `postcode_prestep`). All 7 instant-quote service configs now end with a `site_photos` step (optional, maxCount=5) and a `contact-and-address` step collecting name, phone (required), email, and full_address. Old lightweight `contact` step removed.
- Optional details step added to all 7 instant-quote services as the final step after `contact-and-address`. Universal fields: `preferred_timeframe` (select, required:false) and `additional_notes` (textarea, required:false). Per-service supplementary fields capture gate details (fencing), removal/condition context (decking, patio, driveway, steps), furniture/pets/paint preferences (painting), and stain type + time preference (jetwash). `allowSkip: true` enables "Skip and Submit" — users bypass the step entirely. Manual-quote services do not receive this step.
- Photo URL storage (Step 5.13e): `Submissions\PhotoStorage` saves validated photos to `/wp-content/uploads/goqw/YEAR/MONTH/` via `wp_handle_upload`/`wp_insert_attachment`, tags each attachment with `_goqw_photo` post meta, and returns a public URL + attachment ID. `SubmissionController` replaces `dataBase64` with `url`/`attachmentId` in both the persisted `answers_json`/`media_json` and the Make.com webhook payload before persistence. A per-photo failure drops that photo and logs it but never blocks the submission; a submission that fails to persist after photos were saved triggers orphan cleanup (deletes those attachments). `Cron\PhotoRetention` deletes photos older than 6 months via a new daily `goqw_photo_retention_cleanup` wp-cron event. ADR-0026.
- Bot & spam protection (Step 5.13f): three-layer defense on the submit endpoint, enabled by default. `Rest\BotProtection` runs honeypot (`honeypotValue` field, rejected as an ordinary `validation_failed`), rate limiting (`Rest\RateLimiter`, WordPress transients, 5/hour default via `goqw_rate_limit_per_hour`), then Cloudflare Turnstile verification (`Support\TurnstileClient`, only when `goqw_turnstile_site_key`/`goqw_turnstile_secret_key` are both configured). `PublicConfig` exposes `turnstileSiteKey` (public by design); the secret key never leaves `Settings::turnstile_secret_key()`. On the frontend, `BotProtectionStore` + `createBotProtectionEnrichedPort` mirror the Step 4.8 photo-enrichment pattern; `HoneypotField` mounts once per wizard session in `WizardShell`; `TurnstileWidget` mounts only on the final step and dynamically loads Cloudflare's SDK (not bundled) only when configured. `goqw_bot_protection_enabled` (default on) disables all three layers at once. ADR-0027.
- Duplicate submission prevention (Step 5.13g): `Submissions\DuplicateDetector` flags a submission as a duplicate when its normalized `contact_email` or `contact_phone` matches a non-duplicate submission from the last 24 hours. A duplicate is still fully persisted (photos included) but marked `is_duplicate`/`duplicate_of` and never forwarded to Make.com/WhatsApp — the response is still `200 { reference, isDuplicate: true }`. `SuccessScreen` renders different, client-owned copy for a duplicate. ADR-0028.
- Data protection & UK GDPR compliance (Step 5.14): a required `data_processing_consent` checkbox field on the last mandatory step of every one of the 11 wizard configs; `Submissions\ConsentValidator` enforces it server-side (`400 consent_required` if missing, nothing persisted); accepted submissions gain `consent_given`/`consent_timestamp` columns. New `/privacy` route (sixth site route) renders a real UK GDPR privacy policy from `site/content/privacy-content.ts`, closing a pre-existing dangling footer link. `Cron\PruneSubmissions` — scheduled since Step 3D but never implemented — now deletes submissions older than `Settings::retention_days()` (default 90 days) and is finally hooked in `Plugin::boot()`; photo retention (`PhotoRetention`, 6 months) is unchanged and independent. ADR-0029.
- Environmental robustness & namespace prefixes (Step 5.14.1): `Submissions\PhotoStorage` now loads its wp-admin includes (`ensure_upload_functions_loaded()`) as the first statement in `store_photo()`, before `wp_tempnam()` can be reached — fixes an SCB-pilot photo-upload failure caused by the require running too late. Every WordPress core function call in namespaced plugin PHP (33 files) is now backslash-prefixed (ADR-0030). The client's `httpSubmissionPort` handles HTTP 429 as a distinct `rate_limited` error code with a "Please try again in N minute(s)" message instead of falling through to a generic server error. `docs/onboarding.md` gained LocalWP DB_HOST and PHP OpCache guidance.
- Photo upload extension/MIME consistency (Step 5.14.2): browser-side compression (`image-compression.ts`) always re-encodes to JPEG, but the wizard was submitting the pre-compression filename (e.g. `holiday.png`) alongside the correct `image/jpeg` MIME claim — WordPress's `wp_handle_upload()` rejects that mismatch via `wp_check_filetype_and_ext()`. Fixed client-side (`correctedJpegFileName()` in `image-compression.ts`, consumed via a new `buildPhotoMetadata()` helper in `domain/runtime/photos.ts`) and server-side (`Submissions\PhotoStorage::correct_filename_extension()`, a `MIME_TO_EXTENSION` map applied before `wp_handle_upload()` runs, independent of client behavior). ADR-0031.
- Photo upload via wp_handle_sideload (Step 5.14.3): `wp_handle_upload()` requires `is_uploaded_file()` to return true, which is always false for a photo `PhotoStorage` decoded and wrote to a temp file itself — every photo submission on every deployment failed with "Specified file failed upload test." Swapped to `wp_handle_sideload()` (uses `is_readable()` instead) with an explicit `mimes` allowlist (jpg/jpeg/jpe, png, webp, gif) matching `MediaValidator`'s own. `docs/onboarding.md` gained `WP_TEMP_DIR` (LocalWP) and local-URL/Google-Sheets-IMAGE() guidance. ADR-0032.
- Wizard UX improvements (Step 6.1): fencing's duplicate gate question (`gate_needed`/`gate_width` in `optional-details`, never wired to pricing) removed — `include_gate` in `extras` (wired to `fencingPricingConfig`) is now the single gate question. New `apps/wizard/src/utils/units.ts` (`metersToFeet`, `squareMetersToSquareFeet`, `formatMeasurementWithFeet`, `formatMeasurementRangeWithFeet`) converts metric measurements to feet/square-feet — dispatched on the `m`/`m²` unit string so area values get the correct ×10.7639 factor, not the linear ×3.28084 one. `SizeBracketSelectorStep.tsx` renders bracket ranges and the live exact-dimension value through these helpers, so fencing, decking, patio, driveway (and incidentally jetwash/garden-steps) all show feet equivalents from one shared fix; fencing's static fence-height labels were edited directly. `site_photos` field `help` text on the four in-scope wizards replaced with landscaping-quote photo guidance (full-length shots, obstacles, problem areas, boundary connection), replacing a redundant format-constraint restatement. ADR-0033.
- Fencing mandatory post-estimate questions (Step 6.2): new classic field step `fencing-details` inserted between `extras` and `site_photos` (after `estimate-display`, before photos) — three required `radio` fields: `terrain` (soft/hard/concrete), `post_material` (concrete/timber), `gravel_boards` (yes/no). No new step kind (the spec's assumed `multi-field-form` type doesn't exist; the classic `Step`/`fields[]` type already covers this) and no schema change for per-option helper text (`FieldSchema` has no such field) — per-option nuance is folded into option labels, `gravel_boards`' explanation uses the existing field-level `help` string. Pure metadata, no pricing wiring; `WizardStore.buildRequest()` already spreads the full answers map unfiltered into the submission payload. Fencing-only change. ADR-0034.
- "Other" service category (Step 6.3): 12th vertical, `other.config.ts`, registered last in `domain/registry/verticals.ts`'s `VERTICALS` object literal — the only ordering mechanism that exists (no explicit position field). Follows the exact uniform manual-quote structure the other four manual-quote services share (ADR-0021 Decision 3: `description → urgency → property → site_photos → contact_preference → contact → address`), not the illustrative postcode-first/optional-details flow initially assumed — postcode is actually injected engine-side by `QuotePage.tsx` ahead of every wizard, and no manual-quote service has an optional-details step. Deliberately kept the standard `description`/`work_description` field naming (not a new `project_description` id) so "other" plugs into the existing shared parametrized test suites (`manual-quote-configs.test.ts`, `consent-field.test.ts`) as a fifth manual-quote service with zero special-casing. Deliberately uncategorized (no `categoryId`) — none of the four existing categories fit a long-tail catch-all. Enabled by default automatically (no WordPress admin toggle needed) since `listEnabledServiceIds()`'s no-override case returns every registered vertical. ADR-0035.
- Service customization guide (Step 6.4): new `docs/service-customization-guide.md` — comprehensive, LLM-followable reference for adding/removing/modifying services, adjusting pricing, updating metadata, managing categories, and toggling quote modes, with worked examples and explicit sync-obligation checklists. Corrects several assumptions that don't match the real codebase: there is no per-service pricing function (one shared `computePrice()` engine evaluates declarative `PricingConfig` data, never per-service code); `categories.ts` is the sole category source, with actual category assignment living in `verticals.ts`'s `categoryId` (not `ServiceSchemaEmitter.php`, which only mirrors it for SEO); manual-quote services get near-free test coverage via two shared parametrized suites, while instant-quote services need a bespoke test file each. Also resolved a real scope conflict discovered while cross-referencing `llm-customization-handoff.md`: that document's Rule 1 explicitly forbids the per-client customization LLM from touching `domain/`, PHP, or tests — exactly what the new guide covers — so the new guide is scoped as a separate, broader engineering task, not an extension of the narrower per-client customization pass. Documentation-only: 0 new tests (820/820 unchanged), PHP unchanged (250/250), bundle byte-identical. ADR-0036.

## Gate state (last verified)

- `pnpm lint`: 0/0
- `pnpm typecheck`: 0 errors (pre-existing, unrelated `tsconfig.test.json` type errors in `non-field-step-engine.test.ts` predate this step — last touched in the 5.13a/5.13b commits)
- `pnpm test`: **820/820** (62 test files, unchanged from 6.3 — documentation-only step, no code changes)
- `pnpm build`: clean (bundle 90.76 kB gzip, byte-identical to 6.3's corrected measurement — see phase-6-evidence.md)
- `composer test`: **250 passed, 4 skipped** (unchanged — no PHP changes this step)
- `composer analyse`: clean (PHPStan level 8, no errors)
- `composer lint`: 0/0 for all files touched this step (pre-existing, unrelated drift in `quote-wizard.php` predates 5.13e/5.13f/5.13g/5.14/5.14.1/5.14.2/5.14.3)

## Gate state (6.3, 2026-07-22)

- `pnpm lint`: 0/0
- `pnpm typecheck`: 0 errors (pre-existing, unrelated `tsconfig.test.json` type errors in `non-field-step-engine.test.ts` predate this step — last touched in the 5.13a/5.13b commits)
- `pnpm test`: **820/820** (62 test files, +17 from 6.2)
- `pnpm build`: clean (bundle 90.76 kB gzip, +0.32 kB vs. 6.2's 90.44 kB — corrected in 6.4; the 90.66 kB figure first recorded mid-step was measured before the final services-content.ts addition)
- `composer test`: **250 passed, 4 skipped** (+1 from 6.2 — `ServiceSchemaEmitter` "other" category-omission test, per its documented sync-discipline contract with the JS registry)
- `composer analyse`: clean (PHPStan level 8, no errors)
- `composer lint`: 0/0 for all files touched this step (pre-existing, unrelated drift in `quote-wizard.php` predates 5.13e/5.13f/5.13g/5.14/5.14.1/5.14.2/5.14.3)

## Gate state (6.2, 2026-07-22)

- `pnpm lint`: 0/0
- `pnpm typecheck`: 0 errors (pre-existing, unrelated `tsconfig.test.json` type errors in `non-field-step-engine.test.ts` predate this step — last touched in the 5.13a/5.13b commits)
- `pnpm test`: **803/803** (60 test files, +12 from 6.1)
- `pnpm build`: clean (bundle 90.44 kB gzip, +0.32 kB vs. 6.1's 90.12 kB)
- `composer test`: **249 passed, 4 skipped** (unchanged — no PHP changes this step)
- `composer analyse`: clean (PHPStan level 8, no errors)
- `composer lint`: 0/0 for all files touched this step (pre-existing, unrelated drift in `quote-wizard.php` predates 5.13e/5.13f/5.13g/5.14/5.14.1/5.14.2/5.14.3)

## Gate state (6.1, 2026-07-22)

- `pnpm lint`: 0/0
- `pnpm typecheck`: 0 errors (pre-existing, unrelated `tsconfig.test.json` type errors in `non-field-step-engine.test.ts` predate this step — last touched in the 5.13a/5.13b commits)
- `pnpm test`: **791/791** (58 test files, +19 from 5.14.3)
- `pnpm build`: clean (bundle 90.12 kB gzip, +0.33 kB vs. 5.14.1's last-measured 89.79 kB)
- `composer test`: **249 passed, 4 skipped** (unchanged — no PHP changes this step)
- `composer analyse`: clean (PHPStan level 8, no errors)
- `composer lint`: 0/0 for all files touched this step (pre-existing, unrelated drift in `quote-wizard.php` predates 5.13e/5.13f/5.13g/5.14/5.14.1/5.14.2/5.14.3)

## Gate state (5.14.3, 2026-07-17)

- `pnpm lint`: 0/0
- `pnpm typecheck`: 0 errors (pre-existing, unrelated `tsconfig.test.json` type errors in `non-field-step-engine.test.ts` predate this step — last touched in the 5.13a/5.13b commits)
- `pnpm test`: **772/772** (59 test files, unchanged from 5.14.2 — no JS/TS changes this step)
- `pnpm build`: clean (bundle unchanged)
- `composer test`: **249 passed, 4 skipped** (+2 from 5.14.2)
- `composer analyse`: clean (PHPStan level 8, no errors)
- `composer lint`: 0/0 for all files touched this step (pre-existing, unrelated drift in `quote-wizard.php` predates 5.13e/5.13f/5.13g/5.14/5.14.1/5.14.2/5.14.3)

## Gate state (5.14.2, 2026-07-17)

- `pnpm lint`: 0/0
- `pnpm typecheck`: 0 errors (pre-existing, unrelated `tsconfig.test.json` type errors in `non-field-step-engine.test.ts` predate this step — last touched in the 5.13a/5.13b commits)
- `pnpm test`: **772/772** (59 test files, +9 from 5.14.1)
- `pnpm build`: clean (bundle unchanged in practice)
- `composer test`: **247 passed, 4 skipped** (+5 from 5.14.1)
- `composer analyse`: clean (PHPStan level 8, no errors)
- `composer lint`: 0/0 for all files touched this step (pre-existing, unrelated drift in `quote-wizard.php` predates 5.13e/5.13f/5.13g/5.14/5.14.1/5.14.2)

## Gate state (5.14.1, 2026-07-17)

- `pnpm lint`: 0/0
- `pnpm typecheck`: 0 errors (pre-existing, unrelated `tsconfig.test.json` type errors in `non-field-step-engine.test.ts` predate this step — last touched in the 5.13a/5.13b commits)
- `pnpm test`: **763/763** (56 test files, +4 from 5.14)
- `pnpm build`: clean (bundle 89.79 kB gzip, +0.14 kB from 5.14)
- `composer test`: **242 passed, 4 skipped** (+9 from 5.14)
- `composer analyse`: clean (PHPStan level 8, no errors)
- `composer lint`: 0/0 for all files touched this step (pre-existing, unrelated drift in `quote-wizard.php` predates 5.13e/5.13f/5.13g/5.14/5.14.1)

## Gate state (5.14, 2026-07-14)

- `pnpm lint`: 0/0
- `pnpm typecheck`: 0 errors (pre-existing, unrelated `tsconfig.test.json` type errors in `non-field-step-engine.test.ts` predate this step — last touched in the 5.13a/5.13b commits)
- `pnpm test`: **759/759** (56 test files, +38 from 5.13g)
- `pnpm build`: clean (bundle 89.65 kB gzip, +~1.6 kB from 5.13g)
- `composer test`: **233 passed, 4 skipped** (+13 from 5.13g)
- `composer analyse`: clean (PHPStan level 8, no errors)
- `composer lint`: 0/0 for all files touched this step (pre-existing, unrelated drift in `quote-wizard.php` predates 5.13e/5.13f/5.13g/5.14)

## Gate state (5.14, 2026-07-14)

- `pnpm lint`: 0/0
- `pnpm typecheck`: 0 errors (see pre-existing note above)
- `pnpm test`: **759/759 Vitest** (+38 from 5.13g, 56 test files)
- `pnpm build`: clean (bundle 88.09 → 89.65 kB gzip)
- `composer lint`: 0/0 for files touched this step
- `composer analyse`: no errors (PHPStan level 8)
- `composer test`: **233 passed, 4 skipped** (+13 from 5.13g — ConsentValidator 6, PruneSubmissions 3, SubmissionController 4)

## Gate state (5.13g, 2026-07-14)

- `pnpm lint`: 0/0
- `pnpm typecheck`: 0 errors (see pre-existing note above)
- `pnpm test`: **721/721 Vitest** (+4 from 5.13g, 54 test files)
- `pnpm build`: clean (bundle 87.96 → 88.09 kB gzip)
- `composer lint`: 0/0 for files touched this step
- `composer analyse`: no errors (PHPStan level 8)
- `composer test`: **220 passed, 4 skipped** (+10 from 5.13g — DuplicateDetector 7, SubmissionController 3)

## Gate state (5.13f, 2026-07-13)

- `pnpm lint`: 0/0
- `pnpm typecheck`: 0 errors (see pre-existing note above)
- `pnpm test`: **717/717 Vitest** (+13 from 5.13f, 54 test files)
- `pnpm build`: clean (bundle 87.20 → 87.96 kB gzip)
- `composer lint`: 0/0 for files touched this step
- `composer analyse`: no errors (PHPStan level 8)
- `composer test`: **210 passed, 4 skipped** (+38 from 5.13f, across new RateLimiter/TurnstileClient/BotProtection/ClientIp suites plus Settings/SubmissionController/PublicConfig additions)

## Gate state (5.13e, 2026-07-13)

- `pnpm lint`: 0/0 (no JS changes)
- `pnpm typecheck`: 0 errors (no TS changes)
- `pnpm test`: 704/704 Vitest (unchanged)
- `pnpm build`: clean (unchanged)
- `composer lint`: 0/0
- `composer analyse`: no errors (PHPStan level 8)
- `composer test`: **172 passed, 4 skipped** (+24 from 5.13e — PhotoStorage 11, SubmissionController 8, PhotoRetention 6, minus 1 obsolete test removed for the `wp_insert_attachment` wp_error contract fix — net +24)

## Gate state (5.13d, 2026-07-08)

- `pnpm lint`: 0/0
- `pnpm typecheck`: 0 errors
- `pnpm test`: **704/704 Vitest** (+30 from 5.13d, 52 test files)
- `pnpm build`: clean (no bundle size change — allowSkip adds negligible weight)
- `composer lint`: 0/0 (no PHP changes)
- `composer analyse`: no errors (no PHP changes)
- `composer test`: **148 passed, 4 skipped** (PHP unchanged)

## Gate state (5.13c, 2026-07-08)

- `pnpm lint`: 0/0
- `pnpm typecheck`: 0 errors
- `pnpm test`: **674/674 Vitest** (+22 from 5.13c, 51 test files)
- `pnpm build`: clean (no bundle size change — no new components)
- `composer lint`: 0/0 (no PHP changes)
- `composer analyse`: no errors (no PHP changes)
- `composer test`: **148 passed, 4 skipped** (PHP unchanged)

## Gate state (5.13b, 2026-07-08)

- `pnpm lint`: 0/0
- `pnpm typecheck`: 0 errors
- `pnpm test`: **652/652 Vitest** (+22 from 5.13b, 51 test files)
- `pnpm build`: clean (no bundle size change — no new components)
- `composer lint`: 0/0 (no PHP changes)
- `composer analyse`: no errors (no PHP changes)
- `composer test`: **148 passed, 4 skipped** (PHP unchanged)

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
- Idempotency for submission retry (deferred; trigger: first observed duplicate) — Step 5.13g.
- Admin replay UI for failed forwards (deferred; trigger: ops team need).
- Second client deployment (Step 6 candidate; trigger: business decision).

## Critical context

- The plugin is a template, not a feature plugin. It assumes the WordPress
  install is clean (no conflicting existing content at `/services`, `/contact`,
  etc., and either no front page configured or Sample Page only).
- Every step from this point forward includes operational verification, not
  just code gates. See planning discipline addition in `docs/technical-debt.md`.

## Completed Steps

- **Step 6.4 — Service Customization Guide** (July 2026). ADR-0036
  accepted. New `docs/service-customization-guide.md` (~1100 lines): a
  comprehensive, LLM-followable reference for adding/removing/modifying
  services, adjusting pricing, updating metadata, managing categories,
  and toggling quote modes, organized by operation with worked examples,
  explicit sync-obligation checklists, and per-operation testing
  guidance. Four Phase 0 audits (sync obligations, pricing patterns,
  categories, shared test patterns) verified every factual claim against
  the current source rather than trusting the planning spec's
  assumptions — several of which didn't match reality (no per-service
  pricing function; no second category-enumeration file; no
  `multi-field-form` step type; `ServiceSchemaEmitter.php`'s `category`
  field mirrors but doesn't assign categories). Also resolved a real
  scope conflict with `llm-customization-handoff.md`'s Rule 1, which
  forbids the per-client customization LLM from touching exactly the
  files the new guide covers — clarified as two separate tasks rather
  than silently contradicting the existing rule. Documentation-only: 0
  new tests (820/820 unchanged), PHP unchanged (250/250), bundle
  byte-identical (90.76 kB gzip).
- **Step 6.3 — "Other" Service Category** (July 2026). ADR-0035 accepted.
  New `other.config.ts`, a 12th vertical registered last in
  `domain/registry/verticals.ts` (the only ordering mechanism — no
  explicit position field exists). Follows the exact uniform
  manual-quote structure the other four manual-quote services share
  rather than the spec's assumed postcode-first/optional-details flow —
  postcode is engine-injected ahead of every wizard by `QuotePage.tsx`,
  and no manual-quote service has an optional-details step. Kept the
  standard `description`/`work_description` naming (not a new
  `project_description` id) so "other" plugs into the existing shared
  parametrized test suites (`manual-quote-configs.test.ts`,
  `consent-field.test.ts`) as a fifth manual-quote service with zero
  special-casing. Deliberately uncategorized (no `categoryId`); enabled
  by default with no WordPress admin toggle needed. 17 new Vitest tests
  (803→820), plus 5 files with hardcoded "11 services" counts/lists
  updated to 12. `ServiceSchemaEmitter.php` (PHP, SEO Layer 3) also
  gained an "other" entry (`category` made optional, omitted for
  services with none) per its own documented same-commit sync-discipline
  contract with the JS registry — 1 new PHP test (249→250). No other
  wizard touched.
- **Step 6.2 — Fencing Mandatory Post-Estimate Questions** (July 2026).
  ADR-0034 accepted. New `fencing-details` classic field step inserted
  between `extras` and `site_photos` in `fencing.config.ts`: three
  required `radio` fields (`terrain`, `post_material`, `gravel_boards`),
  pure metadata with no pricing impact. No new step kind or schema
  addition — per-option nuance folded into option labels, since
  `FieldSchema` has no per-option helper-text field. 12 new Vitest tests
  (791→803), plus 8 hardcoded step-index fixes in
  `domain/__tests__/validation.test.ts` (contact-and-address shifted from
  index 6 to 7). PHP unchanged (249/249). Fencing-only; no other wizard
  touched.
- **Step 6.1 — Wizard UX Improvements** (July 2026). ADR-0033 accepted.
  Removed fencing's duplicate, price-unwired gate question from
  `optional-details` (kept the price-wired `include_gate` in `extras`).
  Added feet/square-feet equivalents to metric measurements — new
  `apps/wizard/src/utils/units.ts` correctly distinguishes linear (`m`,
  ×3.28084) from area (`m²`, ×3.28084²) conversions, wired into the shared
  `SizeBracketSelectorStep.tsx` so fencing/decking/patio/driveway all
  benefit from one fix. Replaced the `site_photos` field's redundant
  format-restatement help text with landscaping-quote photo guidance on
  those same four wizards. 20 new Vitest tests (772→791, +19 net). PHP
  unchanged (249/249).
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
- **Step 5.14.3 — wp_handle_upload → wp_handle_sideload** (July 2026).
  ADR-0032 accepted. The real production bug behind every SCB pilot photo-upload
  failure: `wp_handle_upload()` requires `is_uploaded_file()` to return `true`,
  which is always `false` for a photo `Submissions\PhotoStorage` decoded from base64
  and wrote to a temp file itself (never an HTTP `$_FILES` upload) — every photo
  submission, on every deployment, was rejected with "Specified file failed upload
  test." Swapped to `wp_handle_sideload()`, the WordPress API for programmatic file
  handling (uses `is_readable()` instead), with an explicit `mimes` allowlist
  (jpg/jpeg/jpe, png, webp, gif) matching `MediaValidator`'s own — independent of any
  theme/plugin-registered `upload_mimes` filter. `docs/onboarding.md` gained a
  `WP_TEMP_DIR` (LocalWP) configuration section and a note explaining why
  locally-hosted photo URLs don't render via Google Sheets' `IMAGE()` formula. No
  `[goqw-debug]` logging existed to remove (the spec's cleanup instructions were a
  no-op for this codebase). 2 new PHP tests (247→249); no JS/TS changes.
- **Step 5.14.2 — Photo Upload Extension/MIME Consistency** (July 2026).
  ADR-0031 accepted. Browser-side compression (`image-compression.ts`) always
  re-encodes selected photos to JPEG, but `PhotoField.tsx` was submitting each
  photo's pre-compression filename (e.g. `holiday.png`) alongside the correct
  `image/jpeg` MIME claim — WordPress's `wp_handle_upload()` rejects that
  filename/MIME mismatch via `wp_check_filetype_and_ext()`, a real-WordPress-only
  failure this project's mocked test suite could never catch. Defense-in-depth fix:
  client-side, `compressImage()` returns a new `correctedFileName` field via the
  extracted pure `correctedJpegFileName()` helper, consumed by a new
  `buildPhotoMetadata()` helper in `domain/runtime/photos.ts` that `PhotoField.tsx`
  now calls instead of building `PhotoMetadata` inline; server-side,
  `Submissions\PhotoStorage` gains a `MIME_TO_EXTENSION` map and
  `correct_filename_extension()`, applied before `wp_handle_upload()` runs,
  independent of what the client sends. 5 new PHP tests (242→247), 9 new Vitest
  tests (763→772).
- **Step 5.14.1 — Environmental Robustness + Namespace Prefixes** (July 2026).
  ADR-0030 accepted. Fixes discovered during SCB pilot testing, not new features.
  `Submissions\PhotoStorage::store_photo()` called `wp_tempnam()` before its
  wp-admin/includes require had run (`ensure_upload_functions_loaded()` ran too late)
  — the require now runs first, unconditionally. Every WordPress core function call in
  namespaced plugin PHP (33 files, 208 call sites) is now backslash-prefixed, per
  `AUDIT-5.14.1-admin-includes.md`; `SitemapGenerator::add_rewrite_rule()`, the class's
  own static method, is deliberately excluded. `httpSubmissionPort.mapResponse()`
  gained a 429 branch: a `'rate_limited'` `SubmissionErrorCode` with a
  "Please try again in N minute(s)" message built from the server's
  `retryAfterSeconds`, `retryable: false`; `FailureScreen` shows "Please wait a
  moment" instead of "Something went wrong" for this code — previously a 429 fell
  through to the generic `server_error` path and discarded the wait-time entirely.
  `docs/onboarding.md` gained LocalWP MySQL port (`DB_HOST`) and PHP OpCache
  troubleshooting sections. 9 new PHP tests (233→242), 4 new Vitest tests (759→763).
- **Step 5.14 — Data Protection & UK GDPR Compliance** (July 2026).
  A required `data_processing_consent` checkbox (single option `agreed`) on the last
  mandatory step of every one of the 11 wizard configs — `contact-and-address` for
  instant-quote services, `address` for manual-quote services, never on the skippable
  `optional-details` step. `Submissions\ConsentValidator` is the real trust boundary:
  `SubmissionController` rejects a missing/invalid consent answer with
  `400 { errorCode: 'consent_required' }` before anything is persisted; an accepted
  submission gets `consent_given`/`consent_timestamp` columns (dbDelta, matching
  `is_duplicate`/`duplicate_of`'s precedent) alongside the existing duplicate-detection
  fields. A new `/privacy` route — registered the same way as every other marketing
  route (`SiteRoutes::PATHS`/`routes.ts`, kept in sync by `CrossLanguageRoutesTest`) —
  renders a real 10-section UK GDPR privacy policy from a new `privacy-content.ts`,
  closing a `footer-content.ts` link that had pointed nowhere since before this step.
  `Cron\PruneSubmissions`, scheduled since Step 3D but never implemented, now deletes
  submissions older than `Settings::retention_days()` (already-existing option, default
  90 days) and is hooked in `Plugin::boot()` for the first time; photo retention
  (`PhotoRetention`, independent, 6 months) is untouched. 13 new PHP tests (220→233), 38
  new Vitest tests (721→759). ADR-0029 accepted.
- **Step 5.13g — Duplicate Submission Prevention** (July 2026).
  `Submissions\DuplicateDetector` normalizes `contact_email` (lowercase+trim) and
  `contact_phone` (digits-only) and checks `SubmissionRepository::find_recent_by_contact()`
  for a non-duplicate submission matching either within the last 24 hours (UTC-computed
  window). `SubmissionController` runs this right after shape validation (Step 1a); a
  duplicate is still fully persisted (photos included), flagged `is_duplicate`/
  `duplicate_of`, and responds `200 { reference, isDuplicate: true }` — `Forwarder` is
  never called, so no WhatsApp/Sheets noise. Schema gains `is_duplicate`, `duplicate_of`,
  and `idx_duplicate_lookup` via the existing `dbDelta` mechanism, not a new migration
  path. Frontend: `isDuplicate` threads through `SubmissionPortResult` →
  `SubmitSucceededEvent` → `SubmissionResult` → `SuccessScreen`, which renders its own
  "We already have your request" copy — the server never echoes prose to the client. 10
  new PHP tests (210→220), 4 new Vitest tests (717→721). ADR-0028 accepted.
- **Step 5.13f — Bot & Spam Protection** (July 2026).
  Three-layer defense on the submit endpoint, enabled by default: honeypot field
  (`honeypotValue`, rejected as an ordinary `validation_failed`/400 so a bot can't tell
  it was caught), rate limiting (`Rest\RateLimiter`, WordPress transients, 5/hour default),
  and optional Cloudflare Turnstile verification (`Support\TurnstileClient`, only runs
  when both `goqw_turnstile_site_key`/`goqw_turnstile_secret_key` are configured).
  `Rest\BotProtection` runs all three (cheapest first) in `SubmissionController` before
  shape validation. `Settings` gains the four bot-protection getters instead of a new
  `BotProtectionConfig` class. `PublicConfig` exposes `turnstileSiteKey` (public by
  Cloudflare's design); the secret key never leaves `Settings::turnstile_secret_key()`.
  Frontend: `BotProtectionStore` + `createBotProtectionEnrichedPort` mirror the Step 4.8
  photo-enrichment pattern exactly (volatile, never persisted — a Turnstile token is
  single-use and expires in ~5 minutes). `HoneypotField` mounts once per wizard session
  in `WizardShell` (not `StepRenderer`, which remounts on every step change).
  `TurnstileWidget` mounts only on the final step and dynamically loads Cloudflare's SDK
  from CDN — not bundled — only when configured; bundle grew ~0.8 kB gzip (87.20→87.96 kB).
  Submit is disabled on the final step until a token is issued, only when Turnstile is
  configured. Resolves the "Rate limiting on submit endpoint" item deferred since Step
  4.6. 38 new PHP tests (172→210), 13 new Vitest tests (704→717). ADR-0027 accepted.
- **Step 5.13e — Photo URL Storage** (July 2026).
  `Submissions\PhotoStorage` saves validated submission photos to the WordPress media
  library (`/wp-content/uploads/goqw/YEAR/MONTH/` via a scoped `upload_dir` filter),
  tags each attachment with `_goqw_photo` post meta, and returns a public URL +
  attachment ID. `SubmissionController` runs this after `MediaValidator` and before
  persistence, mutating the answers so both `answers_json` and `media_json` — and
  consequently both the `answers` and `media` keys in the Make.com webhook payload —
  carry the URL instead of base64 (previously both columns/keys duplicated the same
  raw base64, per `AUDIT-5.13e-photo-handling.md`). A per-photo storage failure drops
  that photo and logs it but never blocks the submission (D5); if the submission then
  fails to persist, any attachments already created are deleted since the row that
  would reference them never existed (D6). New `Cron\PhotoRetention` deletes photos
  older than 6 months via a daily `goqw_photo_retention_cleanup` wp-cron event
  (`Activator` schedules it, `Plugin::boot()` hooks it, `Deactivator` clears it) — a
  real implementation, unlike the still-stubbed `Cron\PruneSubmissions`. Resolves the
  "Media retention policy" item deferred since Step 4.8. 24 new PHP tests (148→172).
  PHP unchanged elsewhere; no JS/bundle changes. ADR-0026 accepted.
- **Step 5.13d — Optional Details Step** (July 2026).
  `optional-details` step added as the final step in all 7 instant-quote service
  configs. New `allowSkip: boolean` flag on `StepSchema` enables "Skip and Submit"
  button — dispatches `SUBMIT_REQUESTED` without showing validation errors. Universal
  fields: `preferred_timeframe` (select) and `additional_notes` (textarea). Per-service
  supplementary fields cover gate details (fencing), deck/patio/driveway/steps removal
  (decking, patio, driveway, steps), furniture/pets/paint (painting), and stains +
  appointment preference (jetwash). Manual-quote services excluded — regression tests
  confirm no `optional-details` step present. 30 new Vitest tests (674→704, 52 test
  files). PHP unchanged (148/148). ADR-0025 accepted.
- **Step 5.13c — Photo Upload + Pre-Step Reduction** (July 2026).
  Pre-step (`addressPreStep`) reduced from 4 fields to postcode-only; id renamed
  from `contact-and-address` to `postcode_prestep` to avoid collision with the new
  end-of-wizard step. All 7 instant-quote service configs updated: old lightweight
  `contact` step removed; `site_photos` step added (type:photo, required:false, maxCount:5);
  new `contact-and-address` step added as final step with 4 required fields (name, phone,
  email, full_address). `contact_phone` is now required. `full_address` is a new key not
  in FORMAT_VALIDATORS. ADR-0022 amended; `docs/llm-customization-handoff.md` updated
  with codebase state and wizard flow note. 22 new Vitest tests (652→674). PHP unchanged.
- **Step 5.13b — All 7 Instant-Quote Service Wizard Flows Redesigned** (July 2026).
  All instant-quote configs (fencing, decking, painting, patio, driveway, steps,
  jetwash) updated to use new step types from 5.13a. New flow per service:
  size-bracket-selector → visual-card-selector (material/type) → estimate-display →
  contact. Two infrastructure additions: `buildFieldKeyMap`/`collectFieldIds` extended
  to resolve VisualCard/SizeBracket answer keys; `typicalValue` field on SizeBracket
  bridges bracket selection to the quantity field used by the pricing engine.
  22 new Vitest tests (630→652). PHP unchanged (148/148).
  ADR-0024 amended; `docs/llm-customization-handoff.md` gains Task 8b (Pricing Calibration).
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
| `Routing\SiteRoutes`       | PHP copy of the 6 recognized paths; `normalize()`, `is_recognized()`, `is_current_request_react_route()` |
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
- vitest (`pnpm test` → 820/820)
- build (`pnpm build`)
- PHP: `composer lint` → 0/0, `composer analyse` → no errors, `composer test` → 250 passed (4 skipped)
