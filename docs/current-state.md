# Current State

_Last updated: 2026-10-04 (Portfolio Pass 7)_

This repository is being turned into Josh Lennon's portfolio. The governing document is [`docs/portfolio-spec.md`](portfolio-spec.md) (v1.2). Work happens in the passes of its section V on the `portfolio-transformation` branch, with a draft pull request open against `main` and a merge to `main` at the end of each pass once its gates are green. The GrowTrades platform's own state, as last recorded, is archived in [`archive/growtrades-platform/current-state.md`](archive/growtrades-platform/current-state.md).

## Passes

| Pass | Scope                                      | Status          |
| ---- | ------------------------------------------ | --------------- |
| 0    | Security and repository hygiene            | Done 2026-10-03 |
| 1    | Architecture scaffold                      | Done 2026-10-04 |
| 2    | Content model, migration and media tooling | Done 2026-10-04 |
| 3    | Visual system and global layout            | Done 2026-10-04 |
| 4    | Homepage, threshold and navigation flow    | Done 2026-10-04 |
| 5    | Work, research, log and about pages        | Done 2026-10-04 |
| 6    | Contact wizard and submission pipeline     | Done 2026-10-04 |
| 7    | GrowTrades case study and SCB demo         | Done 2026-10-04 |
| 8    | Music, media, GitHub and LinkedIn          | Next            |
| 9    | Responsive, performance and accessibility  |                 |
| 10   | SEO foundations, documentation and launch  |                 |

## What exists

### Pass 7: GrowTrades case study and SCB demo (2026-10-04)

