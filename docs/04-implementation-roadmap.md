# Implementation Roadmap

**Version:** 1.0
**Status:** Proposed
**Covers:** Phases 3 through 7

---

## How to read this document

Each phase has a goal, a list of tickets, and an exit criterion. Tickets are sized in "T-shirt" units (S = ½ day, M = 1 day, L = 2 days, XL = 3+ days) and have explicit acceptance criteria. The sequence is opinionated — earlier tickets unblock later ones. Where two tickets are independent, they are marked **‖** for parallel.

The phases are designed to deliver a deployable v1 in **~12–15 working days of focused engineering**, assuming one engineer. Two engineers can compress to ~8–10 days by parallelising Phases 4 and 5.

I am intentionally not assigning calendar dates. Estimates are for planning, not for promises.

---

## Phase 3 — Scaffold

**Goal:** Stand up the development environment, the React app shell, and the empty WordPress plugin so all subsequent work has a place to land.

**Total estimated effort:** ~3 days

### Tickets

**3.1 — Initialise repo and workspace (S)**

- Create the monorepo with `pnpm` workspaces.
- Add `.editorconfig`, `.gitignore`, root `README.md`, license file.
- Set up GitHub Actions CI skeleton (lint, typecheck on PR).
- **Acceptance:** `pnpm install` at repo root succeeds; CI runs and passes on a no-op PR.

**3.2 — Scaffold the Vite React app (M)**

- `apps/wizard/` with Vite + React + TypeScript template.
- Configure Tailwind, PostCSS.
- Configure Vite to build a single JS + single CSS file with predictable names (no hash, or hash-with-manifest for cache-busting via the plugin).
- Set up ESLint, Prettier with project-wide config.
- Add a placeholder `<App />` that renders "Quote Wizard loading…" in `#qw-root`.
- **Acceptance:** `pnpm --filter wizard dev` shows the placeholder; `pnpm --filter wizard build` produces `dist/wizard.js` and `dist/wizard.css`.

**3.3 — Scaffold the WordPress plugin (M)**

- `plugins/quote-wizard/` with plugin header, autoloader (`composer.json`), main `Plugin` class.
- PSR-4 namespace `Agency\QuoteWizard`.
- Empty `Activator` that creates the `qw_submissions` table.
- Empty `Shortcode` class registering `[quote_wizard]` (renders just the mount div for now).
- Empty `AssetLoader` that enqueues the React bundle from `assets/dist/` when the shortcode is present on the page.
- Settings page stub in wp-admin.
- **Acceptance:** Plugin activates without warnings; `[quote_wizard]` shortcode on a page renders the mount div; the placeholder React app loads inside it.

**3.4 — Build pipeline (S)**

- `scripts/build-plugin.sh`: runs `pnpm --filter wizard build`, copies `dist/*` into `plugins/quote-wizard/assets/dist/`.
- `scripts/package-plugin.sh`: produces a `quote-wizard.zip` ready to upload to a WordPress site.
- **Acceptance:** A single command produces a working plugin ZIP.

**3.5 — Local development setup (S)**

- Document how to run a local WordPress (`wp-env` or Local by Flywheel).
- Document the dev loop: React dev server for fast iteration, plugin build + upload for integration testing.
- Add to `README.md`.
- **Acceptance:** A new engineer can clone, follow the README, and reach a working wizard mount in under 30 minutes.

**Phase 3 exit criterion:** The repo is set up, the empty wizard renders inside a real WordPress site, the build process works end-to-end. No business logic yet. This is the moment to commit and tag `v0.1.0-scaffold`.

---

## Phase 4 — Core Components

**Goal:** Build the reusable wizard engine and the pricing engine. Fencing config drives everything but no component knows about fencing.

**Total estimated effort:** ~5 days

### Tickets

**4.1 — Define the config schema (M)**

- Write `engine/types.ts` containing the full `WizardConfig`, `Step`, `PricingConfig`, `Submission`, `Estimate` types.
- Write a Zod schema mirroring those types for runtime validation of the loaded config.
- Document the schema in `docs/06-pricing-engine-spec.md` (already drafted; refined here).
- Write `config/trades/fencing.json` as the reference implementation.
- **Acceptance:** Loading `fencing.json` validates against the Zod schema; TypeScript types match the JSON shape exactly.

**4.2 — Wizard state machine (L)**

- `engine/wizard-machine.ts`: pure functions for `nextStep`, `previousStep`, conditional step resolution.
- Decision: explicit state machine (XState) or plain reducer? **Recommendation:** plain reducer + small types. XState is wonderful but adds a learning curve for the next maintainer. We can introduce it later if the state grows.
- `useWizard` hook wraps the reducer.
- **Acceptance:** Unit tests cover linear flow, branching flow, back-navigation preserving state, conditional skip-step logic.

