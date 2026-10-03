# Josh Lennon Portfolio: Implementation Specification

Version 1.1, 3 October 2026, for Claude Code running inside `awkwardapples/Portfolio`.
Place this file at `docs/portfolio-spec.md` (replacing 1.0) and treat it as the governing document for the transformation.

### Changes in 1.1 (read these first if you started from 1.0)

1. **Pass 0 change:** `Media/` is not simply deleted. Six of its files are byte-identical duplicates of images already in `apps/wizard/src/assets/images/`; three are unique SCB brand files that must be kept (section Q.1, item 5). If Pass 0 already deleted `Media/`, restore those three from the last commit before Pass 0.
2. **SCB images are licensed.** Josh has permission for all SCB images; their filenames are arbitrary. Do not remove, rename or replace them. Re-encoding for size is allowed if the filename and dimensions stay the same (B.6, J.3).
3. **Fixed values supplied:** domain `joshlennon.com`, GitHub username `awkwardapples`, a dedicated portfolio Make.com webhook (held by Josh; secret only), headshot (section U.8).
4. **Content pack added** as section Y: profile facts, education, experience (including the Mercor framework), skills, new work entries from Josh's CV, and a list of discrepancies Claude Code must not resolve on its own.
5. Threshold sentence (G.0), hiring intent options (I.3), Person structured data (S), skills presentation (L) and the open-items list (W) updated to match.

---

## 0. Read this first: how Claude Code should work

You are modifying an existing professional codebase. It was built as a lead-generation platform for local trades businesses (GrowTrades), with a client deployment for SCB Handyman. It is now being transformed into Josh Lennon's personal portfolio. The engineering foundation is genuinely good: a config-driven wizard engine with a pure state machine, typed ports for persistence and submission, a three-layer bot-protection pipeline, UK GDPR handling, 856 passing TypeScript tests, strict lint and type gates, and a disciplined ADR habit. Most of that survives. The trades-specific product, the WordPress host and the visual design do not.

Working rules:

1. Inspect before modifying. Read the files a pass touches before changing them. Several statements in the old docs are stale (see section B.6); the code is the source of truth, then this spec, then new ADRs 0039 onwards. ADRs 0001 to 0038 are historical context for the GrowTrades platform and are not instructions for this site.
2. Preserve working systems. Do not rewrite the wizard engine, its tests, or the reusable primitives. Extend them additively. If a change to `apps/wizard` breaks any of the existing 856 tests, stop and fix it before continuing.
3. Do not preserve business-specific functionality just because it exists. The trades site lives on only as the SCB demo (section J). It must not leak into the portfolio's pages, copy or navigation.
4. Do not invent content. Never write achievements, dates, grades, employers, project details, statistics or quotes about Josh that are not in this spec or in content he supplies. Use the placeholder mechanism in section T.4.
5. Do not add dependencies without a reason written in the relevant ADR. The approved new dependencies are listed in section U.6.
6. Do not introduce generic AI-generated UI patterns. Section X is a review checklist; run it at the end of every visual pass.
7. Maintain security, performance, mobile support and accessibility in every pass, not as a final clean-up.
8. Work in the broad passes defined in section V. After each pass, run every gate in section V.0, update `docs/current-state.md`, and commit with a conventional-commit message. Do not start the next pass with a red gate.
9. Update documentation when it becomes inaccurate. Every architectural decision in this spec gets an ADR (list in section U.7).

Component libraries:

- Aceternity UI and 21st.dev are available through Claude Code plugins. Use them only where section N names them, or where a component clearly improves an interaction that section N describes. Never paste a demo as-is. Every adopted component must be translated onto the site's design tokens (section E), stripped of gradients, blur, glow, sparkles and decorative shadows, given a designed mobile behaviour and a reduced-motion behaviour, and checked for keyboard and screen-reader access.
- Both libraries assume default Tailwind classes. This repo's Tailwind config deliberately replaces the default theme (ADR-0003, ADR-0012), so classes like `bg-neutral-800`, `bg-gradient-to-r` or `backdrop-blur` simply do not exist here and will silently produce no CSS. That is intentional. Translate every class to a token class; do not widen the theme to make a demo work.
- Replace `@tabler/icons-react` imports in adopted components with the site's icon set (section E.6).

Stop and ask Josh, rather than guessing, when:

- a pass needs content marked `TODO(josh)` that has not arrived and no placeholder strategy is defined for it;
- a dependency outside section U.6 seems necessary;
- the Astro React integration requires React 19 and the upgrade breaks wizard tests in a way that is not a mechanical fix;
- anything would publish confidential Mercor material, real customer data from SCB, or images whose provenance is unknown.

---

## A. Executive summary

We are building a fast, static-first personal portfolio for Josh Lennon: Computer Science and AI graduate (University of Manchester), MSc Artificial Intelligence student (University of Surrey), founder of GrowTrades, and musician. The site has to answer seven questions quickly: who he is, what he does, what he has built, what he has researched, what he creates, how to explore it, and how to contact him. It does this with evidence (papers, a dissertation, code, a live client site, video) rather than claims.

The repository becomes three things in one pnpm monorepo:

1. `apps/site`: a new Astro site. Every page is pre-rendered HTML, so content is indexable and fast. Interactive parts are React islands. Projects, research and posts are Markdown/MDX files in content collections, so publishing never needs application code.
2. `apps/wizard`: the existing React/TypeScript engine, kept almost intact. It serves two purposes. Its engine powers the portfolio's "What brings you here?" contact wizard. Its full SCB Handyman site is built as a static, self-contained demo that runs live inside the GrowTrades case study.
3. `apps/edge`: a Cloudflare Worker that serves the static site and exposes one API route, `/api/submit`. It is a TypeScript port of the WordPress plugin's submission pipeline, with the same protections: honeypot, rate limiting, Cloudflare Turnstile, consent enforcement, duplicate detection, formula-injection sanitisation and retention pruning. Submissions are stored durably in Cloudflare D1, then forwarded to the existing Make.com scenario (Google Sheet plus email; WhatsApp removed).

Hosting is Cloudflare's free tier (Workers static assets, D1, Turnstile, Web Analytics, Email Routing). The only running cost is the domain. WordPress, PHP and LocalWP leave this repository; the WordPress plugin remains in the GrowTrades template repository, where it belongs.

The visual identity is new and specific to Josh: a light "paper" reading surface for work and research, a black "stage" for identity and music moments, and a single tungsten-amber accent shared by both. The signature interaction is the first-visit threshold: the visitor answers "What brings you here?" with one tap, the house lights come up, and they land in the part of the site that matches their answer.

---

## B. Existing repository assessment

Everything in this section was verified by reading the code and running the gates on 3 October 2026, not taken from the old docs.

### B.1 Layout

| Path | What it is | Fate |
| --- | --- | --- |
| `apps/wizard/` | Vite + React 18 + TypeScript + Tailwind 3 + React Hook Form + Zod 3. Contains the wizard engine (`domain/`, `runtime/`, `components/`) and the complete SCB Handyman website (`site/`) as a client-rendered SPA. | Keep. Engine reused; SCB site becomes the demo build. |
| `plugins/quote-wizard/` | WordPress plugin (PHP 8.1+, PSR-4, Pest, PHPStan level 8). Hosts the SPA via a minimal template, emits SEO head tags, exposes `POST /wp-json/qw/v1/submit`, stores submissions and photos, forwards to Make.com, runs retention crons. | Remove from this repo after porting its pipeline to `apps/edge`. |
| `scripts/build-plugin.mjs`, `scripts/package-plugin.mjs` | Copy the Vite build into the plugin and zip it. | Remove. |
| `docs/` | Numbered architecture docs, 38 ADRs, very detailed evidence and audit files, LLM handoff guides, SCB design bible. | Archive most; rewrite the living docs (section C). |
| `docs/Agency Docs/` | Sales strategy (with real SCB ranking and enquiry metrics), a retainer agreement template, a technical onboarding notebook, and a 2 MB PDF. | Delete and scrub from history (section Q.1). |
| `Media/` | Nine files: six byte-identical duplicates of images in `apps/wizard/src/assets/images/` (fencing, plumbing, jetwash, driveway, painting heroes and the white SCB logo), plus three unique SCB brand files: the full-colour logo on transparent background (`backgroundless logo.png`, 1730 by 909), the same logo on an opaque background (`84f8df2b-...png`, 1730 by 909) and SCB's Open Graph image (`scb-og-image-1200x630.jpg`). | Move the three unique files to `apps/site/src/content/work/growtrades/brand/` (filenames may be cleaned there because they are new copies: `scb-logo.png`, `scb-logo-opaque.png`, `scb-og.jpg`), then delete `Media/`. |
| Root clutter | `goqw-diag.php`, `PROBE-1-instructions.txt`, `AUDIT-6.5-tsconfig-test-error.md`, `step-4.1-config-schema.tar.gz`. | Delete. |
| `.github/workflows/ci.yml` | JS/TS job (format, lint, typecheck, test, build) and PHP job. | Adapt: drop PHP job, add site and edge jobs, add deploy. |
| `.husky`, `lint-staged.config.js`, `.prettierrc`, `.editorconfig`, `.nvmrc` (Node 20), pnpm 9.15 workspace | Developer workflow. | Keep. |

### B.2 Architecture of the engine (what makes it worth keeping)

- `domain/` is pure TypeScript with no React and no I/O. `config/wizard-config.ts` defines strict Zod schemas: stable ids, declarative visibility conditions (`equals`, `notEquals`, `in`, `notIn`, `notEmpty`), field steps plus three special step kinds (`estimate-display`, `visual-card-selector`, `size-bracket-selector`), and `quoteMode: 'instant' | 'manual'`. Unknown keys fail validation.
- `domain/runtime/` is a finite-state machine (`transition.ts`, `state.ts`, `navigation.ts`, `answer-validation.ts`, `condition-evaluator.ts`). Phases include hydrating, answering, validating, submitting, submit_success and submit_failure.
- `runtime/WizardStore.ts` bridges the machine to React via `useSyncExternalStore`, persists answers through an injected `PersistenceAdapter` (sessionStorage by default, errors swallowed) and submits through an injected `SubmissionPort` that never throws.
- `runtime/http-submission-port.ts` maps HTTP outcomes to typed errors: 200 with `reference` and `isDuplicate`; 400/422 validation; 401/403 unauthorised; 429 rate limited with `retryAfterSeconds`; 502 forwarder unavailable; timeouts and network failures. No silent retries, by design, to avoid duplicate rows.
- Ports are composed by decoration: `createPhotoEnrichedPort` and `createBotProtectionEnrichedPort` wrap the base port. `HoneypotField` mounts once per session; `TurnstileWidget` loads Cloudflare's script only on the final step and only when a site key is configured; `submission-gate.ts` (ADR-0038) blocks both Submit and "Skip and Submit" until Turnstile is ready.
- Verticals are a closed, frozen registry (`domain/registry/verticals.ts`). The quote page supports category navigation, a single-service bypass and `?service=` deep-link preselection. Pre-steps are injected engine-side (`preSteps: [addressPreStep]`).
- UI primitives are small, owned and accessible: `Tooltip` (hover and focus, `aria-describedby`, Escape), `useFocusTrap`, `MobileMenu` (dialog semantics, focus return, scroll lock, flat scrim), `Skeleton` (opacity pulse only, `aria-hidden`, disabled under reduced motion), `IconButton` (requires a label), `SkipLink`, `useHeaderScrollState`, `useScrollReveal`. There are no spinners anywhere (ADR-0012).
- The design system is enforced mechanically. `tailwind.config.ts` replaces Tailwind's theme with a closed token set from `design/tokens.ts`: one neutral scale, one accent as a runtime CSS variable (`--goqw-primary`), no gradient, blur or decorative tokens. A custom ESLint rule (`local/no-emoji`) fails CI on emoji in UI strings.

### B.3 Security model (WordPress plugin, to be ported)

Order of operations in `SubmissionController::handle()`:

1. Output buffering so PHP warnings cannot corrupt JSON.
2. Bot protection (`BotProtection`): honeypot first (filled value returns 400 `validation_failed`), then per-IP rate limit (`RateLimiter`, transients, 5 per hour, fixed window that preserves its original expiry, recorded only for allowed requests; returns 429 with `retryAfterSeconds`), then Turnstile verification when configured (missing or invalid token returns 403 `bot_verification_failed`). A master switch can disable all three.
3. Shape validation: `contractVersion === 3`, `quoteMode`, `wizardId`, `answers` object, pricing integers.
4. Consent: `answers.data_processing_consent` must contain `'agreed'`, otherwise 400 `consent_required` and nothing is persisted.
5. Duplicate detection: normalised email (trim, lowercase) or phone (digits only) matching a non-duplicate submission in the last 24 hours (UTC). Duplicates are persisted and flagged but never forwarded, and the response says `isDuplicate: true`.
6. Media validation and storage (photos); not needed for the portfolio.
7. Persist before forward (ADR-0001). The database row keeps the original answers.
8. Outbound sanitisation (`InputSanitizer`, ADR-0037): strip null bytes, `sanitize_text_field`, and prefix any string starting with `=`, `+`, `-` or `@` with an apostrophe to neutralise spreadsheet formula injection. Applied to the webhook copy only.
9. Synchronous forward to Make.com with a 10 second timeout; on failure the row is marked `forward_failed` and the client gets 502.
10. Crons prune submissions after 90 days and photos after 6 months.

Also: the webhook URL lives server-side only; the public config is an explicit allowlist (ADR-0009); all SQL is parameterised; the REST nonce is a CSRF/origin check, not authentication (AUDIT-6.6).

Gaps worth fixing in the port: the server never validates answers against the wizard config (the client schema is "UX only"), there is no request body size limit, the Turnstile response's `hostname` is not checked, and the raw IP is used as the rate-limit key.

### B.4 Performance and loading model

- Production bundle: 374 kB JS (99.5 kB gzip) plus 27 kB CSS (5.5 kB gzip), built in about 4 seconds. The budget in `docs/02-architecture.md` was 180 kB gzip.
- The WordPress template renders `<div id="qw-root"></div>` and nothing else in the body. All page content is rendered client-side. Only head tags are server-rendered. This is the single biggest reason not to keep the current host model for a content portfolio.
- Unknown routes render the home page instead of a 404 (ADR-0016), which search engines treat as soft 404s.
- Self-hosted Inter, `font-display: swap`. The SCB service hero images are unoptimised (one is 1.3 MB).

### B.5 Testing and gates (verified)

- `pnpm test`: 66 files, 856 tests, all passing. All tests are pure-function tests in a Node environment; there is no DOM or browser test infrastructure (noted in ADR-0038).
- `pnpm typecheck` (production and test tsconfigs): clean. `pnpm lint` (max warnings 0): clean. `pnpm build`: clean.
- PHP: 274 passing and 4 skipped per the last recorded gate in `docs/current-state.md`; not re-run here because the PHP toolchain is not available in this environment. It leaves the repo with the plugin.

### B.6 Findings that change the plan

1. A live Make.com webhook URL is committed in `docs/Agency Docs/Technical Onboarding.IPYNB` (line 544) and is in git history. The repository is public. Josh must regenerate that webhook in Make.com before anything else (section Q.1).
2. `docs/Agency Docs/` contains SCB's search ranking and enquiry figures and a link to a Google Sheet. Treat both as sensitive.
3. Resolved in 1.1: Josh confirms he has permission for every SCB service image and that their filenames are arbitrary. They stay exactly as they are. The only allowed change is re-encoding oversized files (the plumbing hero is 1.3 MB) at the same filename and dimensions.
4. Documentation drift: `current-state.md` reports 824 tests (actual 856); the README points to `config/trades/` and `automation/`, which do not exist; `02-architecture.md` describes HubSpot and a Kadence theme that the implementation does not use.
5. Reusable components read `window.GOQW_CONFIG` directly (`TurnstileWidget`, `StepRenderer`) and hard-code quote copy (`SuccessScreen`, `ServiceSelector`, `EstimateDisplayStep`). Small, additive refactors fix this (section I.6).