- The SCB demo (spec J.3; ADR-0044): the real SCB site built with `vite build --mode demo` into `apps/site/public/demo/scb-handyman/` by the root build, served at `/demo/scb-handyman`. Routes live in memory and each page is reported to the framing page; a banner and the success screen say nothing is sent, and nothing is (QuotePage's development port). Every SCB image is present; oversized copies are re-encoded in the build only (1.3 MB in all). `/demo/*` may be framed by this site only and is not indexed.
- The browser frame (spec J.4): a still of the SCB homepage and "Try the live site" (a link without JavaScript); then the demo at 1280 px scaled to fit, a Desktop and Mobile toggle, a skeleton until it loads, and an address bar that follows the demo; on phones a phone outline and a full-screen dialog. Stills come from `pnpm media:screens`.
- The case-study template and the GrowTrades body: Fig. 1 the live site, what it does with the estimator as Fig. 2, "Under the hood" (nine pipeline steps beside code cut from `apps/edge` at build time, with their ADRs; N.5's sticky panel on wider screens with JavaScript), "Engineering" (856 TypeScript tests at handover, 274 PHP tests and PHPStan level 8 at the plugin's last recorded run, 38 ADRs, the service count read from the registry, each linked), and "Talk about your website". The frame tilts flat as it scrolls into view (N.4) in CSS.
- The homepage GrowTrades section (spec G.4) appears with the entry. **GrowTrades is still a draft**: it needs Josh's start date, authorship type and two paragraphs, so production builds leave out the case study, the homepage section and the threshold's website answer until then.
- Engine changes for the demo, all inert outside it: router modes (`site/routing/navigation.ts`), the demo banner, demo copy on the success screen, and the Vite demo mode.
- Browser tests (`e2e/demo.spec.ts`): a whole quote request through the demo with no request to any submission endpoint, the headers, framing from another origin refused, the navigation messages, and every SCB image loading. The case-study tests skip themselves until the entry is published.
- Docs: ADR-0044.

### Pass 6: Contact wizard and submission pipeline (2026-10-04)

- `/contact` (spec I; ADR-0042): "What brings you here?" as a React island. The intent comes from `?intent=`, the homepage's stored answer, or a selector; then two or three questions, a result step showing real work from the collections (dropped when there is nothing to show), your details with consent linked to `/privacy`, optional details with "Skip and send", and a success screen with the reference and the address the reply goes to. Duplicates within 24 hours get "I already have a message from you today. I'll reply to both together." Without JavaScript the page offers the email address. 77.5 kB of JavaScript gzipped (budget 120 kB).
- Five intent configurations in `apps/site/src/wizard/intents.ts` (hiring, research, website, music, something else), shared by the island and the Worker.
- Engine changes, all additive and defaulting to the SCB behaviour: the `content-result` step kind; environment, copy and content-result contexts; `httpSubmissionPort` with `endpointUrl`; `WizardShell` `landmark` and `className`; field `maxLength` and `helpLink`; a `role_link` URL check; and 44 px inputs, selects and buttons (spec O), which also changes the SCB build.
- `POST /api/submit` on the Worker (spec Q.2, Q.3; ADR-0043): the plugin's pipeline in the plugin's order (honeypot, rate limit, Turnstile, shape, consent, duplicates, persist), plus the origin check, the 16 kB limit, server-side answer validation with the engine's own code, Turnstile hostname and action checks, an HMAC rate-limit key and random `JL-` references. The forward to Make.com runs after the response, with the `X-Webhook-Secret` header; failures are retried every 15 minutes with back-off for five attempts. A daily cron deletes messages after 90 days and ended rate-limit windows. Migration `0002` adds the client timestamp.
- Parity: every PHP test of the ported classes has a Vitest counterpart named after it; the D1 SQL runs against the real migrations on Node's built-in SQLite. `plugins/quote-wizard/` is deleted (in git history before this merge).
- `/privacy` (spec Q.5): written for what the site does today, in Josh's voice; analytics must be added there before they go live.
- Browser tests (`e2e/contact.spec.ts`, 18 per device) against `wrangler dev` with a fresh local D1 and a stub webhook (`e2e/start-worker.mjs`, `e2e/webhook-stub.mjs`): every intent to success with the forwarded payload checked, the selector and the stored intent, "Keep exploring", duplicates, a failing webhook invisible to the visitor, the sixth message in an hour refused with "Please try again in 60 minutes.", the honeypot, missing consent, another origin, an oversized body, answers the browser would refuse, axe and 320 px on `/contact` and `/privacy`, and the no-JavaScript fallback.
- Docs: ADR-0042 completed, ADR-0043, [`make-com.md`](make-com.md), [`data-protection.md`](data-protection.md), and the contact set-up steps in [`deployment.md`](deployment.md).

### Pass 5: Work, research, log and about pages (2026-10-04)

- `/work/<slug>` (spec H.6): the header with kind, date, status, an attribution line generated from the data ("Sole author. BSc dissertation, University of Manchester. Awarded 76% (first class).") and evidence actions; the lead artefact (the first video, else the first document, else the cover); the summary and the MDX body; documents, media, numbered references, a statement of authorship from `authorship`, updates from the log, and related work. Every generated phrase comes from a field (`src/lib/work.ts`, unit-tested). The `case-study` template arrives with GrowTrades in Pass 7.
- `/work`: rows newest first, grouped by kind. The filter (All and each kind that has work) is instant, mirrored in `?kind=`, applied on arrival and announced; without JavaScript every group shows and the control is hidden.
- `/research`: the documents of every research entry, each with its cover, metadata, summary, a link to its work, and "Cite". A sentence states the peer-review position of what is on the shelf.
- Documents (spec H.7): "Read here" (wider screens only; the browser's own PDF viewer in an inline frame, created on click), "Open in a new tab" and "Download (PDF, size)". `/documents/*` may now be framed by this site only (`frame-ancestors 'self'` instead of `X-Frame-Options: DENY`).
- Citations (`src/lib/citation.ts`): plain text in APA style and BibTeX, `@thesis` with the programme as `type` for the dissertation and `@misc` otherwise, with `note = {Not peer-reviewed}` where true. Every BibTeX output is parsed in the unit tests by a strict parser in `src/lib/testing/bibtex-parser.ts`, written here because no BibTeX parser is an approved dependency (spec U.6); it also rejects unescaped special characters. Copy buttons for both formats.
- `/about` (spec L): the bio verbatim, the availability line, one timeline of education, work and posts (experience joins once its start dates are confirmed), newest first, whose line fills with tungsten as it scrolls (a CSS scroll-driven animation, full and static where unsupported or with reduced motion), and the skills as three plain lists, each linking to work that lists it in `tech`. The CV button appears once `cv.pdf` exists.
- `/log` and `/log/<slug>` (month headings, thread filter on the same control) and `/rss.xml`. With no posts yet, `/log` is not built and the footer links neither it nor the feed.
- Media (spec N.7, N.15, N.16): YouTube and Spotify facades (a link to the provider without JavaScript; the player is created only on Play, privacy-enhanced for YouTube, and takes focus), self-hosted video and native audio with transcripts, and a lightbox for zoomable figures (native dialog, arrows, Escape, focus return; verified in the style guide, since no published entry has photos yet).
- MDX conveniences (spec T.2; ADR-0041 addendum): a YouTube or Spotify link, a document link, or an image alone on its line becomes a facade, a document card or a captioned figure; `<Figure>`, `<Video>`, `<Audio>`, `<YouTube>`, `<Spotify>` and `<Aside>` work without imports. Verified with a temporary body edit (reverted) and unit tests; documented in [`authoring-guide.md`](authoring-guide.md).
- Navigation: Work, Research and About are live in production; the homepage's work titles link to their pages, the research call to action goes to `/research`, and the shelf gained "Cite".
- Browser tests (`e2e/content.spec.ts`, 13 per device): axe on every route, one h1 and no horizontal scroll at 320 px on every route, the current section marked, every listed entry renders, the filter with and without JavaScript and from the URL, Open, Download and the PDF's headers, "Read here" on desktop and its absence on phones, "Cite", no request to YouTube before Play, the timeline order, the sitemap and the feed. The threshold test now covers a deep link to a work page.

### Pass 4: Homepage, threshold and navigation flow (2026-10-04)

- The threshold (spec G.0, N.1; ADR-0042): the first section of the homepage, on stage, with the name, the confirmed sentence and "What brings you here?". Each answer is a real link to its section, so it works without JavaScript. Choosing stores the answer in this browser only (`jl:intent`), brings the house lights up (about 600 ms, about 400 ms on phones, instant with reduced motion), lands on the section and focuses its heading. An inline script in `<head>` sets `html[data-intent]` before the body is parsed, so returning visitors never see it. "Not what you're after? Choose again" (intro) and "Change what brought you here" (footer, every page) bring it back.
- The intro (spec G.1): the short bio and the "Now" list from `profile.yaml`, verbatim, and all five sets of calls to action in the HTML, chosen by CSS. Destinations that do not exist yet are never linked (`src/lib/home.ts`, unit-tested): "Start a conversation" reads "Get in touch" and leads to the email address until `/contact` exists, and the hiring, website and music answers use the default set until the CV, GrowTrades and music arrive. No portrait yet: production gives the text the full width; development shows "Photo needed: portrait".
- Selected work (spec G.2): rows with title, summary, kind and year, role, evidence actions ("Read the dissertation (PDF, 2.2 MB)", "Watch on YouTube") and the PDF's first page as the artefact. Only one published entry is featured, so the newest other published entries fill the rows up to four; marking entries `featured` overrides this. Today: the dissertation and the neural network.
- Research (spec G.3): a shelf of up to three documents with the cover, document type, date, page count, peer-review status, the work's summary, "Read" and "Download (PDF, size)". "Cite" arrives with the citation formats in Pass 5.
- Get in touch (spec G.9): one functional sentence, the email address with the copy button, and GitHub (LinkedIn once its URL is in the profile).
- GrowTrades, Music, Outside work, Lately and Elsewhere (spec G.4 to G.8) wait on content or later passes. They are left out of production builds, along with the threshold answers that would lead to them, and appear in development as labelled gaps.
- Components: `WorkRow` and `DocumentCard` (shared with the Pass 5 pages), `Placeholder` (development only), and the homepage sections in `components/home/`. Tokens gained two aspect ratios (portrait 4:5, an A4 page).
- Browser tests (`e2e/home.spec.ts`, 12 per device): first visit shows the threshold; choosing Research lands on `#research` with focus on its heading; reduced motion; reload hides it, checked at parse time; "Choose again" and the footer link restore it; other routes never show it; one set of calls to action per answer, each linking somewhere that exists; axe in both states; no horizontal scroll at 320 px; the no-JavaScript links.
- Lighthouse CI (ADR-0047): `lighthouserc.json` asserts the homepage's median LCP (2.0 s or less) and CLS (0.05 or less) over three mobile runs, in `ci.yml` through `treosh/lighthouse-ci-action@v12`.
- Docs: ADR-0042 (the threshold; the wizard joins it in Pass 6) and ADR-0047.

### Pass 3: Visual system and global layout (2026-10-04)

- Tokens in `apps/site/src/design/tokens.ts` (ADR-0045): the palette of spec E.2 plus one derived tint (`paper-sunken`), the 1.25 type scale from 17 px with a display size for the threshold, the 4 px spacing scale with section rhythm tokens (64, 80 and 128 px; 48 px under a heading), radii by role, two functional shadows, the wizard's motion timings.
- The theme contract: `apps/wizard/src/design/theme-contract.ts` lists every token the wizard's components use; the site's theme implements it (`primary` is ink, so wizard buttons are ink with paper text). Tests: the wizard's config defines every name, and every class the wizard components use still produces CSS under the site's theme.
- Contrast test: every text and control pair (spec R), and each ratio spec E.2 states, checked against the real hex values (35 tests).
- STIX Two Text and IBM Plex Sans self-hosted, Latin and Latin Extended only, STIX roman preloaded, with metric-matched fallbacks measured by `scripts/font-fallbacks.mjs`.
- Components: `Seo`, `Section`, `Figure`, `Button`, `BrandIcon`, `Nav`, `Footer` and the `CopyEmail` island (spec N.13). Focus rings are ink on paper and tungsten on stage.
- Navigation (spec F.2, N.2): condenses after 8 px, follows the surface beneath it, and opens a native modal drawer on phones. It works without JavaScript (the menu button links to the footer navigation) and ships no React. Pages that do not exist yet are not linked in production (`src/lib/routes.ts`).
- `/dev/styleguide`: development only, every token, type size and component state, including the wizard's components in the portfolio theme.
- Browser tests with Playwright and axe against `wrangler dev` (`pnpm test:e2e`, also in CI): skip link, landmarks, the real 404, no horizontal scroll at 320 px, the bar condensing and following the surface, the drawer by keyboard (focus inside, Escape and focus return, scroll lock), the no-JavaScript menu, and zero serious or critical axe violations.

### Pass 2: Content model, migration and media tooling (2026-10-04)

- Collections in `apps/site/src/content.config.ts` (ADR-0041): `work` (`content/work/<slug>/index.mdx`), `posts` (`content/posts/<yyyy-mm-dd>-<slug>/index.mdx`, page at `/log/<slug>`) and `profile` (`content/profile/profile.yaml`), with strict schemas from spec H.2 to H.5 and the content pack. Mistakes are reported with the file and the field.
- Checks after every load (`content/checks.ts`, 19 unit tests): placeholders in published content, missing alt text, folder names, duplicate `featuredOrder`, references to drafts or missing entries, and missing or unrecorded documents. Production builds stop on any of them; `astro dev` warns. A final build step fails if `TODO(josh)` reaches any built file.
- Placeholders live only in drafts (whole entries, or profile items marked `draft: true`); unknown optional facts are left out with a `# TODO(josh)` note. `pnpm content:todo` lists all of them.
- Entries: published, `kerr-microscopy-dissertation` (featured 1, with its PDF) and `neural-network-from-scratch` (the Iris report and the YouTube testing video). Drafts: `understanding-deep-learning`, `growtrades`, `agentic-risk-assessment-prototype`, `beat-store-platform`, `nlp-news-classifier`. The profile carries every confirmed fact from spec Y.2 and Y.3; the three experience items wait on start dates. Texts come from Josh's old site (`Desktop/blog`), lightly edited.
- Documents in `apps/site/public/documents/` with permanent URLs; covers beside each entry; page counts and sizes in `src/data/documents.json`.
- Scripts: `pnpm new` (draft entry, optionally ingesting a folder of media), `pnpm media:images` (2560 px, rotation applied, all metadata including GPS removed), `pnpm media:pdf` (cover, page count, size, embedded title check; Windows locally, Linux in CI), `pnpm media:video` (AV1 and H.264 loop sets with ffmpeg; not run here, ffmpeg is not installed), `pnpm content:todo`.
- Sveltia CMS at `/admin`, pinned to 0.227.4 with a Subresource Integrity hash, configured for all three collections.
- `/dev/content`, a development-only page listing every entry with gaps highlighted.
- Docs: ADR-0041, [`authoring-guide.md`](authoring-guide.md), [`media-pipeline.md`](media-pipeline.md).

### Pass 1: Architecture scaffold (2026-10-04)

- `apps/site` (`@jl/site`): Astro 7 site, static output, one URL per page (`/work`, never `/work/`), React 18 and MDX integrations, sitemap, Tailwind 3.4 through PostCSS with a closed palette (spec E.2), aliases `@` (wizard source) and `~` (site source). A base layout with skip link and a single `main`, a placeholder homepage with the confirmed one-sentence introduction (spec G.0), a real 404 page, and baseline security headers in `public/_headers`. Canonical URLs use the served form of each path (`src/lib/urls.ts`).
- `apps/edge` (`@jl/edge`): the Worker `joshlennon-site`. Serves `apps/site/dist` as static assets (only `/api/*` runs Worker code), `GET /api/health` returns `{"status":"ok"}`, other `/api/*` paths return a JSON 404. D1 binding `DB` with the submissions and rate-limit schema in `migrations/0001_init.sql`.
- `apps/wizard`: unchanged apart from its ESLint design rules moving into `eslint-local/design-constraints.js`, now shared with the site.
- CI (`.github/workflows/ci.yml`): every V.0 gate on Node 24 plus a no-source-maps guard; the PHP job is gone. Deploy (`.github/workflows/deploy.yml`): build, create the D1 database on first run, migrate, deploy; skipped with a notice while the Cloudflare secrets are missing.
- Node 24 LTS (`.nvmrc`), because Astro 7 and Wrangler 4 need Node 22.12 or newer (ADR-0039).
- Documentation: ADR-0039 and ADR-0040, `docs/decisions/README.md`, `docs/deployment.md`, rewritten `README.md` and `CONTRIBUTING.md`, new `roadmap.md`, `technical-debt.md` and `handoff.md`; GrowTrades-era documents moved to `docs/archive/growtrades-platform/`.
- `plugins/quote-wizard/` is out of the build and CI but stays as the reference for the Pass 6 port.

### Pass 0: Security and repository hygiene (2026-10-03)

- Webhook: Josh confirmed that the old SCB webhook from the onboarding notebook has been deleted or regenerated in Make.com and that the linked Google Sheet is restricted to named people (spec Q.1 items 1 and 2).
- `docs/Agency Docs/` scrubbed from every commit on `main` and `deploy/test-live` with `git filter-repo --sensitive-data-removal --invert-paths --path "docs/Agency Docs"`, run on a fresh mirror clone after a verified dry run, and force-pushed with Josh's approval (with a lease on the exact commits scanned). The repository was private for the push and made public again once a fresh clone from GitHub scanned clean. Both branch tips are otherwise identical to before. The four commits that touched only those files were dropped (289 commits to 285). Every commit hash changed, because the root commit carried a GitHub web-UI signature that filter-repo strips, so commit hashes quoted in older documents no longer resolve. The README's link to the onboarding notebook is removed.
- `Media/`: the six byte-identical duplicates of images in `apps/wizard/src/assets/images/` deleted; the three unique SCB brand files moved, byte for byte, to `apps/site/src/content/work/growtrades/brand/` as `scb-logo.png`, `scb-logo-opaque.png` and `scb-og.jpg` (spec B.1). A fourth unique file that only existed on `deploy/test-live`, `Media/scb-site-icon-512.png`, was copied there unchanged as `scb-site-icon-512.png` (spec 1.2, B.1). No image in `apps/wizard/src/assets/images/` changed.
- Root clutter deleted: `goqw-diag.php`, `PROBE-1-instructions.txt`, `AUDIT-6.5-tsconfig-test-error.md`, `step-4.1-config-schema.tar.gz`.
- `.gitattributes` (`* text=auto eol=lf`) added. Without it, a Windows clone with `core.autocrlf=true` checks files out as CRLF and `pnpm format:check` reports 431 files; the stored content was already LF.
- `docs/AUDIT-5.14.1-onboarding.md`: the one real Prettier violation on `main`, fixed by code-formatting `DB_HOST` (Prettier's own rewrite garbled the paragraph).
- `docs/portfolio-spec.md` committed and excluded from Prettier, so each version Josh supplies stays byte-for-byte as supplied.
- History scans of every blob on every ref (including inside `.docx`, `.tar.gz` and PDF streams) and every commit message, with values never printed. Before the rewrite, the only live Make.com webhook token and the only Google Sheet link were in `docs/Agency Docs/Technical Onboarding.IPYNB`. After it, a fresh clone from GitHub has neither, and no agency document, in any of its 285 commits. No Turnstile secret key existed anywhere: the `0x4A…` values in tests and the plugin are the public SCB site key, and the `1x/2x/3x000…` values are Cloudflare's documented test keys. Other `hook.eu1.make.com/…` strings are placeholders (`abc123def456`, `<real-id>`), and `.env.example` on `deploy/test-live` has empty values.

## Gate state (last verified: Pass 7, 2026-10-04)

Node 24.21.0, pnpm 9.15.0, Windows.

- `pnpm format:check`: clean.
- `pnpm lint`: ESLint 0 errors and 0 warnings in the wizard, the site and the Worker; `scripts/check-design.mjs` clean.
- `pnpm typecheck`: 0 errors (wizard production and test tsconfig, Worker).
- `pnpm test`: **1,121 passed**: wizard 888 (the original 856, 11 theme-contract checks, 17 for the Pass 6 engine changes and 4 for the demo router; 70 files), site 111 (13 files, now including the frame's message checks and the code excerpts), Worker 122 (4 files).
- `pnpm --filter @jl/site check`: 0 errors, 0 warnings (one hint: `tseslint.config()` is deprecated).
- `pnpm --filter @jl/edge test`: 122/122.
- `pnpm build`: clean, no placeholders in the built site. Builds the wizard, then the SCB demo (1.3 MB, no source maps), then the site and the Worker. `/contact` JavaScript 77.5 kB gzip (budget 120 kB).
- `pnpm test:e2e`: 112 passed on desktop and an emulated phone (12 skipped: device-specific tests, and the case-study tests until GrowTrades is published), zero serious or critical axe violations, against `wrangler dev` with a fresh local D1 and a stub webhook.
- Pass 7 acceptance: the demo runs at `/demo/scb-handyman` with no request to any submission endpoint (a whole quote request in Playwright); it reports each page to the framing page, which the frame shows in its address bar; another origin cannot frame it; every SCB image is present. The case study's performance budget waits for its publication (it is a draft). Spec X reviewed below.
- Lighthouse CI (homepage): first run in Pass 4 gave a median LCP of 1.59 s, CLS 0 and a performance score of 99 on the mobile preset.
- PHP: none left; the plugin was deleted once the Worker matched it (ADR-0043).

## Anti-slop review (spec X), Pass 7

- No gradients, blur, glass or glow; the frame and phone outline are borders, and nothing in the case study casts a shadow.
- No purple: code is shown plain, without a highlighting theme.
- One accent: no new uses of tungsten.
- No identical cards: the case study's evidence is the live site, the estimator, real code and linked figures.
- Icons: Lucide's monitor, phone and close, each with a label and a tooltip.
- No spinners: a skeleton of the SCB homepage while the demo loads.
- No all-caps labels or middle dots; the pipeline's steps are numbered because they are a real sequence.
- Motion: only N.4 (the frame settles as it scrolls in) and N.5 (the code panel swaps), both without animation libraries, both off with reduced motion.
- Copy: what the product does is described from the code; results and figures about SCB are left out (spec J.1); Josh's own paragraphs are a placeholder in the draft.
- Aceternity: Container Scroll and Sticky Scroll as ideas, rebuilt in CSS and a few lines of script, keyboard and screen-reader friendly, with phone and reduced-motion behaviour.
- Without JavaScript: the case study reads in full, each step shows its code, and "Try the live site" opens the demo.

## Anti-slop review (spec X), Pass 5

- No gradients, blur, glass, glow or decorative shadows: none. The lightbox is flat stage; the facades are flat stage panels.
- No purple: none.
- One accent: tungsten is the timeline's fill line, the stage's Play button and the threshold; never text on paper.
- No rows of identical cards: work rows show their artefacts; documents show their own first pages; the about page has no cards at all.
- Icons: none added; the lightbox and viewer controls are text buttons.
- No spinners: none.
- No all-caps labels, coloured or italic headline words, middle dots or arrows in link text: none; metadata sits in separate elements.
- Motion: the timeline fill (N.9) only, CSS-driven, with a static fallback.
- Rhythm and measure from tokens; long-form bodies at 68 characters and 1.6 line height.
- Copy: the only new sentences are generated from fields (attribution, authorship, peer-review status) or are functional ("Playing loads the video from YouTube."). No claim about Josh beyond the content.
- Aceternity or 21st.dev components: none; the timeline is the N.9 idea built in CSS.
- Without JavaScript: every page reads in full; filters show everything; documents open and download; facades are links.

## Anti-slop review (spec X), Pass 4

- No gradients, blur, glass, glow or decorative shadows: none; covers sit on a 1 px rule, not a shadow.
- No purple: none.
- One accent, used sparingly: tungsten is the threshold's hover and chosen-row colour on stage, and nothing new on paper.
- No rows of identical cards: selected work is a list of rows showing each artefact (the PDF's first page); the research shelf shows the documents themselves.
- Icons: none added.
- No spinners: none.
- No all-caps labels, single coloured or italic headline words, middle dots or arrows in link text: none; metadata sits in separate elements.
- Motion: only the threshold's transition (N.1); no scroll animation.
- Rhythm and measure from tokens: yes; paper sections are divided by a hairline.
- Copy: the bio and the "Now" list are verbatim from the profile; the only new sentence is the functional one in "Get in touch". Labels say what happens ("Read the dissertation (PDF, 2.2 MB)", "Download (PDF, 8.2 MB)").
- Aceternity or 21st.dev components: none.
- Without JavaScript: the threshold is a set of links, every section shows, and the default calls to action show.

## Anti-slop review (spec X), Pass 3

- No gradients, blur, glass, glow or decorative shadows: none exist in the theme; shadows only on the tooltip and the drawer. Enforced by ESLint and `scripts/check-design.mjs`.
- No purple: the palette has none.
- One accent, used sparingly, never as text on paper: tungsten is the stage's primary button, the current-page underline on stage, the text-selection highlight, and nothing else.
- No rows of identical cards: none yet; Pass 4 and 5 show artefacts instead.
- Icons: Lucide and Simple Icons only; both icon-only controls (menu, close) have a label and a tooltip.
- No spinners: none can exist (`animate-spin` is not in the theme); the skeleton pulses opacity only.
- No all-caps labels, single coloured or italic headline words, middle dots or arrows in link text: none.
- No fade-up on scroll: no scroll animation at all yet.
- Body line-height 1.5 to 1.6, reading measure 68 characters, rhythm from tokens: yes.
- Copy plain and first person, no invented facts: the only copy is navigation labels and the confirmed introduction.
- Aceternity or 21st.dev components: none used in this pass.
- Works without JavaScript: yes, including the menu.

## Open items

Needs Josh, for content (each one keeps an entry or item a draft until it is answered; `pnpm content:todo` has the full list):

- **The deep-learning paper.** The PDF on the old site prints a personal Gmail address on page 1, which spec U.8 keeps off the site, so it is not committed. It is titled "Introduction to Deep Learning" inside but "Understanding Deep Learning" on the old site, and it lists Anirbit Mukherjee as a second author, so it cannot be described as sole or independent work. Needed: a PDF without the personal address, the title to use, and how to describe the authorship.
- **Degree title on the dissertation.** The dissertation's title page says "Bachelor of Science in Computer Science"; spec 1.2 records the degree as "BSc Artificial Intelligence", which the profile uses. Nothing is changed until Josh says which is right (the PDF itself cannot be changed). The title page also names the supervisor; the entry leaves the name off until Josh says otherwise.
- **Headshot.** `Headshot.png` (spec U.8) is not on this machine; the profile has no portrait until it is added with `pnpm media:images Headshot.png --to apps/site/src/content/profile --name portrait`.
- None of the three PDFs has an embedded title. Optional: re-export with File, Properties, Title set.
- **Selected work.** Only the dissertation is featured and published, so the homepage fills the other rows with the newest published work (today the neural network). The proposed order in spec Y.4 is GrowTrades second, the agentic risk-assessment prototype third once there is evidence, and the deep-learning paper fourth; each needs its draft finished first.
- **Bio.** The intro uses `bioShort` from spec Y.2 verbatim. The optional first-person bio (spec Y.7) is used only if Josh approves it.
- **The first log post.** `/log` and the feed's footer links appear with it (`pnpm new post`).
- **Citations name "Josh Lennon"**, from the profile, while the dissertation's title page says "Joshua Lennon". Either is easy to switch; say which you want in citations.

Needs Josh, for set-up:

- **Cloudflare set-up** (blocks the first real deploy, not the merges): account, `workers.dev` subdomain, API token, and the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets. Steps 1 to 3 in [`deployment.md`](deployment.md).
- **The contact form** (after the first deploy): a Turnstile widget and the `PUBLIC_TURNSTILE_SITE_KEY` variable, the Make.com scenario ([`make-com.md`](make-com.md)), and the four Worker secrets. Steps 4 to 6 in [`deployment.md`](deployment.md). Until then, messages are stored in D1 and wait.
- **The privacy notice** at `/privacy` is written for what the site does; read it, and check with the ICO's self-assessment whether the data protection fee applies to you. It says your inbox and Sheet copies are kept "only as long as I need them"; give a period if you prefer one.
- `awkwardapples/scb-handyman` and `awkwardapples/Handy-Man` are public and still hold the agency documents (SCB's ranking and enquiry figures, the agreement template, the sales PDF), the old Sheet link and the now-rotated webhook token on `main`. Josh is handling these repositories (spec W item 2).
- GitHub can keep serving the pre-rewrite commits to anyone who already has their hashes until it garbage-collects them; GitHub Support can purge them on request (first changed commit `fa585a21686cd0bb88e015af7870ae735d3e40cb`).
- Any clone made before the Pass 0 rewrite must be re-cloned rather than pushed from. This machine's clone still holds the old objects in its reflog until `git reflog expire --expire=now --all && git gc --prune=now` is run.
- Node 24 for local work: `nvm use 24.21.0` (installed on this machine alongside Node 20, which stays the default), then `corepack enable pnpm`.