**4.3 — UI primitives (M) ‖ with 4.2**

- `ui/Button`, `ui/Input`, `ui/Card`, `ui/ProgressBar`, `ui/Spinner`, `ui/Consent`.
- Mobile-first, accessible (keyboard navigation, ARIA labels, focus management).
- Tailwind-based, themable via CSS variables for primary colour.
- **Acceptance:** Visual review on mobile + desktop; each component passes axe-core accessibility checks.

**4.4 — Step components (L)**

- `TextStep`, `NumberStep`, `SingleChoiceStep`, `MultiChoiceStep`, `ContactDetailsStep`, `ReviewStep`, `ResultStep`.
- Each step receives `{ step: StepConfig, value, onChange, onNext, onBack }`. No step has trade-specific knowledge.
- React Hook Form integration for per-step validation using Zod schemas derived from the step config.
- **Acceptance:** Each step type renders correctly from a minimal config; validation errors display inline; submit disabled until valid.

**4.5 — Pricing engine (L)**

- `engine/pricing-engine.ts`: pure function `(config: PricingConfig, answers: Answers) => Estimate`.
- Supports: base price, linear multipliers, lookup tables (e.g. terrain difficulty), per-unit costs (e.g. gravel boards per metre), fixed add-ons (e.g. gate), variance range output (low/high).
- No side effects. No I/O. Fully testable in isolation.
- **Acceptance:** Test suite covers all calculation paths for the fencing config. Worked examples from the spec match engine output exactly. Adding a new pricing rule does not require touching the engine — only the config.

**4.6 — Photo upload component (L)**

- `PhotoUploadStep` with drag/drop + tap-to-upload, multi-file, previews.
- `useImageCompression` hook wrapping `browser-image-compression`.
- Constraints: max 5 images, max 8MB pre-compression each, types `image/jpeg | image/png | image/webp`.
- Show compression progress; show preview thumbnails; allow individual removal.
- Graceful handling of compression failure (use original if compression fails; warn user if file exceeds limits).
- **Acceptance:** Works on iOS Safari, Android Chrome, desktop Chrome/Firefox/Safari. Compressed output averages ≤500KB.

**4.7 — Submission flow (M)**

- `engine/submission.ts`: builds `FormData`, includes nonce, POSTs to the REST endpoint, handles errors.
- Three outcomes: success → result screen; client error (validation) → return to relevant step; server error → retry once, then show "we've saved your details, we'll call you back" fallback message (because the WP endpoint always logs even if Make.com fails).
- **Acceptance:** Manual test against a mock endpoint covers all three paths. Unit tests for `FormData` construction.

**4.8 — Result screen (M)**

- Premium-feeling estimate display: "Based on what you've described, projects like this typically cost between £X and £Y + VAT."
- Mandatory disclaimer: "This is an indicative estimate only. Final pricing confirmed after site survey."
- Clear next-step CTA: "Book a free site visit" (links to Calendly if configured, otherwise shows the business phone number).
- Trust signals (review count, years in business — pulled from config).
- **Acceptance:** Design review against the brief's "premium, trustworthy, modern" criteria. Mobile-first layout reviewed on a real device.

**Phase 4 exit criterion:** The wizard works end-to-end in local development. A user can complete a fencing quote and reach the result screen with a calculated estimate. The submission POSTs to a stub endpoint and shows the success screen. No real WordPress integration yet beyond the stub. Tag `v0.2.0-engine`.

---

## Phase 5 — Integrations

**Goal:** Wire the WordPress plugin to do real work and connect Make.com, HubSpot, and email.

**Total estimated effort:** ~3 days

### Tickets

**5.1 — WP REST submit endpoint (L)**

- `Rest/SubmitController.php`: registers `POST /wp-json/qw/v1/submit`, verifies nonce, runs `RateLimiter`, runs `Validator`, calls `Submissions/Repository` to persist, calls `ImageHandler` to sideload images, calls `MakeForwarder` to forward to Make.com, returns success.
- Server-side validation must mirror client-side Zod rules (this is duplication; ADR documents why we accept it).
- `qw_submissions` table holds the full payload as JSON + indexed fields (email, created_at, status).
- **Acceptance:** Full submission flow from React → WP → DB works. Submission visible in wp-admin. Image attachments appear in media library and are linked from the submission record.

**5.2 — Rate limiting & abuse mitigation (S)**