---

## C. KEEP / ADAPT / REMOVE / REBUILD

### C.1 KEEP (minimal or no modification)

| Item | Why |
| --- | --- |
| Wizard domain: schemas, FSM, navigation, conditions, validation, format validators (`apps/wizard/src/domain`) | Config-driven, pure, heavily tested. Powers the contact wizard and the SCB demo. |
| Runtime: `WizardStore`, persistence adapters, `SubmissionPort` contract, `http-submission-port` error mapping, bot-protection port decoration, photo stores | Clean ports; the portfolio only swaps the endpoint and adapters. |
| Primitives: `Tooltip`, `IconButton`, `Skeleton`, `useFocusTrap`, `SkipLink`, `MobileMenu` behaviour, `useHeaderScrollState` logic, `cn` | Accessible, owned, dependency-free. Restyled through tokens, behaviour unchanged. |
| `HoneypotField`, `TurnstileWidget` lazy loading, `submission-gate.ts` | Abuse protection on the client side. |
| UX constraints from ADR-0012: no spinners, skeletons that match layout, optimistic UI where safe, tooltips on icon-only buttons, no gradients or glass, one accent, one real type system, body line-height 1.5 to 1.6 | They match Josh's brief almost word for word. |
| Closed-theme Tailwind approach (ADR-0003, Tailwind 3.4) | Makes "no gradients, no glass" impossible rather than discouraged. |
| `local/no-emoji` ESLint rule, Prettier, Husky, lint-staged, strict TypeScript, Vitest | Quality gates. |
| SCB site code in `apps/wizard/src/site` | Becomes the live demo; changes limited to section J.3. |
| ADRs 0001 to 0038 | Historical record of the GrowTrades platform; also case-study evidence. Not instructions for this site. |

### C.2 ADAPT

| Item | Change |
| --- | --- |
| Quote wizard | Becomes "What brings you here?": intent selection, short intent-specific questions, a tailored result built from site content, then optional contact details (section I). |
| Submission pipeline | Ported from PHP to a Cloudflare Worker with parity tests, plus the improvements in B.3 (section Q.3). |
| Make.com scenario | Same webhook contract. Replace the WhatsApp module with an email module, point Sheets at a new portfolio sheet, add a shared-secret header check. |
| Data protection | Consent field, retention pruning and duplicate handling stay. New privacy notice with Josh as controller; new data-handling runbook. |
| Navbar and mobile menu | Same accessibility behaviour, new structure, styling and condensing behaviour (section N). |
| SEO infrastructure (ADR-0023) | Same layers (meta, canonical, OG, JSON-LD, sitemap, robots), now emitted at build time by Astro instead of PHP. Person schema replaces LocalBusiness. |
| CI workflow | Remove PHP job; add site build, edge tests, Playwright smoke and accessibility tests; add deploy. |
| Vite build of `apps/wizard` | Add a demo build mode (base path, memory router, demo submission port, demo banner). |
| Docs | Rewrite `README.md`, `CONTRIBUTING.md`, `current-state.md`, `handoff.md`, `roadmap.md`, `technical-debt.md`. Add ADR-0039 onwards. |

### C.3 REMOVE

| Item | Reason |
| --- | --- |
| `plugins/quote-wizard/` and its CI job, `composer` tooling, `scripts/build-plugin.mjs`, `scripts/package-plugin.mjs`, `goqw-diag.php` | WordPress is not the host any more. The plugin remains in the GrowTrades template repo. |
| WordPress/LocalWP operational knowledge: `DB_HOST` port, `WP_TEMP_DIR`, OpCache notes, rewrite flushing, admin-bar CSS offsets | Irrelevant without WordPress. Archived, not carried forward. |
| Photo upload on the portfolio's contact wizard | No reason to accept files from strangers. Code stays in `apps/wizard` for the SCB demo only. |
| WhatsApp notification | Josh's instruction. |
| Trade pricing, trade questions, postcode pre-step, trade SEO landing pages, LocalBusiness and Service schema, SCB branding in any portfolio page | Business-specific. They survive only inside the SCB demo build. |
| `docs/Agency Docs/`, root clutter, and the duplicate files in `Media/` (after the three unique brand files are moved) | Sensitive or obsolete. |
| GA4 and Microsoft Clarity plans from the old architecture | Replaced by cookieless Cloudflare Web Analytics; no consent banner needed. |

### C.4 REBUILD

Visual identity; information architecture; homepage; navigation structure; project, research, music and about pages; content model and authoring workflow; media pipeline; GitHub and LinkedIn presence; the GrowTrades presentation; the hosting and deployment model.

### C.5 Documentation plan

- Move to `docs/archive/growtrades-platform/` (unchanged, with a short README explaining they describe the trades platform): `01` to `06` numbered docs, `adaptation-runbook.md`, `component-registry.md`, `design-bible.md`, `fork-procedure.md`, `llm-customization-handoff.md`, `make-com-integration.md`, `onboarding.md`, `phase-*-evidence.md`, `product-vision.md`, `rendering-architecture-audit.md`, `scb-pricing-intake-questionnaire.md`, `seo-adaptation-guide.md`, `service-customization-guide.md`, `ui-overhaul-plan.md`, `business-owner-data-handling-guide.md`, `privacy-policy-template.md`, `security-notes.md`, `bundle-baseline*.md`, top-level `AUDIT-*.md` and `audit-*.md`.
- Leave `AUDIT-*.md` files that sit inside `apps/wizard/src/**` where they are; they document the engine.
- Keep `docs/decisions/` in place. Add a `docs/decisions/README.md` index stating that ADRs 0001 to 0038 record the GrowTrades platform and that ADRs touching WordPress, PHP or photo storage are superseded for this repository by ADR-0039 and ADR-0043.
- New living docs: `README.md`, `CONTRIBUTING.md`, `docs/current-state.md`, `docs/handoff.md`, `docs/roadmap.md`, `docs/technical-debt.md`, `docs/authoring-guide.md` (for Josh), `docs/data-protection.md` (runbook), `docs/media-pipeline.md`, `docs/deployment.md`, and this spec.

---

## D. Research findings

These shaped the decisions below. Sources were reviewed on 3 October 2026.

**Josh's current site (superdan1505.com).** It is a Create React App shell: the server returns the title "React App", the default CRA meta description and an empty root. Search engines and link previews see no content. The domain is being dropped. Old PDF URLs will die with it, so the new site hosts every document itself.

**Reference site (philotheephilix.in).** Single page, five anchor sections (home, stack, work, log, contact), one accent colour, an availability flag, and every work item links directly to proof such as a merged pull request, a published package or a repo. The experience log has dates and durations. Lessons taken: density, verifiable rows, a clear log. Not taken: its code-syntax voice (headings written as function calls), which is that developer's signature and cannot carry a music identity.

**Josh's YouTube channel.** Listed as "Josh Lennon", handle `@BTECJohnLennon`, About text "MUSICIAN". Searching for "Josh Lennon musician" returns only John Lennon results. Identity disambiguation (consistent naming plus Person structured data with `sameAs` links to every profile) matters more than usual and is built into the data model now.

**Forms in portfolios.** The strongest pattern is a brief builder that turns a few multiple-choice answers into a structured enquiry. Lead-generation research (mostly from vendors, so the numbers are discounted) agrees on one durable principle: give the result before asking for contact details. The existing quote wizard already does this (price before details), so that ordering is preserved. Forced shareability mechanics (quiz scores, personality results) were rejected as gimmicks for a personal site; organic reach comes from indexable research pages and music.

**Embedding a client website.** Live-site embeds work by rendering an iframe at a real device width and scaling it down, with a fallback when the target blocks framing. Screenshots alone are not enough because text in images cannot be read by screen readers. Because the SCB site is not live, and because the SCB site is a self-contained React app in this repo, the best option is to build it as a static demo on the same origin and run it inside a browser frame (section J).

**Navigation for mixed identities.** Reviewers scan portfolios quickly (one survey puts typical review time at under three minutes). Spatial "constellation" navigation hides order, makes visitors hunt, and works badly on touch screens. The real insight in Josh's constellation idea is that his work connects (from-scratch neural network, to a deep learning paper, to an MSc in AI, to AI training-data contract work; from a Kerr microscopy web interface to GrowTrades). That is expressed through cross-links, a single chronological log and filters, not through a star map.

**GitHub and LinkedIn.** GitHub's API is rate-limited for anonymous callers (this environment hit the 60-requests-per-hour limit while researching), and its contribution calendar requires an authenticated GraphQL call. So GitHub data is fetched at build time with a token and snapshotted. LinkedIn offers no usable profile API; its official badge injects a third-party script and an iframe that cannot be styled. The site renders its own card from facts Josh supplies and links out.

**Video.** AV1 is far more efficient than H.264 but Safari plays AV1 only with a hardware decoder, so H.264 must remain as a fallback. Below-the-fold video should use `preload="none"` and lazy loading; the largest-contentful-paint element must never be lazy. Reduced-motion users must not get autoplaying video. WCAG 2.2.2 requires a pause control for any motion that plays for more than five seconds.

**Hosting.** Cloudflare serves static asset requests free and without limit on every plan; only requests that run Worker code count against the free 100,000 requests per day (10 ms CPU each). Cloudflare now steers new projects to Workers with static assets rather than Pages, which also allows cron triggers. D1's free tier allows 5 million reads and 100,000 writes per day. Cloudflare acquired the Astro team in January 2026; Astro 6 brings first-class CSP support and moves content collections to Zod 4.

**Content editing.** Sveltia CMS is a free, Git-based editor that runs as a static page at `/admin`, works with Markdown content collections, and can sign in to GitHub with a personal access token (no OAuth server needed). It is a single-developer project, so content files stay the source of truth and the CMS is a replaceable convenience.

---

## E. Creative direction

### E.1 Concept: paper and stage

Josh's work lives in two rooms. In one he reads, writes and builds: papers, a dissertation, code, a client platform. In the other he performs. The site gives each room its own surface and lets one light move between them.

- **Paper** is the reading surface: work, research, writing, about. Light, quiet, evidence-first. Documents look like documents.
- **Stage** is pure black: the first-visit threshold, the music section and the music page. Footage and photography sit on it the way they would in a dark venue or a cinema letterbox.
- **Tungsten** is the one accent, the colour of incandescent stage light. On stage it lights things directly. On paper it is used like a highlighter: a fill behind black text, never as text on paper.

The visitor's first moment is on stage (the threshold). Answering "What brings you here?" brings the house lights up and the paper room appears. That transition is the site's one orchestrated motion moment (section N.1). Everything else moves only in response to the visitor.

### E.2 Palette

| Token | Hex | Role | Verified contrast |
| --- | --- | --- | --- |
| `paper` | `#F3F4F2` | Page surface for reading sections | ink on paper 19.0:1 |
| `ink` | `#000000` | Text on paper; also the stage colour | |
| `graphite` | `#565B61` | Secondary text on paper | 6.2:1 on paper |
| `rule` | `#CDD0CB` | Decorative dividers on paper only | 1.4:1 (decorative, never a control boundary) |
| `line-strong` | `#7C8187` | Form control borders on paper | target at least 3:1 on paper; verify in tests |
| `stage` | `#000000` | Threshold, music surfaces | |
| `fog` | `#A3A8AE` | Secondary text on stage | 8.8:1 on stage |
| `tungsten` | `#FFB000` | The accent | 11.5:1 on stage; black on tungsten 11.5:1; tungsten on paper 1.7:1, so never text on paper |
| `tungsten-deep` | `#8A5A00` | Rare small accent text on paper (for example an active filter count) | 5.4:1 on paper |
| `danger`, `success` | keep existing state tokens, re-verified on both surfaces | Validation only | |

Rules: no gradients, no blur, no glass, no glow. Shadows only where one layer genuinely sits above another (menus, dialogs, the device frame). Focus rings are ink on paper and tungsten on stage, 2 px with 2 px offset.

Pass 3 must check the tungsten accent against stills from Josh's graded Lumix footage and his photographs. If it clashes, the hue changes in one token and nothing else moves.

### E.3 Typography

One serif and one sans, clearly distinct, both open-licensed and self-hosted (no third-party font requests, consistent with ADR-0007):

- **STIX Two Text** (variable, roman and italic) for headings and long-form reading. It was designed for scientific publishing, which suits papers, a dissertation and research pages, and it has enough warmth for music titles. Long-form body: 19 to 20 px, line-height 1.6, measure 60 to 68 characters.
- **IBM Plex Sans** (variable) for interface text: navigation, buttons, captions, metadata, filters, forms and the wizard. Body UI text 16 to 17 px, line-height 1.5.

Use `@fontsource-variable/stix-two-text` and `@fontsource-variable/ibm-plex-sans` (verify package names when installing; fall back to the static `@fontsource` packages if a variable build is unavailable). Subset to Latin. Preload only the STIX roman file used by the threshold and page titles.

No monospace face for metadata labels, no all-caps eyebrow labels above headings, and no italicising or colouring a single word in a headline. Dates and kinds are set in Plex Sans at caption size, in sentence case.

Type scale: a modular scale with ratio 1.25 from a 17 px base (17, 21, 27, 33, 42, 52, 65), with display sizes using `clamp()`; the threshold name runs from about 56 px on small phones to about 160 px on wide screens. Headings use negative letter-spacing proportional to size; body text uses none.

### E.4 Layout

- Left-aligned throughout. Centred text only inside buttons.
- 12-column grid, content max width 1200 px, reading column 68ch, figures may break out to the full content width; stage sections are full-bleed.
- Spacing on the existing 4 px scale. Section rhythm: 128 px between sections on desktop, 80 px on tablet, 64 px on mobile; 48 px between a section heading and its content. These are tokens, not one-off values.
- Corner radius by role, not one radius for everything: media 4 px, inputs and buttons 6 px, device frames use realistic hardware radii, pills are not used.
- Evidence is presented as figures with real captions. Where a page refers to its figures in text (case studies, research), figures are numbered, because that numbering is a working reference system. Elsewhere they are not numbered.

ASCII sketch of the homepage rhythm on desktop:

```
STAGE  | JOSH LENNON                                         |
       | One factual sentence.                               |
       | What brings you here?                               |
       |   I'm hiring ............ selected work, experience |
       |   Research .............. papers and dissertation   |
       |   A website for my business .... GrowTrades         |
       |   Music ................. releases and live         |
       |   Just looking around                               |
PAPER  | [portrait]  Short bio in Josh's words.  [CTA] [CTA] |
       | Selected work: rows with artefact thumbnails        |
       | Research: document covers with abstracts            |
       | GrowTrades: browser frame with the live SCB site    |
STAGE  | Music: full-bleed footage loop, latest release      |
PAPER  | Outside work: three captioned photographs           |
       | Lately: latest posts                                |
       | Elsewhere: GitHub calendar, repos, LinkedIn card    |
       | Get in touch                                        |
```

### E.5 Voice and copy

Plain, first person, sentence case, active verbs, no marketing words, no emoji. Buttons say exactly what happens ("Read the paper", "Download CV (PDF, 140 kB)", "Try the live site", "Send message"). An action keeps its name through a flow. Errors say what happened and what to do next. Do not append arrows to link text. Do not join metadata with middle dots; use separate elements or commas. Bio and project narratives are Josh's words or are marked `TODO(josh)`.

### E.6 Icons and imagery

- Brand marks (GitHub, LinkedIn, YouTube, Spotify) from Simple Icons, used per each brand's guidelines, always with a text label or tooltip.
- Interface icons (menu, close, play, pause, external, download, copy) from Lucide via `lucide-react`, imported individually. No other icon set; replace Tabler imports in Aceternity code. No generated or hand-improvised illustrative icons anywhere.
- Imagery is real: Josh's photographs, Lumix footage, document covers rendered from the actual PDFs, real interface screens, real code. No stock photography in the portfolio. No decorative abstract images.

### E.7 Design-plan review against generic defaults

The first-pass direction proposed earlier in conversation used a warm cream background, an acid-lime highlighter, IBM Plex Mono for metadata and middle-dot "now" lines. Each of those is a common default of generated designs, so each was revised: the paper is a cool neutral rather than cream; the accent moved to tungsten amber, chosen because it is the one colour that reads as stage light on black and as a highlighter on paper; the monospace metadata face was dropped; and status lines are written as sentences. The black stage is pure `#000000` because it frames video and photography, not as a tinted near-black.

---

## F. Information architecture

### F.1 Routes

All routes are static HTML generated by Astro unless marked.

| Route | Purpose | In main nav |
| --- | --- | --- |
| `/` | Home, with the first-visit threshold | Logo link |
| `/work` | Index of everything: research, software, venture, music, writing; filterable | Work |
| `/work/[slug]` | One project, paper, dissertation, venture or release | |
| `/research` | Research subset of `/work`, presented as a document shelf with citations | Research |
| `/music` | Music page | Music |
| `/about` | The person: bio, education, experience (including Mercor), timeline, photos, CV | About |
| `/log` and `/log/[slug]` | Dated posts and updates | Footer and home |
| `/contact` | "What brings you here?" contact wizard; accepts `?intent=` | Button: "Start a conversation" |
| `/privacy` | Privacy notice | Footer |
| `/404` | Real 404 page | |
| `/demo/scb-handyman/` | The SCB site built as a static demo; `noindex`; framed by `/work/growtrades` | |
| `/admin/` | Sveltia CMS; `noindex`, disallowed in robots | |
| `/api/submit`, `/api/health` | Worker routes (dynamic) | |
| `/rss.xml`, `/sitemap-index.xml`, `/robots.txt` | Generated | |
| `/cv.pdf` | Josh's public CV | |

GrowTrades is a work item at `/work/growtrades` with a custom layout (section J). It is reachable from the homepage, from `/work`, and from the "A website for my business" intent. It does not need its own nav item.

### F.2 Navigation

- Desktop: name (link home) at left; Work, Research, Music, About; primary button "Start a conversation" at right. Active page indicated by an underline and `aria-current="page"`.
- On scroll the bar condenses (section N.2). The bar is ink-on-paper over paper sections and switches to fog-on-stage over stage sections so it never disappears against the background.
- Mobile: name and a menu button with a tooltip and label; the existing `MobileMenu` drawer behaviour (dialog semantics, focus trap, Escape, focus return, scroll lock), restyled. The "Start a conversation" button is always visible in the drawer and as a compact button in the bar.
- Footer: all nav links, Log, Privacy, RSS, GitHub, LinkedIn, YouTube, Spotify, email (with copy-to-clipboard button), "Change what brought you here" (clears the stored intent and returns to the threshold), and the year.

### F.3 How visitors discover work

1. The threshold routes each audience to the right section on the homepage.
2. Homepage sections each show a few items and link to the full list.
3. `/work` lists everything with filters (All, Research, Software, Venture, Music, Writing) and tags; filters update the URL query so a filtered view can be shared, and every item is present in the HTML so the page works without JavaScript.
4. Each work page links to related work (shared tags or explicit `related` references) and to posts about it.
5. `/log` is one chronological thread across all sides of Josh's life; each post links back to its project.
6. The contact wizard's result step recommends work relevant to the visitor's intent.

### F.4 How the different sides connect

Every content entry carries a `kind` (what it is) and `threads` (which sides of Josh it belongs to: `ai`, `research`, `software`, `venture`, `music`, `university`, `life`). The log and the about timeline interleave all threads chronologically, which shows the person without needing a metaphor. Explicit `related` links express the connections Josh wants to point out.

---

## G. Homepage specification

The homepage answers "Who is Josh Lennon?" in the first screen and lets each audience reach proof within one more scroll.

### G.0 Threshold (first visit only)

- **Surface:** stage, full viewport height (`100svh`), not a modal. It is the first section of the homepage's HTML.
- **Content:** `h1` "Josh Lennon" in STIX at display size; one factual sentence: "I studied Artificial Intelligence at the University of Manchester, I'm studying for an MSc in Artificial Intelligence at the University of Surrey, I founded GrowTrades, and I make music." The degree wording depends on discrepancy Y.6 item 1; until Josh confirms, keep it in `profile.yaml` behind the `TODO(josh)` guard. Then the question "What brings you here?" and five options set as large text rows (not cards), each with a short description:
  - I'm hiring: selected work, experience and my CV
  - Research: papers, my dissertation and experiments
  - A website for my business: GrowTrades and a live client site
  - Music: releases, videos and performances
  - Just looking around
- **Behaviour:** each option is a real link to its target section (`#selected-work`, `#research`, `#growtrades`, `#music`, `#intro`), so it works without JavaScript. With JavaScript, choosing an option stores the intent (`localStorage` key `jl:intent`, value plus timestamp), sets `data-intent` on `<html>`, runs the house-lights transition (N.1), scrolls to the target section and moves focus to its heading (`tabindex="-1"`).
- **Not a hard gate.** Scrolling past the threshold without choosing is allowed and is treated as "just looking". The threshold never appears on any route except `/`, never for visitors who have already chosen, and never blocks content for crawlers or screen readers. A recruiter following a link to `/work/kerr-microscopy-dissertation` lands on the dissertation, not on a question. This honours "answer this first" for people arriving at the front door without punishing anyone arriving from a link.
- **Returning visitors:** an inline script in `<head>` (under 1 kB, CSP-hashed) reads `jl:intent` before first paint and sets `data-intent`; CSS hides the threshold, so there is no flash and no layout shift. The intro section shows a small text button, "Not what you're after? Choose again", which clears the intent and reveals the threshold.
- **Data:** the intent choice never leaves the browser. Nothing is sent to the server at this step.

### G.1 Intro (`#intro`, paper)

Portrait photograph (eager, `fetchpriority="high"` when the threshold is hidden; this becomes the LCP element for returning visitors), a short bio in Josh's words (`TODO(josh)`), a "Now" list written as sentences from `profile.now` (for example "Studying for an MSc in Artificial Intelligence at the University of Surrey."), and two CTAs that depend on the stored intent. All five CTA sets are rendered in the HTML and selected by CSS on `html[data-intent]`, so there is no client rendering and no shift:

| Intent | Primary | Secondary |
| --- | --- | --- |
| hiring | Download CV (PDF) | Start a conversation |
| research | Read the research | Start a conversation |
| website | See GrowTrades | Talk about your website |
| music | Listen | Get in touch |
| none or looking | See selected work | Start a conversation |

### G.2 Selected work (`#selected-work`, paper)

Four featured entries (`featured: true`, ordered by `featuredOrder`). Each is a row: title, one-sentence summary, kind and year, Josh's role, and the evidence actions (for example "Read the paper (PDF, 2.1 MB)", "Code on GitHub", "Watch the demo"). The right side of each row shows the artefact itself: the PDF's first page, a frame from the video, the SCB site's screen. On desktop, hovering or focusing a row with a video artefact plays a muted preview in its thumbnail; on mobile, thumbnails are static and sit above the text. Link: "All work".

### G.3 Research (`#research`, paper)

A shelf of up to three documents, shown as covers rendered from page one of each PDF, with title, document type (paper, dissertation, report), date, page count, whether it is peer-reviewed, and a two-sentence abstract. Actions: "Read", "Download", "Cite". Link: "All research".

### G.4 GrowTrades (`#growtrades`, paper)

Two short paragraphs on what GrowTrades is and what Josh built for SCB Handyman (`TODO(josh)` for the narrative), and the browser frame holding a still of the SCB homepage with a "Try the live site" button (section J.4). Link: "Read the case study".

### G.5 Music (`#music`, stage, full-bleed)

The Lumix footage loop as background (section K.3) with a visible pause control, Josh's artist name, the latest release (artwork, title, year, a "Listen on Spotify" facade) and the latest music video (YouTube facade). Link: "Music".

### G.6 Outside work (paper)

Three captioned photographs: performing, badminton (university league doubles), and university. Captions are factual and specific (`TODO(josh)` for places and dates). On mobile they become a horizontal scroll-snap row with visible overflow and keyboard-reachable items. Link: "About me".

### G.7 Lately (paper)

The three most recent log posts across all threads: date, title, thread, one-line summary, thumbnail if present. Link: "All posts".

### G.8 Elsewhere (paper)

GitHub: contribution calendar for the last 12 months and up to four pinned repositories (section M), with "Updated" date from the build. LinkedIn: a card with Josh's headline and current roles from `profile.yaml` and a "View profile on LinkedIn" link. YouTube and Spotify links with their marks.

### G.9 Get in touch (stage band)

One sentence, the "Start a conversation" button, the email address with a copy button (optimistic "Copied" state with tooltip), and links to LinkedIn and GitHub.

### G.10 Footer

As in F.2.

---

## H. Project, research and post system

### H.1 Collections

Content lives in `apps/site/src/content/`, defined in `apps/site/src/content.config.ts` with Astro's content layer (`glob` loaders) and schemas from `astro/zod`. Do not import the wizard's Zod 3 into content schemas or vice versa; the two Zod versions coexist in separate packages.

| Collection | Location | One entry is |
| --- | --- | --- |
| `work` | `content/work/<slug>/index.mdx` plus co-located assets | A project, paper, dissertation, venture or release |
| `posts` | `content/posts/<yyyy-mm-dd>-<slug>/index.mdx` plus assets | A dated update, short or long |
| `profile` | `content/profile/profile.yaml` | Site-wide facts about Josh (single entry) |

Co-locating assets with each entry means one folder holds everything about a project, and Astro's image pipeline optimises any image referenced from frontmatter or MDX.

### H.2 Shared media schema

```ts
// apps/site/src/content/schemas/media.ts (sketch; adapt to the installed Astro API)
const credit = z.object({ owner: z.enum(['josh', 'external']), name: z.string().optional(), url: z.string().url().optional() })
  .refine(c => c.owner === 'josh' || (c.name && c.url), 'External media needs a credit name and source URL');

export const mediaItem = (image) => z.discriminatedUnion('type', [
  z.object({ type: z.literal('image'), src: image(), alt: z.string().min(1), caption: z.string().optional(), credit: credit.default({ owner: 'josh' }) }),
  z.object({ type: z.literal('youtube'), id: z.string().regex(/^[\w-]{11}$/), title: z.string(), start: z.number().int().optional(), playlist: z.string().optional() }),
  z.object({ type: z.literal('spotify'), url: z.string().url(), title: z.string() }),
  z.object({ type: z.literal('video'), name: z.string(), title: z.string(), captions: z.string().optional(), loop: z.boolean().default(false) }), // name refers to an encoded set in public/media/video/<name>/
  z.object({ type: z.literal('audio'), src: z.string(), title: z.string(), transcript: z.string().optional() }),
  z.object({ type: z.literal('document'), file: z.string(), title: z.string(), docType: z.enum(['paper', 'dissertation', 'report', 'slides', 'poster']), peerReviewed: z.boolean(), credit: credit.default({ owner: 'josh' }) }),
]);
```

### H.3 `work` schema

```ts
z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  kind: z.enum(['research', 'software', 'venture', 'music', 'writing']),
  threads: z.array(z.enum(['ai', 'research', 'software', 'venture', 'music', 'university', 'life'])).min(1),
  summary: z.string().max(220),                      // one or two sentences, used in lists and meta descriptions
  date: z.coerce.date(),                              // when the work was completed or published
  updated: z.coerce.date().optional(),
  status: z.enum(['complete', 'ongoing', 'archived']),
  featured: z.boolean().default(false),
  featuredOrder: z.number().int().optional(),
  role: z.string(),                                   // e.g. "Sole author", "Founder and engineer"
  authorship: z.object({
    type: z.enum(['sole', 'lead', 'contributor']),
    collaborators: z.array(z.object({ name: z.string(), role: z.string().optional(), url: z.string().url().optional() })).default([]),
    supervisor: z.string().optional(),
  }),
  context: z.object({ institution: z.string().optional(), programme: z.string().optional(), result: z.string().optional() }).optional(),
  cover: image().optional(), coverAlt: z.string().optional(),
  tags: z.array(z.string()).default([]),
  tech: z.array(z.string()).default([]),
  links: z.array(z.object({ type: z.enum(['github', 'live', 'demo', 'paper', 'video', 'spotify', 'other']), url: z.string(), label: z.string() })).default([]),
  documents: z.array(/* document media item */).default([]),
  media: z.array(mediaItem(image)).default([]),
  references: z.array(z.object({ text: z.string(), url: z.string().url().optional() })).default([]),
  related: z.array(reference('work')).default([]),
  layout: z.enum(['standard', 'case-study']).default('standard'),
  seo: z.object({ title: z.string().optional(), description: z.string().optional() }).optional(),
  draft: z.boolean().default(false),
}).refine(w => !w.cover || w.coverAlt, 'A cover image needs alt text')
```

Build-time checks (fail the build, with a message naming the file): any `document.file` that does not exist; any `featured` entry without `featuredOrder`; duplicate `featuredOrder`; any `related` reference to a draft; any image without alt text; and any `TODO(josh)` string in a non-draft entry during a production build (section T.4).

### H.4 `posts` schema

`title`, `date`, `summary` (max 220), `threads`, optional `project: reference('work')`, `tags`, `media` (same union), `draft`. A post with a body gets a page at `/log/[slug]`; a post with only a summary and media renders inline in lists and on its project page, and its page still exists for linking.

### H.5 `profile` schema

`name`, `alternateNames`, `artistName` (default "Josh Lennon"), `location`, `headline` (`role` plus a `focus` list, rendered as a sentence, never joined with pipes or dots), `availability` (optional sentence shown beside the intro CTAs and used by the hiring intent), `bioShort`, `bioLong` (Markdown), `skills` (named groups of plain strings), `portrait` (image and alt), `now` (array of sentences), `education` (institution, qualification, start and end years, result optional, `url`), `experience` (see below), `links` (github, linkedin, youtube, spotify, email), `cv` (file path, size computed at build), `photos` for the outside-work section (image, alt, caption, thread).

Experience entries:

```ts
z.object({
  title: z.string(), organisation: z.string(), employmentType: z.enum(['full-time', 'part-time', 'contract', 'founder', 'internship', 'placement', 'programme', 'volunteer']),
  start: z.string(), end: z.string().optional(),
  description: z.array(z.string()).max(4),
  confidential: z.boolean().default(false),
  links: z.array(z.object({ url: z.string().url(), label: z.string() })).default([]),
  images: z.array(image()).default([]),
}).superRefine((e, ctx) => {
  if (e.confidential) {
    if (e.employmentType === 'contract' && !e.title.endsWith('[Contract]')) ctx.addIssue({ code: 'custom', message: 'Confidential contract titles must end with "[Contract]"' });
    if (e.images.length || e.links.length) ctx.addIssue({ code: 'custom', message: 'Confidential roles cannot carry images or links' });
  }
});
```