- Transient-based per-IP rate limiter: 3 submissions per 10 minutes.
- Honeypot field in the React form (hidden, must be empty).
- Time-to-submit check: if a form is submitted in under 5 seconds, flag as suspicious (don't reject — flag in DB).
- **Acceptance:** Manual test of rate limit returns 429 after the 4th submission.

**5.3 — Make.com forwarder (M)**

- `MakeForwarder.php`: POSTs JSON payload to configured webhook URL, 5-second timeout, 2 retries on 5xx with exponential backoff, logs failure to submission record.
- Critical: forwarder failures do not fail the user-facing request. The submission is already saved; Make.com forwarding is best-effort with alerting.
- **Acceptance:** Test with a deliberately broken webhook URL — the user still gets a success response, the failure is logged, the agency ops inbox gets an alert.

**5.4 — Make.com scenario: lead-intake blueprint (L)**

- Build the scenario in Make.com:
  - Webhook trigger
  - Router with 4 paths: HubSpot create/update contact, owner email, customer email, optional SMS
  - Error handler routing failures to an agency ops email
- Export as blueprint JSON, commit to `automation/make-scenarios/`.
- Document the manual setup steps (HubSpot connection, SMTP credentials, target emails) in `automation/make-scenarios/README.md`.
- **Acceptance:** End-to-end test: a wizard submission produces a HubSpot contact, an owner email, and a customer confirmation email within 60 seconds.

**5.5 — Email templates (M)**

- Owner notification: structured layout with all submission details, image thumbnails (linked), estimate range, "click to call" link, "click to email" link. MJML source committed.
- Customer confirmation: friendly, branded, restates the estimate range, sets expectation for callback time, includes the business's contact details.
- Both templates parameterised via Make.com variables; no client-specific data hard-coded in the template source.
- **Acceptance:** Both emails render correctly in Gmail, Outlook, Apple Mail, and a mobile inbox. Litmus or a manual test across the four clients.

**5.6 — HubSpot setup documentation (S)**

- Document custom properties to create in HubSpot (estimate_low, estimate_high, trade_type, lead_source, qw_submission_id, etc.).
- Document recommended HubSpot internal workflow: assign lead owner, set lifecycle stage, add to lead-nurture sequence.
- **Acceptance:** A new agency operator can follow the doc to set up HubSpot for a new client in under 30 minutes.

**5.7 — Plugin settings page (M)**

- wp-admin settings page: Make.com webhook URL, agency notification email, business name, primary brand colour, business phone, business email, optional Calendly URL.
- These values feed both the server (forwarder, validation) and the React app (via `wp_localize_script`).
- **Acceptance:** Changing the primary colour in settings is reflected in the wizard without a rebuild. Changing the webhook URL is reflected in the next submission.

**Phase 5 exit criterion:** A real submission produces a real HubSpot contact, a real owner email, and a real customer email. The flow is end-to-end on a development WordPress site. Tag `v0.3.0-integrations`.

---

## Phase 6 — Production Hardening

**Goal:** Make the system robust enough to deploy to a paying client.

**Total estimated effort:** ~2 days

### Tickets

**6.1 — Accessibility audit (M)**

- Run axe-core against every step of the wizard.
- Manual keyboard-only navigation review.
- Screen reader spot check (VoiceOver on iOS).
- Fix all critical and serious findings; document any deferred.
- **Acceptance:** Zero critical/serious axe issues. Wizard completable via keyboard alone.

**6.2 — Performance audit (M)**

- Lighthouse run on the wizard page; target ≥90 mobile.
- Verify bundle size against budget (≤180KB JS gz, ≤20KB CSS gz).
- Lazy-load `browser-image-compression` (only loaded when the photo step is reached).
- Preconnect and font preload tuning.
- **Acceptance:** Lighthouse Performance ≥90 mobile, ≥95 desktop. Bundle within budget.

**6.3 — SEO setup (M)**

- RankMath configured: sitemap, robots, schema markup (LocalBusiness, Service, FAQ where appropriate).
- Per-page meta titles and descriptions templated.
- Local landing page templates with proper H1, schema, and internal linking.
- Google Search Console + Bing Webmaster Tools verified; sitemap submitted.
- GBP integration documented (the agency handles this manually per client).
- **Acceptance:** Schema validates in Google's Rich Results Test. Core Web Vitals "Good" on homepage and wizard page.

**6.4 — Error handling polish (S)**

- Friendly error states for every failure mode (network down, slow connection, validation failure, server error, image upload failure).
- Client-side error reporter wired and tested.
- **Acceptance:** Manual chaos test: disconnect network mid-submit, throttle to slow 3G, kill the API. User always sees a clear, recoverable state.

**6.5 — GDPR & privacy (S)**

- Privacy policy template page shipped with plugin.
- Consent checkbox final review.
- Submission pruning cron job tested.
- Data subject access process documented in `docs/operations.md`.
- **Acceptance:** Documented process for handling a right-to-erasure request, tested end-to-end on a test submission.

**6.6 — Analytics wired (S)**

- GA4 events: `wizard_start`, `wizard_step_complete`, `wizard_submit`, `wizard_abandon`.
- Microsoft Clarity session recordings enabled (with cookie consent).
- **Acceptance:** Events fire correctly visible in GA4 DebugView.

**6.7 — Security review (S)**

- Plugin scanned with Plugin Check (WP.org tool).
- Manual review for nonce coverage, capability checks, SQL prepared statements, output escaping.
- Dependency audit (`pnpm audit`, `composer audit`).
- **Acceptance:** Plugin Check passes with no errors. No high/critical dependency vulnerabilities.

**Phase 6 exit criterion:** The system is ready for a paying client. All quality gates passed. Tag `v1.0.0-rc1`.

---

## Phase 7 — Deployment

**Goal:** Get the system live on the client's domain, with monitoring, backups, and a documented rollback path.

**Total estimated effort:** ~1.5 days

### Tickets

**7.1 — Cloudways setup (M)**

- Provision a DigitalOcean droplet on Cloudways for the client.
- Install WordPress, configure PHP 8.2+, set up SSL via Let's Encrypt.
- Install Kadence theme, RankMath, and the quote-wizard plugin.
- Configure SMTP for transactional email (via Cloudways' built-in or via Brevo/Postmark).
- Set up staging environment as a Cloudways clone.
- **Acceptance:** Both production and staging environments running, accessible, secured.

**7.2 — Content migration & build-out (L)**

- Build the client's pages on staging: homepage, services, local landing pages, privacy policy, terms.
- Configure plugin settings with the real values.
- Set up the real Make.com scenario from the blueprint; connect to the client's real HubSpot account.
- Configure GBP (manual, per agency playbook).
- **Acceptance:** A test submission on staging produces a real HubSpot contact and emails to the client's real address.

**7.3 — Go-live (S)**

- DNS cutover via the registrar (the agency does not host DNS).
- SSL re-issued for the production domain.
- Run a final end-to-end smoke test against production.
- Submit sitemap to Google Search Console.
- **Acceptance:** The client's domain serves the new site over HTTPS. A real submission works end-to-end.

**7.4 — Monitoring & backup (S)**

- UptimeRobot monitors configured (homepage + wizard page).
- Cloudways daily backups verified (retention: 7 days).
- A manual offsite backup taken and stored (S3 or Google Drive — per agency policy).
- Documented rollback: how to restore from a Cloudways backup, how to deactivate the plugin if the wizard breaks.
- **Acceptance:** A simulated rollback restores the site to a previous state in under 15 minutes.

**7.5 — Handover & training (M)**

- 30-minute training session with the client owner: how to view submissions, how to edit pages, how the wizard works.
- Provide written summary email + the operations doc subset relevant to the client.
- **Acceptance:** Client owner can independently log a fake submission, find it in wp-admin, and find the matching HubSpot contact.

**Phase 7 exit criterion:** The system is live, monitored, backed up, and the client knows how to use it. Tag `v1.0.0`. Pop a non-alcoholic beverage of choice.

---

## Cross-cutting tracks

These run alongside the phases, not after them.

### Documentation

Every phase produces docs. `docs/decisions/` accrues ADRs as decisions are made. `docs/deployment.md` is updated continuously, not at the end. The rule: a change to behaviour requires a change to docs in the same PR.

### Testing

- Pure functions (pricing engine, validators) have unit tests written alongside the code, not after.
- Step components get smoke tests (renders, validates, advances) — not exhaustive snapshot tests.
- The submit endpoint has a PHP unit test covering happy path + 4xx + 5xx forwarder failure.
- End-to-end tests (Playwright) are deferred to post-v1 — the cost/benefit isn't there yet for a wizard with predictable shape.

### Decision log

ADRs are written within 24 hours of the decision being made. Late ADRs lie because they rationalise. Same-day ADRs tell the truth about the tradeoff.

---

## Dependencies between phases

```
Phase 3 (Scaffold)
   ↓
Phase 4 (Core Components)  ←— blocks Phase 5
   ↓                                 ↓
   └──→ Phase 5 (Integrations) ←—————┘
                 ↓
        Phase 6 (Hardening)
                 ↓
        Phase 7 (Deployment)
```

Phases 4 and 5 can partially overlap with two engineers: Engineer A builds the React engine (4.1–4.7), Engineer B builds the WP plugin REST endpoint and the Make.com scenario (5.1, 5.3, 5.4) against a mocked React payload. Convergence happens at 5.7.

## What is explicitly NOT in v1

To save us the conversation later — these things are deferred and will be revisited only after multiple deployments give us real signal:

- Admin UI for editing pricing (JSON file is v1)
- Custom Gutenberg block (shortcode is v1)
- A second trade vertical wired in (the engine supports it; we don't ship config for it)
- WhatsApp Business notifications
- Calendar booking inside the wizard
- A/B testing infrastructure
- Multi-language support
- A client-facing analytics dashboard
- Automated PDF quote generation