The Mercor entry is `confidential: true`, `employmentType: 'contract'`, organisation "Mercor", title "AI Expert [Contract]" (from Josh's own description of the role; see Y.3 for the exact entry), and a description limited to statements Josh confirms are true of his work. It never names Mercor's client, never implies full-time employment, and never shows screenshots or examples.

### H.6 Page templates

**`/work/[slug]` (layout `standard`):**

1. Header: title, subtitle, kind, date, status, and an attribution line generated from `role`, `authorship` and `context` (for example "Sole author. BSc dissertation, University of Manchester. Awarded 76% (first class)."). Evidence actions row from `links` and `documents`.
2. Lead figure: the strongest artefact, chosen in this order: a demo frame, the first video, the first document's cover, the cover image.
3. Summary, then the MDX body (Josh's narrative).
4. Documents: one document card per file (section H.7).
5. Media: figures, video and audio, in authored order.
6. References: a numbered list when present.
7. A statement of authorship generated from data: own work, or own work with named collaborators, with external material credited where it appears. External media always shows its credit beside it (enforced by the schema).
8. Updates: posts whose `project` is this entry.
9. Related work.

**`/research`:** the documents of every `kind: research` entry as a shelf (covers, abstracts, metadata), each with "Cite" producing plain-text and BibTeX citations generated from metadata (`@misc` for papers and reports, `@thesis` with `type = {BSc dissertation}` for the dissertation). Peer-review status is always stated; nothing that is not peer-reviewed is called a publication.

**`/work`:** filter control (All, Research, Software, Venture, Music, Writing), then rows as on the homepage, newest first, featured items not duplicated. Filtering is client-side for instant response, mirrored in `?kind=`; without JavaScript all rows show grouped by kind.

**`/log`:** reverse-chronological list with thread filter; month headings.

### H.7 Documents (PDFs)

- PDFs live in the entry folder (or `public/documents/` if over a few MB) with clean, permanent, lowercase-hyphenated filenames. Old filenames with spaces and timestamps are renamed during migration.
- A build-time or authoring-time script renders page one to a cover image and records page count and file size (section T.3).
- Document card: cover, title, type, date, pages, size, peer-review status, actions "Read here" (desktop only; expands an inline viewer using the browser's native PDF viewer in an iframe, loaded on click), "Open" (new tab) and "Download". Mobile shows Open and Download only, because mobile browsers handle inline PDFs poorly.
- The page always carries an HTML abstract and key details, so the content is accessible and indexable even though PDFs may not be.

### H.8 Legacy content migration

Create these entries from Josh's previous posts. Text in quotes below is what his old site said and may be reused; everything else marked TODO needs his input.

1. `work/understanding-deep-learning` (kind research, threads ai and research, date 2025-09-17, documents: the paper, `peerReviewed: false`, `docType: 'paper'`). Summary based on the old post. The title shares its name with Simon J. D. Prince's 2023 MIT Press textbook, so set `subtitle` to a distinguishing subtitle supplied by Josh (`TODO(josh)`) and make sure the page states it is an independent expository paper. Include the paper's reference list if it has one (`TODO(josh)`).
2. `work/kerr-microscopy-dissertation` with title "Extracting magnetic information from image data" (kind research, threads ai, research, university; date 2025-08-11 unless Josh gives the submission date; context: University of Manchester, BSc dissertation, result "Awarded 76% (first class)" (the mark applies to the dissertation only, see Y.1); title per Y.6 item 2; authorship sole with supervisor `TODO(josh)`). Body draws on the old summary: an automated image-processing pipeline for Kerr microscopy with a web application interface. If Josh can share before/after images that he is allowed to publish, add a comparison figure (section N.8). Link the code repository if one exists (`TODO(josh)`).
3. `work/neural-network-from-scratch` merging both October 2023 posts (kind software, threads ai and software, date 2023-10-08): a neural network tool built in Visual Basic without libraries, structured as its own object-oriented framework, demonstrated on the Iris dataset; documents: the Iris report PDF (renamed); media: the YouTube testing playlist (`TODO(josh)` for the playlist id).
4. `work/growtrades` (kind venture, layout `case-study`; section J).
5. Music entries (`kind: music`), one per release or video Josh wants featured (`TODO(josh)`).
6. Mercor goes in `profile.experience`, not in `work`.

---

## I. The repurposed wizard: "What brings you here?"

### I.1 Decision

Of the candidates considered (a plain contact form; a brief builder; a recruiter "fit check"; a GrowTrades website health check for tradespeople; a demo of the original estimator), the chosen design combines a brief builder with a value-first result, and splits the first question out as the homepage threshold, as Josh asked. The original estimator is not discarded: it runs inside the SCB demo in the GrowTrades case study. The trades health check is deferred to a future GrowTrades site, because inside a personal portfolio aimed at recruiters and academics it would read as a sales funnel.

### I.2 Journey

1. **Intent.** Answered on the threshold (stored locally) or on `/contact` (if arriving there directly). `/contact?intent=hiring` or a stored intent skips the selector. The selector is a restyled version of the existing `ServiceSelector` pattern with plain-language options identical to the threshold.
2. **Two or three short questions** specific to the intent (I.3).
3. **Your result.** A new `content-result` step shows what on the site is most relevant to the visitor's answers, drawn from content at build time (I.4), plus a direct action (for example "Download CV (PDF)"). The visitor gets something useful before giving any personal data. Two buttons: "Send Josh a message" (continue) and "Keep exploring" (leaves the wizard; answers are kept in sessionStorage).
4. **Your details.** Name, email, optional organisation, message, and the required data-processing consent checkbox with a link to `/privacy`. Turnstile renders here and gates both submit buttons, as today.
5. **Optional details** with "Skip and send" (existing `allowSkip` behaviour): for example "Anything else I should know?" and a preferred reply window.
6. **Sent.** Success screen with the reference, the address Josh will reply to, and links back into the site. Duplicate submissions within 24 hours get the existing duplicate copy, rewritten: "I already have a message from you today. I'll reply to both together."

No photo upload, no phone number (optional at most), no address, no postcode.

### I.3 Intent configurations

Each intent is a `WizardConfig` with `quoteMode: 'manual'` registered in a new closed registry `apps/site/src/wizard/intents.ts` (same pattern as `verticals.ts`). Draft questions; Josh can edit labels freely because ids are the contracts.

| Intent id | Questions | Result selection |
| --- | --- | --- |
| `hiring` | What kind of work? (AI engineering, LLM evaluation, AI automation, agentic AI, something else; these come from Josh's CV); What kind of arrangement? (full-time, graduate scheme, contract, research position); Organisation (optional text); Link to the role (optional text, URL-format validated if present) | Featured work (dissertation, GrowTrades, agentic risk-assessment prototype if evidence exists, deep learning paper), experience summary, CV download |
| `research` | What's this about? (a collaboration, a question about one of my papers, academic opportunity, speaking or writing, something else); Which piece of work? (optional text) | All `kind: research` entries, newest first |
| `website` | What kind of business? (trades or home services, another local business, something else); Do you have a website now? (yes, no, it needs replacing); What matters most? (more enquiries, instant quotes for customers, showing up on Google, a new site; multi-select) | The GrowTrades case study and the live SCB demo |
| `music` | What's this about? (booking or a gig, a collaboration, licensing or sync, just saying hello) | Latest music entries and the Spotify artist link |
| `other` | What would you like to talk about? (required textarea) | Featured work |

Field ids for contact data are `contact_name`, `contact_email`, `organisation`, `message`, `data_processing_consent`, so the ported duplicate detector and consent validator work unchanged.

### I.4 The `content-result` step kind

Added to the engine following the pattern in ADR-0024 (new step kinds), as an additive change:

```ts
export const ContentResultStepSchema = z.strictObject({
  stepKind: z.literal('content-result'),
  id: idSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  condition: ConditionSchema.optional(),
  selection: z.enum(['featured', 'research', 'venture', 'music']),
  continueLabel: z.string().min(1),
  exitLabel: z.string().min(1),
});
```

- `AnyStepSchema`, the step guard functions, navigation, `StepRenderer` and validation treat it like `estimate-display`: no fields, always valid, Next continues, the exit button calls an injected `onExit` handler.
- The engine stays content-agnostic. The renderer reads items from a `ContentResultsContext` provided by the site island; the site passes a serialised content index (title, summary, kind, url, cover thumbnail URL, document actions) as island props, computed at build time by a pure function `selectResultItems(selection, index)` with unit tests.
- New tests: schema acceptance and rejection, navigation through the step, renderer item selection (pure function), and the existing suites unchanged.

### I.5 Submission

- Endpoint: `POST /api/submit` on the same origin. Port: the existing `httpSubmissionPort` with the endpoint URL made configurable and the nonce header optional (send nothing when there is no nonce). Same wire payload and contract version, so the server contract stays documented in one place.
- Persistence: `sessionStorageAdapter`, keyed by intent, cleared on success (existing behaviour).
- Bot protection: existing honeypot and Turnstile decoration, with the site key passed in through the environment context (I.6).

### I.6 Engine refactors needed (additive, test-covered)

1. `WizardEnvironmentContext` providing `turnstileSiteKey` and an optional `turnstileAction` (the portfolio sets `contact-submit`, which the Worker verifies), defaulting to the current `config-loader` value and no action so the SCB build behaves exactly as now; `TurnstileWidget` and `StepRenderer` read from it.
2. `WizardCopyContext` providing the strings in `SuccessScreen`, `FailureScreen`, `SubmittingScreen` and selector headings, defaulting to the current SCB strings.
3. The `content-result` step kind (I.4).
4. An exported `theme-contract.ts` listing every semantic token name the components use (colours, spacing, font sizes, radii, shadows, motion), so the site's Tailwind preset can be type-checked as implementing all of them (section U.4).
5. `httpSubmissionPort` accepts `{ endpointUrl, restNonce?: string }` in addition to the current options (backwards compatible).

The portfolio's wizard orchestrator is a new component, `apps/site/src/islands/ContactWizard.tsx`, adapted from `QuotePage.tsx`. It takes props (intent registry, content index, site key, endpoint) instead of reading `window.GOQW_CONFIG`, uses `preSteps: []`, and is mounted with `client:only="react"` and an Astro-rendered skeleton fallback that matches the wizard's first screen exactly.

---

## J. GrowTrades presentation

### J.1 Story

GrowTrades is Josh's venture: lead-generation websites for local trades businesses, built as a reusable product (React quote wizard, WordPress plugin, automation). SCB Handyman (Shane, Guildford, Surrey) is the first client and has given permission for his business name and branding to be used. The case study tells what the product does, what Josh built, and how it was engineered, and lets the visitor use the real client site.

Do not state results (rankings, enquiries, revenue) unless Josh supplies them and confirms Shane is happy for them to be published. The metrics in the deleted agency docs must not be used without that confirmation.

### J.2 Page structure (`/work/growtrades`, layout `case-study`)

1. Header: "GrowTrades", Josh's role ("Founder"), status (ongoing), dates (`TODO(josh)`), and one sentence on what it is.
2. **The live site** (Fig. 1): the browser frame with the SCB demo (J.4). Caption states that this is the real client site running in demo mode and that nothing entered is sent anywhere.
3. What the product does: the visitor journey from instant estimate to the owner's notification, told in prose with figures: the estimator, the Google Sheet row (screenshot with test data only), the owner's WhatsApp notification (screenshot with test data only, `TODO(josh)`).
4. **Under the hood** (sticky scroll, N.5): the submission pipeline as a sequence of real steps (honeypot, rate limit, Turnstile, consent, duplicate detection, persist before forward, formula-injection sanitising, forward, retention), each paired with the real artefact: a short code excerpt from this repository or the ADR that records the decision.
5. Engineering evidence, stated only as verified facts: the TypeScript test count from the current gate run, the PHP test count as recorded at Step 6.7, PHPStan level 8, 38 ADRs, the config-driven engine supporting 12 services. Each figure links to its source in the repo if the repo is public.
6. What's next for GrowTrades (`TODO(josh)`, optional).
7. "Talk about your website" button opening `/contact?intent=website`.

### J.3 The SCB demo build

Built from `apps/wizard` with a new Vite mode `demo`:

- `base: '/demo/scb-handyman/'`, output to `apps/site/public/demo/scb-handyman/` (gitignored; produced by the root build before the site build).
- A static `index.html` for the demo that sets `window.GOQW_CONFIG` with `restUrl: ''`, so `QuotePage` uses its existing development submission port, plus `<meta name="robots" content="noindex">`.
- **Memory router mode.** `Link` and `SiteApp` support a router mode chosen at build time (`import.meta.env.VITE_ROUTER_MODE`). In `memory` mode, navigation updates React state instead of `history.pushState`, so the iframe's URL never changes and deep links are not needed. On every navigation the demo posts `{ type: 'scb-demo:navigate', path }` to `window.parent` with `targetOrigin` set to its own origin. Unit-test the mode switch as a pure function.
- **Demo banner and copy.** A slim, persistent banner inside the demo reads "Demo of the SCB Handyman site. Nothing you enter is sent anywhere." The success screen copy, via `WizardCopyContext`, says the same. Photos selected in the demo stay in the browser.
- **Images.** Keep every SCB image; Josh has permission for all of them and the filenames are arbitrary. Re-encode oversized ones in place (same filename, same dimensions) so the demo stays light; the plumbing hero is 1.3 MB.
- **Domain shown in the frame:** `scbhandyman.co.uk` (taken from the business email in the code; `TODO(josh)` to confirm).

### J.4 Browser frame component

`apps/site/src/islands/SiteFrame.tsx`, custom-built (the scroll reveal around it uses Aceternity, see N.4).

- **Facade first.** The frame initially shows a still of the SCB homepage (AVIF, generated from the demo by a Playwright screenshot script) and a "Try the live site" button. No demo JavaScript or images load until that click.
- **Desktop:** on click, an iframe loads `/demo/scb-handyman/` at a true 1280 px viewport, scaled with a CSS transform to fit the frame. A viewport toggle switches between Desktop (1280) and Mobile (390), with tooltips. The fake address bar shows `scbhandyman.co.uk` plus the path received from the demo's `postMessage` (validate `event.origin` and `event.source`). While the iframe loads, a skeleton of the SCB homepage layout fills the frame; it swaps on the iframe's `load` event. An "Open in a new tab" link is always present.
- **Mobile:** the frame is a phone outline showing the still. "Try the live site" opens a full-screen dialog (existing `useFocusTrap`, Escape and a visible close button return focus to the trigger) containing the iframe at the device's own width, so the visitor scrolls the demo natively without fighting the page scroll.
- **Headers:** `/demo/*` is served with `X-Frame-Options: SAMEORIGIN` and `frame-ancestors 'self'`; everything else with `DENY` / `'none'`.
- Accessibility: the iframe has a descriptive `title`; the facade button describes what will load; the dialog has a label; keyboard users can tab into and out of the iframe.

---

## K. Music experience

### K.1 Page (`/music`, stage)

1. Hero: full-bleed footage loop (K.3) with the artist name in STIX and a pause control.
2. Releases: each release as artwork, title, year, and a Spotify facade ("Play on Spotify" loads the official embed on click). `TODO(josh)`: Spotify artist URL and the releases to feature.
3. Videos: YouTube facades in a two-column grid on desktop and a single column on mobile; each opens in place on click using `youtube-nocookie.com`.
4. Live and in the studio: photographs with captions.
5. Credits where relevant (for example who shot or edited a video), only from Josh's information.
6. Links: Spotify, YouTube, and "Get in touch" with `?intent=music`.

### K.2 Facades

Custom components, not third-party libraries:

- **YouTube:** at build time, fetch the video's title via YouTube oEmbed and download its thumbnail into the build (optimised to AVIF and WebP), so nothing is requested from Google until the visitor clicks. The facade is a real `<button>` labelled "Play video: {title}". On click, insert the `youtube-nocookie.com` iframe with `autoplay=1` and move focus into it. A small note under the facade reads "Plays from YouTube."
- **Spotify:** same pattern using Spotify oEmbed for title and artwork; on click insert the official embed iframe.
- If oEmbed fails at build time, use the title in frontmatter and a still from Josh's own footage; never fail the build for this.

### K.3 Footage loop

- Source: Josh's Lumix S5 footage. Encoding happens on his machine with the script in T.3 (ffmpeg), because the source is large.
- Output set per loop in `apps/site/public/media/video/<name>/`: `1080.av1.mp4`, `1080.h264.mp4`, `720.av1.mp4`, `720.h264.mp4`, optional `portrait-720.av1.mp4` and `portrait-720.h264.mp4` (a vertical crop for phones in portrait, if the composition allows), `poster.avif`, `poster.jpg`. Loop length 8 to 15 seconds, no audio track, constant frame rate, `+faststart`. Targets: 1080 AV1 about 3 MB or less, 1080 H.264 about 6 MB or less; every file must stay under Cloudflare's per-asset size limit (25 MiB).
- Component `FootageLoop` (custom): renders the poster as an `<img>` immediately (correct dimensions, no layout shift). It attaches sources only when the section is within one viewport of the screen, picks the variant in JavaScript (`matchMedia` for orientation and width; AV1 listed first with a codecs string, H.264 second), plays when at least half visible, pauses when not, and always shows a pause/play button with a tooltip. It never autoplays under `prefers-reduced-motion`, when `navigator.connection.saveData` is true, or on 2G/3G effective connection types; those visitors see the poster with a "Play" button. Attributes: `muted`, `playsinline`, `loop`, `preload="none"`, `disablepictureinpicture`. Decorative loops are `aria-hidden` with the pause button still reachable.

---

## L. Personal identity

- **Intro and About lead with Josh's own words.** The about page holds the long bio (`TODO(josh)`), education (Manchester BSc in Computer Science and Artificial Intelligence; Surrey MSc in Artificial Intelligence, with years from Josh), experience (GrowTrades as founder; Mercor as a confidential contract role per H.5; anything else Josh adds), and the CV download.
- **Timeline:** the about page shows one vertical timeline interleaving education, experience, work and posts across all threads, newest first (N.9).
- **Skills without decoration:** no skill bars, percentages or logo walls. The about page shows Josh's technical skills from his CV as three plain grouped lists (section Y.4). Any skill that appears in a work entry's `tech` field links to that work, so the list doubles as an index of evidence.
- **Photography:** performing, badminton (university league doubles; which university and team is `TODO(josh)`), university and studio photos, each with a specific caption. They appear because they say something true about him, not as decoration.
- **Music and technical work are cross-linked**, for example a music video's page credits the editing and shooting he did himself if he says so.

---

## M. GitHub and LinkedIn

### M.1 GitHub (real data, fetched at build)

- Build-time module `apps/site/src/lib/github.ts` fetches, for the username `awkwardapples` (confirmed by Josh): profile (avatar, name, public repo count), pinned repositories (GraphQL `pinnedItems`: name, description, primary language, stars, last pushed), and the contribution calendar for the last 12 months (GraphQL `contributionsCollection`).
- Token: `GITHUB_TOKEN` in the build environment, a fine-grained personal access token with read-only access to public data. Never exposed to the browser.
- Caching: write the result to `apps/site/src/data/github.snapshot.json` on success. If the API fails or no token is set, use the last snapshot and log a warning; the build never fails because GitHub is unavailable. A scheduled daily build (section U.5) refreshes it.
- Rendering: the calendar as a grid of discrete squares in five steps from `rule` to `ink` on paper (no gradient), with an accessible summary ("{n} contributions in the last year") and a visually hidden table alternative; repos as rows linking to GitHub; an "Updated {date}" note.
- Avatar is downloaded and optimised at build time; no runtime requests to GitHub.

### M.2 LinkedIn

- A card rendered from `profile.yaml`: name, LinkedIn headline (Josh's exact wording), current roles, and "View profile on LinkedIn". It must not imitate LinkedIn's interface or show follower counts or endorsements.
- On desktop, the LinkedIn and GitHub links in prose may use Aceternity's Link Preview in its static-image mode, showing a screenshot Josh provides of his own profile; on touch devices it is a plain link. Skip this if Josh does not supply screenshots.

---

## N. Animation and interaction specification

Principle: one orchestrated moment (the threshold), a small number of scroll-linked moments where scrolling genuinely reveals something, and otherwise motion only in response to the visitor's actions. No fade-and-slide-up on every section, no hover animation on every card, no parallax for its own sake. All durations and easings come from the existing motion tokens. Global reduced-motion CSS from `apps/wizard/src/styles/index.css` is carried into the site (zero durations and delays).

| # | Interaction | Purpose | Trigger and behaviour | Mobile | Reduced motion | Performance | Source |
| --- | --- | --- | --- | --- | --- | --- | --- |
| N.1 | Threshold "house lights up" | Marks entry into the site and routes by intent | Choosing an option: the chosen row holds, the others fade, the stage background yields to paper over about 600 ms, then the page scrolls to the target section. Uses the View Transitions API (`document.startViewTransition`) where supported; a plain class swap elsewhere | Same, shorter (about 400 ms) | Instant swap, then jump to section | CSS only plus under 2 kB of script; no library | Custom |
| N.2 | Condensing navbar | Keeps navigation present without covering content | After 8 px of scroll the bar reduces height and gains a hairline border; colour follows the surface beneath (paper or stage) using an IntersectionObserver on stage sections | Compact bar from the start; drawer menu | No transition, state still changes | Passive listeners, one observer | Behaviour from existing `useHeaderScrollState`; visual approach may borrow from Aceternity Resizable Navbar, rebuilt without blur and with existing accessibility |
| N.3 | Selected-work previews | Show the artefact, not a card | Hover or focus on a row with a video artefact plays its muted preview; leaving pauses | Static thumbnail | Static thumbnail | Preview video loads on first hover only | Custom |
| N.4 | GrowTrades frame reveal | The client site arrives as the main exhibit | As the section scrolls into view the browser frame rotates from a slight tilt to flat and scales to full size; once flat it stays flat. The live iframe only loads on click, never during the animation | No tilt; phone frame | Flat from the start | Transform and opacity only; island hydrates on visible | Aceternity Container Scroll Animation, restyled to tokens, titles removed in favour of the page's own heading |
| N.5 | Under the hood | Pair each pipeline step with its real artefact | Left column of steps scrolls normally; right panel is sticky and swaps to the artefact for the step in view (code excerpt, ADR excerpt) | Stacked: each step followed by its artefact; nothing sticky | Same as desktop without cross-fade | Text content, no heavy media | Aceternity Sticky Scroll Reveal, with its gradient backgrounds removed and content as real semantic sections |
| N.6 | Footage loop | Josh's footage as the music section's atmosphere | Section K.3 | Portrait variant if available | Poster with Play button | Lazy sources, pause off-screen | Custom |
| N.7 | Video and Spotify facades | Zero third-party cost until asked | Click swaps poster for embed and focuses it | Same | Same | Nothing loads before click | Custom |
| N.8 | Before/after comparison (dissertation) | Show the image-processing result directly | Drag or keyboard-control a divider between raw and processed Kerr images | Touch drag; full-width | No animation; divider still works | Two optimised images | Aceternity Compare, restyled, sparkles removed, with a native `<input type="range">` driving it for keyboard and screen-reader access. Only if publishable images exist |
| N.9 | About timeline | One chronological thread across all sides | A thin tungsten line fills as the visitor scrolls the timeline; entries are plain semantic list items | Same, single column | Line shown full, no fill animation | One scroll listener via motion's `useScroll` | Aceternity Timeline, gradient beam replaced with a flat line |
| N.10 | Link previews | Let readers check GitHub or LinkedIn before leaving | Hover or focus on specific links shows a static screenshot | Disabled; plain link | No animation | Static images only, no live screenshot service | Aceternity Link Preview, static mode only |
| N.11 | Document "Read here" | Read a PDF without leaving | Card expands to an inline viewer; Close collapses | Not offered | Instant | Iframe created on click | Custom |
| N.12 | Wizard steps | Existing step transitions | Unchanged engine behaviour; restyled | Unchanged | Unchanged | Unchanged | Existing |
| N.13 | Copy email | Small confirmation | Click copies, button label changes to "Copied" immediately (optimistic), tooltip announces it via a polite live region; reverts after 2 s; on clipboard failure shows "Press Ctrl+C to copy" with the text selected | Same | Same | None | Custom using the existing Tooltip |
| N.14 | Work filters | Instant filtering | Segmented control updates rows instantly and the URL query | Horizontally scrollable control | Instant | Client-side over pre-rendered rows | 21st.dev segmented control adapted to tokens, or the existing Button primitive |
| N.15 | Photo lightbox | Look closer at photographs | Click opens a dialog with the full image and caption; arrows and Escape | Swipe and close button | No zoom animation | Full image loads on open | 21st.dev lightbox adapted, or custom on `useFocusTrap` |
| N.16 | Audio post player | Play audio in posts | Native `<audio controls preload="none">` styled to tokens; a custom skin is allowed only if it keeps native keyboard behaviour | Native controls | n/a | Loads on play | Native, optionally a 21st.dev player skin |

`motion` (the Framer Motion successor that Aceternity uses) is allowed only inside islands that need it (N.4, N.5, N.8, N.9), using `LazyMotion` with the smallest feature set, and those islands hydrate with `client:visible`. The homepage's initial JavaScript must not include `motion`.

---

## O. Responsive design

Breakpoints follow the existing token scale; design mobile first.

| Area | Phone (under 640 px) | Tablet (640 to 1023 px) | Desktop (1024 px and up) |
| --- | --- | --- | --- |
| Navigation | Name, compact "Start a conversation" button, menu button opening the drawer | Same as phone, or inline links if they fit without wrapping | Inline links and button; condensing bar |
| Threshold | Name about 56 to 72 px; options as full-width rows with 48 px minimum touch height | Larger type | Largest type; options in one column at reading width |
| Work rows | Thumbnail above text | Thumbnail beside text | Thumbnail beside text with hover previews |
| Research shelf | One document per row | Two columns | Three columns |
| GrowTrades | Phone frame, full-screen dialog demo | Tablet frame, inline demo scaled | Browser frame with scroll reveal, inline demo, viewport toggle |
| Music loop | Portrait variant if present, else centred crop via `object-fit: cover` and a focal point | Landscape 720 | Landscape 1080 |
| Under the hood | Stacked | Stacked | Sticky two-column |
| Photos | Horizontal scroll-snap row | Grid of three | Grid of three |
| Forms | Full width, 16 px minimum input font (prevents iOS zoom), sticky action bar above the keyboard is not used; actions follow the fields | Same | Reading-width column |
| Footer | Stacked groups | Two columns | Four columns |

Rules: no horizontal page scroll at 320 px; tap targets at least 44 by 44 px; hover is never the only way to reach content; viewport units use `svh` and `dvh` where the mobile browser chrome matters; test at 320, 375, 390, 768, 1024, 1280 and 1440 px.

---

## P. Performance

### P.1 Budgets (checked in CI on the homepage, a work page, `/music` and `/contact`)

| Metric | Budget |
| --- | --- |
| Largest Contentful Paint (simulated mid-range phone, 4G) | 2.0 s or less |
| Cumulative Layout Shift | 0.05 or less |
| Interaction to Next Paint | 200 ms or less |
| Homepage initial JavaScript (gzip, excluding islands that hydrate on visible) | 40 kB or less |
| `/contact` JavaScript (gzip) | 120 kB or less |
| Homepage bytes before any video loads | 500 kB or less |
| Lighthouse performance score on mobile preset | 95 or more for home and work pages |

### P.2 Loading model

- Static HTML everywhere. Islands hydrate only when needed: `client:visible` for below-the-fold interactions, `client:idle` for the navbar's enhancements, `client:only="react"` with a layout-matched skeleton for the wizard.
- Astro prefetch for internal links on hover and when links enter the viewport on fast connections, so page changes feel instant. Cross-document View Transitions (`@view-transition { navigation: auto; }`) give seamless page changes in supporting browsers with no JavaScript.
- Fonts: two variable WOFF2 files, Latin subset, preloaded selectively, `font-display: swap`, metric-matched fallbacks (`size-adjust`) to avoid layout shift.
- Images: Astro `<Picture>` with AVIF and WebP, explicit widths and `sizes`, intrinsic dimensions always set, `loading="lazy"` except the LCP image, `decoding="async"`, and a flat dominant-colour background computed at build time as the placeholder (no blur-up).
- Third parties: nothing loads from another origin on first view except Cloudflare's Web Analytics beacon (deferred). YouTube, Spotify and Turnstile load only when needed.

### P.3 Caching

- `/_astro/*` and other hashed assets: `Cache-Control: public, max-age=31536000, immutable`.
- HTML: `public, max-age=0, must-revalidate` (Cloudflare serves from its edge and revalidates on deploy).
- Media under `/media/` and documents: `public, max-age=604800` with filename versioning when a file changes.
- Client state that should survive: the intent in `localStorage`; wizard drafts in `sessionStorage` (existing adapter); work filter in the URL.

### P.4 Skeletons and optimistic UI

- No spinners anywhere (lint rule: fail on class names or components containing "spinner" or "loader" with rotation animations; implement as a simple grep check in CI).
- Skeletons exactly mirror the final layout for: the wizard before hydration (existing `HydratingScreen`), the SCB demo frame while the iframe loads, the inline PDF viewer while loading. Static content needs no skeletons because it arrives as HTML.
- Optimistic UI: intent selection, filters, copy-to-clipboard and wizard step navigation update instantly. Form submission does not pretend to succeed: it shows the existing submitting state (no spinner) and then the real result, because a visitor who leaves on a false success would lose their message.

---

## Q. Security and privacy

### Q.1 Immediate actions (before Pass 1)

Josh, manually:

1. In Make.com, delete the webhook whose URL is in `docs/Agency Docs/Technical Onboarding.IPYNB` and create a new one. Treat the old URL as public. Update the SCB WordPress site with the new URL if that scenario serves it.
2. Check the sharing settings of the Google Sheet linked in the same notebook; restrict it to named people.
3. Decide repository visibility. Recommended: make the repo private now, run the history scrub below, then make it public again so the code can be cited as evidence.

Claude Code (Pass 0):

4. Remove `docs/Agency Docs/` and scrub it from history with `git filter-repo --path "docs/Agency Docs" --invert-paths`, then force-push (Josh must approve the force-push). Search history again for `hook.eu1.make.com/` followed by a long token and for any Turnstile secret pattern; report findings without printing secrets.
5. Move the three unique SCB brand files out of `Media/` (see the table in B.1), then delete `Media/` and the root clutter. If `Media/` has already been deleted, restore those three files with `git checkout <last-commit-before-pass-0> -- "Media/backgroundless logo.png" "Media/84f8df2b-be09-4587-a51c-ab38ec42f4e3.png" Media/scb-og-image-1200x630.jpg` and then move them. Never delete or replace the images in `apps/wizard/src/assets/images/`.

### Q.2 What remains, what changes

| Protection | Fate |
| --- | --- |
| Honeypot (silent 400) | Kept, same behaviour |
| Per-IP rate limit, 5 per hour, fixed window, recorded only when allowed | Kept; key is an HMAC-SHA-256 of `CF-Connecting-IP` with a secret salt instead of the raw IP; stored in D1 with expiry |
| Turnstile verification | Kept; additionally checks that `hostname` in the siteverify response matches the site's hostname and that the token's `action` matches `contact-submit` |
| CSRF protection via WordPress nonce | Replaced by an `Origin` check (must equal the configured site origin; `Sec-Fetch-Site: same-origin` accepted as an alternative) plus requiring `Content-Type: application/json` |
| Shape validation | Kept, plus full server-side answer validation using the same `WizardConfig` and `validateStep` logic imported from the engine; unknown intents, unknown keys and over-long strings are rejected |
| Request size limit | New: 16 kB maximum body; 413 otherwise |
| Consent enforcement | Kept: `data_processing_consent` must contain `agreed`; consent timestamp stored |
| Duplicate detection (24 h, normalised email) | Kept; phone normalisation retained if a phone field is ever added |
| Persist before forward | Kept, in D1 |
| Formula-injection sanitising of the outbound copy | Kept, ported with its test cases |
| Forwarding | Changed: the response returns after the row is persisted; forwarding to Make.com runs in `ctx.waitUntil`, and a cron trigger every 15 minutes retries rows still pending (up to 5 attempts, exponential back-off). This supersedes ADR-0005's synchronous forward for this repo: a portfolio enquiry is safe once stored, so the visitor should not see a notification failure |
| Webhook authenticity | New: Worker sends `X-Webhook-Secret`; the Make.com scenario's first filter rejects requests without the matching value |
| Retention | Kept: submissions pruned after 90 days and expired rate-limit rows pruned by a daily cron |
| Photo upload and media validation | Removed from the portfolio endpoint (no file uploads accepted) |
| Output escaping | React escapes by default; no `set:html` or `dangerouslySetInnerHTML` with content from visitors anywhere |

### Q.3 Worker endpoint contract (`apps/edge`)

Responses keep the shape the client port already understands:

| Case | Status | Body |
| --- | --- | --- |
| Success | 200 | `{ reference, isDuplicate? }` where reference is `JL-` plus 8 random base32 characters (not a sequential id) |
| Malformed JSON, failed validation, honeypot | 400 | `{ errorCode: 'validation_failed' }` |
| Consent missing | 400 | `{ errorCode: 'consent_required' }` |
| Bad origin or content type | 403 | `{ errorCode: 'unauthorized' }` |
| Turnstile missing or invalid | 403 | `{ errorCode: 'bot_verification_failed' }` |
| Body too large | 413 | `{ errorCode: 'payload_too_large' }` |
| Rate limited | 429 | `{ errorCode: 'rate_limited', retryAfterSeconds }` |
| Persistence failure | 500 | `{ errorCode: 'persistence_failed' }` |

Webhook payload sent to Make.com: the existing documented contract (`submission_id`, `wizard_id`, `schema_version`, `quote_mode`, `answers`, `pricing: null`, `media: null`, `client_timestamp`) plus `reference` and `intent_label`, so the existing scenario's data structure needs only new Sheet column mappings.

D1 schema (sketch):

```sql
CREATE TABLE submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL UNIQUE,
  intent TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  answers_json TEXT NOT NULL,
  contact_email_norm TEXT,
  is_duplicate INTEGER NOT NULL DEFAULT 0,
  duplicate_of INTEGER,
  consent_given INTEGER NOT NULL,
  consent_timestamp TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',      -- pending | forwarded | forward_failed | duplicate_not_forwarded
  forward_attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_submissions_email_created ON submissions (contact_email_norm, created_at);
CREATE INDEX idx_submissions_status ON submissions (status, next_attempt_at);
CREATE TABLE rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL);
```

Secrets (via `wrangler secret put`, never in the repo): `MAKE_WEBHOOK_URL`, `MAKE_WEBHOOK_SECRET`, `TURNSTILE_SECRET_KEY`, `RATE_LIMIT_SALT`. Plain variables: `SITE_ORIGIN`, `RATE_LIMIT_PER_HOUR` (5), `RETENTION_DAYS` (90), `TURNSTILE_EXPECTED_HOSTNAME`. The public Turnstile site key is injected into the site build as `PUBLIC_TURNSTILE_SITE_KEY`. A new Turnstile widget is needed for the new domain; the site key in the old tests belongs to the SCB deployment.

Tests: port every PHP test case for `BotProtection`, `RateLimiter`, `DuplicateDetector`, `ConsentValidator`, `InputSanitizer` and `SubmissionController` into Vitest against the Worker modules (pure functions plus a D1 test harness from `@cloudflare/vitest-pool-workers`, or an in-memory adapter behind a small repository interface). Use Cloudflare's documented Turnstile test keys in tests and local development (the "always passes" and "always fails" pairs).

### Q.4 HTTP headers (`apps/site/public/_headers`)

For all paths: `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying camera, microphone, geolocation and payment, `X-Frame-Options: DENY`, and a Content Security Policy. Use Astro's built-in CSP support for script and style hashes (verify the current API), and set the rest by header:

```
default-src 'self';
script-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com;
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
media-src 'self';
font-src 'self';
connect-src 'self' https://cloudflareinsights.com;
frame-src 'self' https://challenges.cloudflare.com https://www.youtube-nocookie.com https://open.spotify.com;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
object-src 'none';
```

`'unsafe-inline'` for styles is accepted because `motion` and React style attributes need it; scripts get no such exception. Override for `/demo/*`: `X-Frame-Options: SAMEORIGIN` and `frame-ancestors 'self'`, plus `X-Robots-Tag: noindex`. `/admin/*`: `X-Robots-Tag: noindex` and a CSP that allows what Sveltia CMS needs (GitHub API), scoped to that path only.

### Q.5 Privacy and UK GDPR

- Rewrite `/privacy` for Josh as an individual controller: what is collected (only what the visitor types into the contact wizard; the intent choice that stays in their browser; cookieless analytics), why (to reply), lawful basis (consent for the enquiry), processors (Cloudflare for hosting, storage and bot checks; Make.com for automation; Google for the Sheet and email), retention (90 days in D1; Josh's own retention for the Sheet and inbox, stated), rights and how to exercise them, and how to complain to the ICO. Josh should check whether the ICO data protection fee applies to him (the ICO has a short self-assessment); this spec is not legal advice.
- No cookie banner is needed if analytics stay cookieless and embeds stay behind click-to-load facades. Note the localStorage intent in the privacy notice.
- `docs/data-protection.md` (runbook for Josh): how to export or delete a person's data from D1 (`wrangler d1 execute` with parameterised statements), the Sheet and the inbox; how to rotate secrets; what to do if a secret leaks.
- Photographs: strip EXIF metadata (including GPS) on ingest (T.3). Photos of other people (bandmates, badminton partners, classmates) need their agreement before publication; captions should not name people without it.
- The CV published at `/cv.pdf` should not contain a home address or personal phone number.

---

## R. Accessibility

Target WCAG 2.2 AA throughout.

- **Semantics:** one `h1` per page; headings in order; landmarks (`header`, `nav` with label, `main`, `footer`); lists for lists; `figure` and `figcaption` for figures; `time` with `datetime` for dates; buttons for actions and links for navigation.
- **Keyboard:** everything reachable and operable; visible focus on every interactive element using the focus tokens; skip link to `#main` (existing `SkipLink`); no keyboard traps except intentional dialog traps with Escape; the threshold options, filters, facades, frame controls, timeline and comparison slider all work by keyboard.
- **Focus management:** after a threshold choice, focus moves to the target section heading; dialogs move focus in and restore it on close (existing pattern); after wizard step changes, focus moves to the step heading (verify existing behaviour and add if missing).
- **Forms:** labels always visible; help text tied with `aria-describedby`; errors announced with `role="alert"` or a polite live region and linked to fields; required fields marked in text, not only with an asterisk; consent checkbox label links to the privacy notice; Turnstile's own accessibility is acceptable, and its failure state gives a retry path.
- **Colour and contrast:** text at least 4.5:1 (large text 3:1); control boundaries and focus indicators at least 3:1; never colour alone to convey state. A unit test asserts the token pairs used for text and controls meet these ratios.
- **Motion:** respect `prefers-reduced-motion` everywhere (global CSS rule plus per-component checks); the footage loop has a pause button; nothing flashes more than three times per second.
- **Media:** every image has meaningful alt text or is marked decorative; music videos and any spoken video need captions on YouTube or WebVTT for self-hosted video; audio posts with speech need transcripts (schema field present); the footage loops are decorative and silent.
- **Embeds:** iframes have descriptive titles; facades are real buttons with descriptive labels.
- **Screen readers:** the GitHub calendar has a text summary and a hidden table; the comparison slider exposes its value; icon-only buttons have labels and tooltips (existing `IconButton` and `Tooltip`).
- **Testing:** Playwright with `@axe-core/playwright` on every route at phone and desktop widths, zero serious or critical violations allowed in CI; manual keyboard pass and a VoiceOver or NVDA pass on the homepage, a work page, `/contact` and `/work/growtrades` before launch.

---

## S. SEO-ready architecture

Detailed optimisation comes later. These foundations must exist now:

- **Routes:** clean, lowercase, hyphenated, stable slugs from folder names; `trailingSlash: 'never'` with matching asset settings so each page has one URL; real 404 responses.
- **Head component** (`Seo.astro`) used by every page: title (`{page} | Josh Lennon`; homepage "Josh Lennon"), description (from `summary` or `seo.description`), canonical (from `SITE_URL`), Open Graph and Twitter tags, `og:image` (work cover or a default; generated images can come later), `theme-color`, and `robots` (noindex for `/demo`, `/admin` and drafts in preview builds).
- **Structured data (JSON-LD):** `Person` on every page (name "Josh Lennon", `alternateName` ["Joshua Lennon", "Joshua Michael Lennon"] to help separate him from John Lennon in search, url `https://joshlennon.com`, image (the headshot), `description` from his headline, `knowsAbout` ["Machine learning", "Agentic AI", "Natural language processing", "Computer vision"], `alumniOf` University of Manchester, `affiliation` University of Surrey, `sameAs` for GitHub, LinkedIn, YouTube and Spotify; no `jobTitle` until Josh holds a role with that title); `ScholarlyArticle` or `CreativeWork` for research entries with author, date and the PDF URL; `Thesis` for the dissertation; `VideoObject` for YouTube items when upload date is known; `MusicRecording` for releases when data exists; `BreadcrumbList` on work and log pages.
- **Sitemap and robots:** `@astrojs/sitemap` excluding `/demo`, `/admin` and drafts; `robots.txt` pointing at the sitemap and disallowing `/admin` and `/api`.
- **Feeds:** `/rss.xml` for the log via `@astrojs/rss`.
- **Semantic HTML and performance** as in sections P and R; these are the bulk of technical SEO.
- **Media metadata:** descriptive filenames, alt text, captions, width and height on every image; video posters with alt text; PDF metadata (title and author) checked by the PDF script, with a warning if missing.
- **Domains:** one canonical host; redirect the other (www or apex) at Cloudflare; disable the `workers.dev` route once the custom domain works so the site is not duplicated.
- **Old domain:** if superdan1505.com stays registered for a while, replace its GitHub Pages content with a page that links to the new site, so old links do not dead-end.

---

## T. Content architecture and authoring workflow

Goal: Josh publishes a new project or post without touching application code.

### T.1 Three ways to publish, one source of truth

The source of truth is always the files in `apps/site/src/content/`. Every route below ends as a commit to `main`, which triggers a deploy (section U.5).

1. **Browser editor (default for quick posts).** Sveltia CMS at `/admin/`, configured in `apps/site/public/admin/config.yml` with collections that mirror the content schemas (work, posts, profile), media folders per entry, and field widgets matching the schema (select for `kind`, list for `media` with a type selector). Sign-in with a fine-grained GitHub personal access token limited to this repository's contents. Works on desktop and phone. Because the CMS is a single-developer project in beta, nothing depends on it: if it breaks, the other two routes still work.
2. **Scaffold script.** `pnpm new` asks a few questions (post or work, title, kind, threads, date) and creates the folder with a correctly typed `index.mdx`, ready to fill in. `pnpm new --from <folder-of-files>` also ingests images, PDFs and audio from a folder (T.3).
3. **By hand.** Copy an existing folder, edit frontmatter and text. The schema reports mistakes at `pnpm dev` or build time with the file and field named.

### T.2 Authoring conveniences in the body

MDX bodies can embed media without knowing component names:

- A YouTube or Spotify URL alone on a line becomes the corresponding facade (remark plugin; `astro-embed`'s auto-embed may be used if it fits the facade design, otherwise a small custom remark plugin).
- An image in Markdown syntax becomes an optimised `<Picture>` inside a `<figure>` with the alt text and, if present, the title as caption.
- A link to a PDF in the entry's folder on its own line becomes a document card.
- Advanced components are available for hand-written MDX: `<Figure>`, `<Compare>`, `<Video name="...">`, `<Audio>`, `<Aside>`. Document these in `docs/authoring-guide.md` with copy-paste examples.

### T.3 Media pipeline scripts (run on Josh's machine; Windows-friendly)

All scripts are Node scripts in `scripts/media/` invoked through `pnpm`, with clear errors when a prerequisite (for example ffmpeg) is missing and install instructions for Windows (`winget install Gyan.FFmpeg`).

- `pnpm media:images <files...> --to <entry-folder>`: resizes to a 2560 px long edge, auto-rotates, strips all metadata including GPS, writes high-quality JPEG originals into the entry folder (Astro then produces AVIF and WebP at build time), and prints suggested alt-text placeholders to fill in.
- `pnpm media:pdf <file> --to <entry-folder>`: renames to a clean slug, renders page one to `cover.png` (via `pdfjs-dist` and `@napi-rs/canvas`, no system dependencies), records page count, file size and embedded PDF title and author, and warns if the title metadata is missing.
- `pnpm media:video <source> --name <name> [--start 00:00:12 --duration 10 --lut file.cube --portrait]`: produces the loop set in K.3 with ffmpeg (SVT-AV1 and x264, no audio, `+faststart`), a poster from a chosen timestamp, and a JSON manifest the `FootageLoop` component reads. Applies a LUT if the footage was shot in V-Log.
- `pnpm media:screens`: uses Playwright to capture the SCB demo stills for the GrowTrades facade at desktop and mobile widths.
- `docs/media-pipeline.md` documents each script with examples.

### T.4 Placeholders and missing content

- Missing facts are written as `TODO(josh): what is needed` inside strings. Development builds show them highlighted in place so gaps are visible. Production builds fail if any non-draft entry contains `TODO(josh)`, unless the entry is marked `draft: true`, in which case it is excluded.
- Missing images use a flat, labelled placeholder block in development only ("Photo needed: badminton"), never a stock image.
- Missing optional sections (for example no Spotify URL yet) are omitted automatically rather than rendered empty.

### T.5 What still requires code

Changing layouts, adding a new kind of media component, changing wizard questions, or changing the visual system. Adding work, posts, documents, videos, audio, photos, links and profile facts does not.

---

## U. Technical architecture

### U.1 Overview

```
GitHub (main)  --push/schedule-->  GitHub Actions: install, gates, build, deploy
                                         |
                                         v
                    Cloudflare Worker "joshlennon-site" (apps/edge)
                    |-- static assets: apps/site/dist (free, unmetered)
                    |     |-- pages, images, fonts, documents, media loops
                    |     |-- /demo/scb-handyman/ (apps/wizard demo build)
                    |     `-- /admin/ (Sveltia CMS)
                    |-- run_worker_first: /api/*
                    |     |-- POST /api/submit -> D1 (persist) -> Make.com (waitUntil)
                    |     `-- GET /api/health
                    `-- cron: */15 retry forwards; daily prune
                                         |
                       Make.com scenario: filter on secret -> Google Sheet -> email to Josh
```

### U.2 Monorepo layout after the transformation

```
apps/
  wizard/        engine + SCB site (unchanged role; adds demo build mode and the I.6 refactors)
  site/          Astro portfolio
    astro.config.mjs, tailwind.config.ts, postcss.config.cjs, tsconfig.json
    public/      _headers, robots.txt, admin/, media/, documents/, demo/ (generated)
    src/
      content.config.ts
      content/   work/, posts/, profile/
      components/  Astro components (Seo, Section, Figure, DocumentCard, WorkRow, Nav, Footer, ...)
      islands/     React islands (ContactWizard, SiteFrame, FootageLoop, YouTubeFacade, SpotifyFacade, WorkFilter, CopyEmail, ...)
      wizard/      intents registry and configs, content-result selection
      layouts/, pages/, styles/, lib/ (github.ts, oembed.ts, citations.ts, content-index.ts)
      data/github.snapshot.json
  edge/          Cloudflare Worker
    src/index.ts, src/submit/*.ts (bot-protection, rate-limiter, turnstile, consent, duplicates, sanitizer, forwarder, repository), src/cron.ts
    migrations/0001_init.sql
    wrangler.jsonc
    test/
scripts/
  media/         images, pdf, video, screens
  new.mjs        content scaffold
docs/            living docs, decisions/, archive/growtrades-platform/
```

Package names: rename `@growth-ops/wizard` to `@jl/wizard` only if it costs nothing; otherwise leave it. Add `@jl/site` and `@jl/edge`.

### U.3 Key configuration

- **Astro:** current stable Astro (6.x at the time of writing; check with `pnpm view astro version`), `output: 'static'`, `site` from `SITE_URL`, `trailingSlash: 'never'`, `build.format: 'file'`, integrations `@astrojs/react`, `@astrojs/mdx`, `@astrojs/sitemap`, `@astrojs/rss`; prefetch enabled with hover strategy.
- **Aliases:** inside the wizard's source, `@/` must keep resolving to `apps/wizard/src`, because the engine's files import each other that way. So in the site, `@` maps to `../wizard/src` and the site's own code uses `~` for `apps/site/src`. Mirror both in `apps/site/tsconfig.json` paths and Astro's Vite config.
- **Tailwind:** stay on Tailwind 3.4 across the monorepo (ADR-0003). The site uses PostCSS directly (no Astro Tailwind integration needed). Its config replaces the default theme exactly as the wizard's does and implements every key in `theme-contract.ts` with the portfolio's values, which re-themes the reused wizard components without touching their class names. `content` globs include `apps/site/src/**/*` and `apps/wizard/src/components/**/*`, never `apps/wizard/src/site/**`.
- **React:** keep React 18 unless the installed `@astrojs/react` requires 19. If it does, upgrade both apps together and keep all 856 wizard tests green.
- **Wrangler (`apps/edge/wrangler.jsonc`):** `main: "src/index.ts"`, `assets: { directory: "../site/dist", binding: "ASSETS", run_worker_first: ["/api/*"], not_found_handling: "404-page", html_handling: "drop-trailing-slash" }`, a D1 binding `DB`, cron triggers `*/15 * * * *` and a daily one, vars and secrets per Q.3. Verify each key against current Wrangler documentation when writing it; Cloudflare's configuration keys evolve.
- **Environment variables:** `SITE_URL`, `PUBLIC_TURNSTILE_SITE_KEY`, `GITHUB_TOKEN` (build only), `GITHUB_USERNAME`.

### U.4 Theming the reused wizard

`apps/wizard/src/design/theme-contract.ts` exports the names; `apps/wizard/tailwind.config.ts` keeps SCB's values (no visual change to the demo); `apps/site/tailwind.config.ts` provides portfolio values typed with `satisfies ThemeContract`. A unit test in the site compiles a minimal Tailwind build over the wizard components and fails if any class used by them produces no CSS (catching tokens missing from the site's theme).

### U.5 Build, CI and deploy

- Root `pnpm build`: build the wizard demo (`pnpm --filter @growth-ops/wizard build:demo`), then the site, then a Wrangler dry run of the Worker.
- GitHub Actions:
  - `ci.yml` on pull requests and pushes: format check, lint, typecheck, wizard tests, site checks (`astro check`), edge tests, site build, Playwright smoke and axe tests against `wrangler dev`, bundle-budget check, "no source maps in output" guard (kept from the old workflow), "no spinner" grep, "no TODO(josh) in production content" check.
  - `deploy.yml` on push to `main` and on a daily schedule (refreshes GitHub data): build and `wrangler deploy` with `cloudflare/wrangler-action`, using `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets and `GITHUB_TOKEN` for the GitHub snapshot. D1 migrations applied with `wrangler d1 migrations apply --remote` before deploy.
- Costs: Cloudflare Workers free plan, D1 free tier, Turnstile free, Web Analytics free, Email Routing free (forward `hello@<domain>` to Josh's inbox), GitHub Actions free minutes, Make.com free plan (portfolio volume is tiny; check the current allowance). The only cost is the domain, ideally registered through Cloudflare Registrar at cost.

### U.6 Approved new dependencies

`astro`, `@astrojs/react`, `@astrojs/mdx`, `@astrojs/sitemap`, `@astrojs/rss`, `@astrojs/check`, `sharp` (Astro images), `motion` (islands only), `lucide-react`, `simple-icons` (or individual SVGs), `@fontsource-variable/stix-two-text`, `@fontsource-variable/ibm-plex-sans`, `wrangler`, `@cloudflare/workers-types`, `@cloudflare/vitest-pool-workers`, `@playwright/test`, `@axe-core/playwright`, `pdfjs-dist`, `@napi-rs/canvas`, `astro-embed` (optional, see T.2), Sveltia CMS loaded as a pinned script on `/admin` only. Anything else needs a justification in the relevant ADR.

### U.7 New ADRs to write

- ADR-0039 Portfolio architecture: Astro static site plus Worker; WordPress removed from this repository.
- ADR-0040 Hosting on Cloudflare Workers static assets, D1 and Turnstile; deploy through GitHub Actions.
- ADR-0041 Content model and authoring (collections, schemas, placeholder guard, Sveltia CMS).
- ADR-0042 "What brings you here?" wizard, the threshold, and the `content-result` step kind.
- ADR-0043 Submission pipeline port: parity, improvements, asynchronous forward with cron retry (supersedes ADR-0005 for this repo), origin check replacing the nonce.
- ADR-0044 SCB demo build and same-origin framing.
- ADR-0045 Visual identity and theming through a token contract.
- ADR-0046 Media pipeline and third-party facades.

### U.8 Fixed values (supplied by Josh in 1.1)

| Item | Value |
| --- | --- |
| Canonical origin | `https://joshlennon.com` (apex). `www.joshlennon.com` permanently redirects to the apex via a Cloudflare redirect rule. |
| `SITE_URL`, `SITE_ORIGIN` | `https://joshlennon.com` |
| `TURNSTILE_EXPECTED_HOSTNAME` | `joshlennon.com` (create a new Turnstile widget for this hostname; use Cloudflare's test keys locally) |
| Public email | `hello@joshlennon.com` through Cloudflare Email Routing, forwarding to Josh's personal inbox. The personal address lives only in Cloudflare's routing settings, never in the repo or on the site. |
| `GITHUB_USERNAME` | `awkwardapples` |
| `MAKE_WEBHOOK_URL` | Josh has a dedicated portfolio webhook. It is set only with `wrangler secret put MAKE_WEBHOOK_URL`, with Josh pasting the value at the prompt. It must never appear in any file, commit, test fixture, log line, CI output or document, including this one. The Worker never logs the URL or the full payload. |
| `MAKE_WEBHOOK_SECRET` | Generate with `openssl rand -hex 32` (or Node's `crypto.randomBytes`), set with `wrangler secret put`, and give Josh the value to paste into the Make.com scenario's first filter. |
| Portrait | Josh's headshot (`Headshot.png`, 1024 by 1536 PNG, no embedded metadata). Ingest with `pnpm media:images Headshot.png --to apps/site/src/content/profile` to produce `portrait.jpg`. Its wall is a cool grey (about `#C5C8CB`), darker than `paper`, so present it as a clearly bounded figure with the 4 px media radius rather than trying to blend it into the page. Crop to 4:5 with the focal point around 50% horizontally and 30% vertically. Do not display it wider than about 480 CSS pixels, because the source only supports roughly 2x density up to 512. Alt text: "Josh Lennon". It is the intro's LCP image for returning visitors, the `Person` schema image, and part of the default Open Graph composition. If Josh has a higher-resolution original, prefer it. |

The headshot's cool grey and black shirt sit naturally on the paper and stage surfaces; no change to the palette is needed.

---

## V. Implementation plan for Claude Code

### V.0 Gates after every pass

`pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (wizard 856 plus new), `pnpm --filter @jl/site check`, `pnpm --filter @jl/edge test`, `pnpm build`, and from Pass 4 onwards the Playwright smoke and axe suite. Record results in `docs/current-state.md` with the date.

### Pass 0: Security and repository hygiene

- **Objective:** remove sensitive material and clutter before building anything public.
- **Affects:** `docs/Agency Docs/`, `Media/`, root clutter files, git history.
- **Requirements:** Q.1 items 4 and 5. Confirm Josh has rotated the old SCB webhook. Create a working branch.
- **Depends on:** Josh's go-ahead for the history rewrite and force-push.
- **Acceptance:** no Make.com webhook token, Turnstile secret or agency document anywhere in the working tree or history; gates still green (856 tests).
- **Must not break:** the wizard engine and SCB site.

### Pass 1: Architecture scaffold

- **Objective:** the new monorepo shape builds and deploys an empty but real site.
- **Affects:** `pnpm-workspace.yaml`, root `package.json`, new `apps/site`, new `apps/edge`, `.github/workflows/*`, `scripts/build-plugin.mjs` and `package-plugin.mjs` (removed), docs archive move (C.5). `plugins/quote-wizard/` leaves CI and the build here but stays in the tree as the reference implementation until Pass 6 has ported it with parity tests; Pass 6 deletes it.
- **Requirements:** Astro app with React and MDX, aliases (U.3), Tailwind 3 via PostCSS, base layout with skip link and `main`; Worker serving the site's assets with `/api/health`; D1 migration file; CI updated (PHP job removed); deploy workflow ready (secrets supplied by Josh); ADR-0039 and ADR-0040; `README.md` and `CONTRIBUTING.md` rewritten for the new setup.
- **Depends on:** Pass 0.
- **Acceptance:** `pnpm build` produces `apps/site/dist`; `wrangler dev` serves it and `/api/health` returns 200; deploy to a `workers.dev` URL works (or is ready pending secrets); 856 wizard tests pass.
- **Must not break:** wizard tests and its own Vite build.

### Pass 2: Content model, migration and media tooling

- **Objective:** all content can be authored and validated; legacy posts are migrated.
- **Affects:** `apps/site/src/content.config.ts`, `content/**`, `scripts/new.mjs`, `scripts/media/*`, `docs/authoring-guide.md`, `docs/media-pipeline.md`, ADR-0041.
- **Requirements:** sections H and T; the build-time checks in H.3; the `TODO(josh)` guard; entries from H.8 with placeholders where content is missing (marked draft if they cannot render meaningfully); `profile.yaml` with every known fact and TODOs for the rest; Sveltia CMS config at `/admin/`.
- **Depends on:** Pass 1. Josh's PDFs (he has them) for the three research and software entries.
- **Acceptance:** schema errors name file and field; adding a new post folder by hand or with `pnpm new` appears in dev without code changes; PDF covers generate on Windows and Linux; production build fails on a planted `TODO(josh)` in a non-draft entry and passes when it is removed.
- **Must not break:** previous gates.

### Pass 3: Visual system and global layout

- **Objective:** the identity in section E exists as tokens and global components, and the reused wizard components render correctly in it.
- **Affects:** `apps/site/tailwind.config.ts`, `styles/`, fonts, `apps/wizard/src/design/theme-contract.ts`, `components/` (Nav, Footer, Section, Figure, Seo shell, Button styles), ported `MobileMenu`, `Tooltip`, `IconButton`, `SkipLink`, `useFocusTrap`, `useHeaderScrollState` behaviour, ADR-0045.
- **Requirements:** palette with tested contrast pairs; STIX Two Text and IBM Plex Sans self-hosted with metric-matched fallbacks; spacing and section rhythm tokens; focus styles per surface; navbar (N.2) and drawer; footer; global reduced-motion rule; the theme-contract test (U.4); a style-guide page at `/dev/styleguide` excluded from production builds, showing every token, type size and component state for review. Check the accent against Josh's footage stills when available.
- **Depends on:** Pass 1.
- **Acceptance:** contrast test passes; theme-contract test passes; navbar and drawer pass keyboard and axe checks; section X checklist reviewed and noted in the pass summary.
- **Must not break:** the SCB demo's appearance (its own Tailwind config is unchanged).

### Pass 4: Homepage, threshold and navigation flow

- **Objective:** the homepage in section G, end to end, with real content where available.
- **Affects:** `pages/index.astro`, threshold component and inline head script, intro, selected work, research shelf, GrowTrades teaser (facade still only), music band (poster only until Pass 8), outside work, lately, elsewhere (using the GitHub snapshot from Pass 8 or a placeholder), get in touch.
- **Requirements:** threshold behaviour exactly as G.0 including no-JS links, stored intent, no flash for returning visitors, focus management and the N.1 transition; intent-dependent CTAs by CSS; Playwright tests for: first visit shows threshold; choosing "Research" lands on `#research` with focus on its heading; reload hides the threshold; "Choose again" restores it; deep link to a work page never shows it; works with JavaScript disabled.
- **Depends on:** Passes 2 and 3.
- **Acceptance:** tests above pass; LCP and CLS within budget on the homepage in Lighthouse CI; axe clean.
- **Must not break:** gates.

### Pass 5: Work, research, log and about pages

- **Objective:** every content route renders from collections.
- **Affects:** `pages/work/index.astro`, `pages/work/[slug].astro`, `pages/research.astro`, `pages/log/*`, `pages/about.astro`, `DocumentCard`, citations, filters, timeline (N.9), lightbox (N.15), audio (N.16).
- **Requirements:** H.6 and H.7, L, filters with URL sync and no-JS fallback, BibTeX and plain citations, authorship statements, related work, posts on project pages, real 404 page.
- **Depends on:** Pass 2 and 3.
- **Acceptance:** every legacy entry renders; filters work with and without JavaScript; documents open and download; citations validated against a BibTeX parser in a unit test; axe clean on every route.

### Pass 6: Contact wizard and submission pipeline

- **Objective:** "What brings you here?" works end to end with production-grade protection.
- **Affects:** `apps/wizard` refactors (I.6), `apps/site/src/wizard/*`, `islands/ContactWizard.tsx`, `pages/contact.astro`, `pages/privacy.astro`, `apps/edge/src/**`, D1 migration, `docs/data-protection.md`, ADR-0042 and ADR-0043.
- **Requirements:** sections I and Q; ported tests for every protection, derived case by case from the PHP tests in `plugins/quote-wizard/tests/Unit/`; once parity is green, delete `plugins/quote-wizard/` and record the deletion in ADR-0043; Make.com changes documented step by step for Josh (new webhook, secret filter, Sheet columns, email module replacing WhatsApp); Turnstile test keys in development; skeleton fallback matching the first wizard screen.
- **Depends on:** Passes 1 to 3; Josh's Turnstile keys and new webhook URL for production.
- **Acceptance:** Playwright: complete each intent through to success against `wrangler dev` with a stubbed webhook; honeypot, rate limit (sixth request in an hour returns 429 with a correct minute count in the UI), missing consent, bad origin, oversized body and duplicate flows behave per Q.3; forward retry cron tested with a failing then succeeding webhook; all 856 existing wizard tests plus new ones green.
- **Must not break:** the SCB demo's quote flow.

### Pass 7: GrowTrades case study and SCB demo

- **Objective:** the client site is explorable inside the portfolio.
- **Affects:** `apps/wizard` demo mode (router mode, banner, copy, base path, demo `index.html`, `build:demo` script), image replacements, `islands/SiteFrame.tsx`, Container Scroll and Sticky Scroll islands, `content/work/growtrades/`, `scripts/media/screens`, ADR-0044.
- **Requirements:** section J; headers in Q.4 for `/demo/*`; postMessage validation; desktop scaled iframe with viewport toggle; mobile full-screen dialog; skeleton while loading; under-the-hood steps with real code and ADR excerpts.
- **Depends on:** Pass 3 and 6 (copy context).
- **Acceptance:** demo runs at `/demo/scb-handyman/` with no network requests to any submission endpoint (verified in Playwright); URL bar updates on navigation; demo is not framable from another origin; all original SCB images present; the case study page meets performance budgets before the demo is opened.

### Pass 8: Music, media, GitHub and LinkedIn

- **Objective:** the creative and social sides are complete.
- **Affects:** `pages/music.astro`, `islands/FootageLoop.tsx`, facades, `lib/oembed.ts`, `lib/github.ts`, the snapshot, LinkedIn card, link previews, ADR-0046.
- **Requirements:** sections K and M; footage loop behaviour and fallbacks; oEmbed fetch with fallbacks; GitHub snapshot logic with token and failure fallback.
- **Depends on:** Josh's encoded footage (or the script run on his machine), Spotify URL, video ids, GitHub username and token.
- **Acceptance:** no third-party requests before interaction (verified in Playwright by recording requests); footage pauses off-screen and respects reduced motion and Save-Data; GitHub build succeeds with the API blocked (snapshot used).

### Pass 9: Responsive, performance and accessibility hardening

- **Objective:** every budget and requirement in O, P and R is met and enforced in CI.
- **Affects:** all pages, CI configuration (Lighthouse CI, bundle budgets), `_headers` and CSP.
- **Requirements:** viewport matrix in O; CSP in report-only first, then enforced once clean; manual keyboard and screen-reader passes documented in `docs/current-state.md`.
- **Acceptance:** budgets met; zero serious axe violations; CSP enforced with no console violations on any route; no horizontal scroll at 320 px.

### Pass 10: SEO foundations, documentation and launch

- **Objective:** ready for the later SEO phase and for real visitors.
- **Affects:** `Seo.astro`, JSON-LD, sitemap, robots, RSS, docs, domain and DNS (with Josh).
- **Requirements:** section S; final versions of all living docs; `docs/handoff.md` describing how to continue; `docs/technical-debt.md` listing deferred items honestly; custom domain connected, `workers.dev` disabled, Email Routing configured.
- **Acceptance:** structured data validates in a schema validator; sitemap lists only public pages; Lighthouse SEO and accessibility scores of 100 on key pages; the anti-slop checklist (X) passes on every page.

**What can realistically be done today:** Passes 0 to 6 are independent of most missing content and can complete today. Passes 7 and 8 depend on assets Josh must supply (licensed SCB images, encoded footage, music links, GitHub token); their code can be built today with placeholders that are hidden in production. Passes 9 and 10 can start today and finish once real content is in.

---

## W. Content Josh needs to provide

Received on 3 October 2026: domain, GitHub username, portfolio webhook, short bio, CV summary, headshot, confirmation that the SCB images are licensed, and the framework for the Mercor entry. These are recorded in U.8 and Y.

Still blocking launch:

1. Cloudflare account set-up for `joshlennon.com` (DNS on Cloudflare, Workers, D1, Turnstile, Email Routing) and an API token for GitHub Actions.
2. Confirmation that the old SCB webhook from the onboarding notebook has been deleted or regenerated in Make.com.
3. The answers to the discrepancies in Y.6 (degree title, dissertation title, Reply details).
4. Mercor: the month and year you started, and confirmation that "AI Expert [Contract]" matches how the role is described in your Mercor contract or on LinkedIn.
5. GrowTrades: start date and, optionally, a few sentences in your words on what you built and why.
6. Your LinkedIn profile URL.
7. Your CV as a PDF for `/cv.pdf` (consider a version that uses `hello@joshlennon.com` instead of your personal address).

Needed for full content (placeholders until then):

8. A distinguishing subtitle for "Understanding Deep Learning", whether it has a reference list, and whether it is the output of the year-long deep learning study on your CV.
9. Dissertation: the PDF (its title page settles the title), supervisor name if you want it shown, submission date, any code repository, and any before/after images you are allowed to publish.
10. The Iris neural network YouTube playlist link.
11. Agentic risk-assessment prototype: date, whether it was done with Reply or independently, any confidentiality, and evidence you can share (repo, video, slides or screenshots without client data).
12. Beat e-commerce platform: its name, URL, repository if public, status, and screenshots.
13. NLP news classifier: date, whether it was coursework, and whether the university allows the code to be published.
14. London Heathrow programme: its name and dates.
15. Music: Spotify artist URL, which releases and videos to feature, and any credits.
16. Lumix footage: the clip, the profile it was shot in (for example V-Log), resolution and frame rate, and which 8 to 15 seconds to loop.
17. Photos: performing, badminton (which university league and team), university and studio, with captions, and confirmation that people pictured are happy to appear.
18. SCB case-study screenshots with test data only: a WhatsApp notification and a Sheet row.
19. Optional: screenshots of your GitHub and LinkedIn profiles for desktop link previews.

---

## X. Anti-slop review checklist (run at the end of Passes 3, 4, 5, 7, 8 and 10)

- [ ] No gradients, blur, glass effects, glow or decorative shadows. Shadows only for real layering.
- [ ] No purple anywhere.
- [ ] One accent (tungsten), used sparingly; never as text on paper.
- [ ] No rows of identical feature cards. Wherever a card could exist, it shows a real artefact instead (document cover, demo, video frame, code, photograph).
- [ ] No generated icons or illustrations; brand marks and Lucide only; every icon-only button has a label and tooltip.
- [ ] No spinners; skeletons match final layouts.
- [ ] No all-caps eyebrow labels, no single italicised or coloured word in headlines, no middle-dot metadata strings, no arrows appended to link text, no numbered markers unless the content is a real sequence or figure references.
- [ ] No fade-up-on-scroll for every section; motion appears only as specified in N.
- [ ] Body line-height 1.5 to 1.6; reading measure under 80 characters; consistent section rhythm from tokens.
- [ ] Copy is plain, specific and first person; no marketing words; no invented facts; every claim about Josh traceable to this spec or his content.
- [ ] Every Aceternity or 21st.dev component used is listed in N, restyled to tokens, keyboard accessible, and has mobile and reduced-motion behaviour.
- [ ] The page still makes sense with JavaScript disabled.

---

## Y. Content pack (supplied by Josh, 3 October 2026)

### Y.1 Rules for using this content

- Quoted text is Josh's own wording; use it verbatim unless he approves a change.
- Do not embellish, extend or combine facts into new claims. If a sentence on the site is not supported by this section, earlier sections, or content Josh adds later, it does not go on the site.
- **The dissertation was awarded 76%, a first-class mark. Never describe the degree itself as first class** unless Josh confirms his overall classification.
- Coursework (the NLP classifier, the Java team project) is presented as coursework. Do not publish coursework code unless Josh confirms the university allows it. Team work is credited as team work (`authorship.type: 'contributor'`), never as sole work.
- Items marked `TODO(josh)` trip the production guard in T.4 on purpose.

### Y.2 `apps/site/src/content/profile/profile.yaml` (draft)

```yaml
name: Josh Lennon
alternateNames: [Joshua Lennon, Joshua Michael Lennon]
artistName: Josh Lennon
location: Surrey, UK
headline:
  role: AI Engineer
  focus: [Machine learning, Agentic AI, NLP, Computer vision]
availability: Open to AI engineering, LLM evaluation, AI automation and agentic AI roles.
bioShort: >-
  Artificial Intelligence graduate with a First-Class dissertation (76%) and MSc Artificial
  Intelligence student. Experience across machine learning, NLP, computer vision, software
  engineering and cloud consulting through Reply. Built production-oriented SaaS software and
  conducted independent AI research including deep learning, neural networks from first
  principles and visual computing.
bioLong: "TODO(josh): optional longer bio for the about page; until supplied, the about page uses bioShort"
portrait:
  src: ./portrait.jpg
  alt: Josh Lennon
now:
  - Studying for an MSc in Artificial Intelligence at the University of Surrey.
  - Building GrowTrades, lead-generation websites for local trades businesses.
  - Building a music e-commerce platform for selling and delivering beats.
  - Working with Mercor as an AI expert on contract.
links:
  github: https://github.com/awkwardapples
  linkedin: "TODO(josh): LinkedIn profile URL"
  youtube: https://www.youtube.com/channel/UCVxgoXrh7CqenJR0jPe7ZFQ
  spotify: "TODO(josh): Spotify artist URL"
  email: hello@joshlennon.com
cv:
  file: /cv.pdf   # TODO(josh): supply the PDF
education:
  - institution: University of Manchester
    qualification: "TODO(josh): exact award title from your certificate (see Y.6 item 1)"
    start: 2021
    end: 2025
    highlights:
      - Dissertation awarded 76% (first class).
      - "Key modules: Machine Learning, Data Science, Visual Computing, Database Systems."
      - Year-long Java team project using Git and GitHub, maintaining a large codebase.
  - institution: University of Surrey
    qualification: MSc Artificial Intelligence
    start: 2026
    end: 2027
    status: in-progress
skills:
  - group: Languages and web
    items: [Python, Java, C++, JavaScript, SQL, HTML/CSS, React]
  - group: Machine learning and data
    items: [Machine learning, Deep learning, NLP, Computer vision, Data science, PyTorch, OpenCV, Pandas, NumPy, Matplotlib]
  - group: Engineering and infrastructure
    items: [Git and GitHub, PostgreSQL, Remix, Stripe Connect, Cloudflare R2, Software engineering, Object-oriented programming]
```

The `now` lines restate facts from Josh's messages and CV; he can edit or remove any of them. Skills are exactly the CV list. TypeScript, Node.js, WordPress and Make.com appear in his project evidence but not in his skills list; add them only if he asks.

### Y.3 Experience entries (in `profile.yaml`)

```yaml
experience:
  - title: Founder
    organisation: GrowTrades
    employmentType: founder
    start: "TODO(josh): YYYY-MM"
    description:
      - Founded GrowTrades to build lead-generation websites with instant quote calculators for local trades businesses.
      - Built the platform's React and TypeScript quote wizard, a WordPress plugin with a secured submission pipeline, and Make.com automation.
      - First client is SCB Handyman Services in Guildford, Surrey.
    links: [{ url: /work/growtrades, label: Case study }]

  - title: AI Expert [Contract]          # Josh describes the role as "AI expert contractor for Mercor"
    organisation: Mercor
    employmentType: contract
    start: "TODO(josh): YYYY-MM"
    confidential: true
    description:
      - Contract work as an AI expert with Mercor.
      # Josh may enable lines like these only if they are true of his work (they are Mercor's
      # examples of acceptable high-level descriptions, not confirmed facts):
      # - Developed training data for large language models by formulating problems that models could not resolve, and documenting the correct solutions.
      # - Maintained high accuracy and throughput in large-scale annotation workflows, contributing to reliable training data for AI model fine-tuning.

  - title: "TODO(josh): role title at Reply"
    organisation: "TODO(josh): which Reply company"
    employmentType: "TODO(josh): placement, internship, contract or other"
    start: "TODO(josh)"
    description:
      - "TODO(josh): what the cloud consulting work involved, at a level you are allowed to share"

  - title: "TODO(josh): programme name"
    organisation: London Heathrow
    employmentType: programme
    start: "TODO(josh)"
    description:
      - Competitive workplace course with high-responsibility access to privileged areas, including runways, air traffic control and security operations.
      - Worked with large groups and presented to large corporate audiences, including a chief commercial officer.
```

The Mercor entry renders as title, "Mercor", "Contract", and dates. The schema in H.5 guarantees the "[Contract]" suffix and forbids images and links. Never name or hint at Mercor's clients, never describe it as employment, and never add detail beyond the confirmed lines. Until Josh supplies the Reply details, the Reply entry stays out of production (its TODOs keep it from building), while his bio sentence mentioning Reply stays as he wrote it.

### Y.4 Work entries from the CV (new, in addition to H.8)

`work/agentic-risk-assessment-prototype`

```yaml
title: Agentic risk-assessment prototype
kind: software
threads: [ai, software]
summary: >-
  A full-stack generative AI demo using Node.js, React and REST APIs, with the OpenAI API for
  LLM reasoning and retrieval-augmented generation, presented as a consulting-style investor
  pitch to generative AI experts in London.
date: "TODO(josh)"
status: complete
role: "TODO(josh)"
authorship: { type: "TODO(josh): sole, lead or contributor" }
context: { programme: "TODO(josh): independent, or part of the Reply work?" }
tech: [Node.js, React, REST APIs, OpenAI API, RAG]
links: []        # TODO(josh): repo, video or slides if shareable
featured: false  # becomes featured (order 3) once evidence exists
```

`work/beat-store-platform` (slug changes to the product's name once known)

```yaml
title: "TODO(josh): product name"
kind: software
threads: [software, music, venture]
summary: >-
  A music e-commerce SaaS for secure, automated beat sales and delivery, with dashboards and
  SEO, built with Remix, PostgreSQL, Stripe Connect and Cloudflare R2.
date: "TODO(josh)"
status: ongoing
role: Founder and engineer   # TODO(josh): confirm
authorship: { type: sole }    # TODO(josh): confirm
tech: [Remix, PostgreSQL, Stripe Connect, Cloudflare R2]
links: []                     # TODO(josh): live URL, repo if public
```

This is the clearest bridge between Josh's music and software, so it appears on `/music` (under "Also built") as well as in `/work`.

`work/nlp-news-classifier`

```yaml
title: News classifier
kind: software
threads: [ai, university]
summary: A supervised news classifier built with Pandas and Matplotlib.
date: "TODO(josh)"
status: complete
role: "TODO(josh)"
authorship: { type: sole }    # TODO(josh): confirm, and whether it was coursework
context: { institution: University of Manchester }   # TODO(josh): confirm
tech: [Python, Pandas, Matplotlib]
```

The Java team project is listed as an education highlight (Y.2), not as a work entry, unless Josh supplies something showable and confirms the team's work can be shown.

Proposed featured order (H.3): 1, the Kerr microscopy dissertation; 2, GrowTrades; 3, the agentic risk-assessment prototype (only once there is evidence to show); 4, Understanding Deep Learning. This order matches the roles Josh is seeking.

### Y.5 Hiring intent result copy

The hiring result step (I.3) opens with the availability sentence from `profile.yaml`, then the featured work, then "Download CV (PDF)" and "Send Josh a message". It does not add any claim beyond the profile and work entries.

### Y.6 Discrepancies Claude Code must not resolve on its own

1. **Degree title.** The CV says "BSc Artificial Intelligence"; Josh's original brief says "Computer Science & Artificial Intelligence BSc". The site uses exactly the title on his degree certificate.
2. **Dissertation title.** The CV says "Extracting Magnetic Image Data"; the old portfolio says "Extracting Magnetic information from image data". When the PDF is added, use the title on its title page, and flag it if it matches neither.
3. **Reply.** The bio mentions cloud consulting through Reply, but the CV lists no Reply role. Needed: company, role title, dates, type of engagement, and any confidentiality.
4. **Agentic prototype context.** Whether it was part of the Reply work. If it involved a client, describe it at a high level only and show no client data.
5. **Overall degree classification.** Only the dissertation mark is confirmed. The degree classification appears only if Josh supplies it.
6. **Deep learning research.** Whether the CV's year-long deep learning study and the "Understanding Deep Learning" paper are the same work. Until confirmed, they are not merged and no link between them is stated.

### Y.7 Optional first-person bio (use only if Josh approves; otherwise keep Y.2 verbatim)

> I'm an Artificial Intelligence graduate, with a dissertation awarded 76% (first class), and I'm now studying for an MSc in Artificial Intelligence at the University of Surrey. I've worked across machine learning, NLP, computer vision, software engineering and cloud consulting through Reply. I've built production-oriented SaaS software and carried out independent AI research, including deep learning, neural networks from first principles and visual computing.
