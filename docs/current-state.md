# Current State

_Last updated: 2026-10-05 (Portfolio Pass 10)_

This repository is Josh Lennon's portfolio. It was built in the passes of section V of [`docs/portfolio-spec.md`](portfolio-spec.md) (v1.2) on the `portfolio-transformation` branch, each merged to `main` once its gates were green. All eleven passes are done. What remains is the set-up and content under Open items, in the order [`handoff.md`](handoff.md) gives. The GrowTrades platform's own state, as last recorded, is archived in [`archive/growtrades-platform/current-state.md`](archive/growtrades-platform/current-state.md).

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
| 8    | Music, media, GitHub and LinkedIn          | Done 2026-10-05 |
| 9    | Responsive, performance and accessibility  | Done 2026-10-05 |
| 10   | SEO foundations, documentation and launch  | Done 2026-10-05 |

## What exists

### Pass 10: SEO foundations, documentation and launch (2026-10-05)

- **Structured data** (spec S; ADR-0049): one JSON-LD graph per page, built from the content by `src/lib/structured-data.ts`.
  - **Every page:** Josh as a Person, with:
    - both alternate names;
    - the profiles that exist as `sameAs`;
    - Manchester as `alumniOf` and Surrey as `affiliation`;
    - the fixed `knowsAbout` list;
    - no job title.
  - **Homepage:** a WebSite. **`/about`:** a ProfilePage.
  - **Work pages:** the entry, plus breadcrumbs. The dissertation is a Thesis, with its programme, university and PDF.
  - **Log posts:** a BlogPosting, plus breadcrumbs.
  - **`/music`:** releases as MusicRecordings.
  - **YouTube items with the new `uploadDate` field:** a VideoObject.
  - **Validation:** every node on every page is checked against the schema.org definitions the site uses (`src/lib/testing/schema-org.ts`), in unit tests and in `e2e/seo.spec.ts`.
- **Share images.**
  - Work pages share their cover or their document's first page, cut to 1200 by 630 at build time.
  - Every other page shares a card with the name and headline, rendered by the new `pnpm media:og`, which also makes the icons. That fixed the one Lighthouse best-practices finding (a missing favicon).
  - `twitter:card` is `summary_large_image`.
- **`robots.txt`:** allows everything except `/admin` and `/api/`, and names the sitemap. The sitemap is checked to contain public pages only (no 404, `/dev`, `/admin`, `/demo` or `/api`).
- **Lighthouse CI asserts accessibility and SEO scores of 100** on the homepage, a work page and `/contact`. Locally, all three score 100 for accessibility, best practices and SEO, and 98 to 99 for performance.
- **Browser tests** (`e2e/seo.spec.ts`) check every page for:
  - one valid graph;
  - a canonical URL;
  - a unique title and description;
  - a share image that loads.

  They also check `robots.txt` and the icons.

- **Launch steps.** `deployment.md` steps 8 to 15, for Josh:
  - the domain on Cloudflare and attached to the Worker;
  - `www` redirected to the apex;
  - `workers.dev` switched off (a two-line change in `wrangler.jsonc`, marked there);
  - Email Routing for `hello@`;
  - Search Console and the online validators;
  - the old domain;
  - optional analytics.
- **Docs:**
  - `handoff.md`: final, how to keep the site going;
  - `roadmap.md`: what arrives with content and after launch;
  - README;
  - `CONTRIBUTING.md`: branches after the transformation;
  - `media-pipeline.md`: `media:screens` and `media:og`;
  - the authoring guide (`uploadDate`);
  - ADR-0049.
- **Not done, because it needs Josh's Cloudflare account:** the custom domain, disabling `workers.dev` and Email Routing. They are steps 8 to 12, and the site cannot launch until they are done.

### Pass 9: Responsive, performance and accessibility hardening (2026-10-05)

- **Content Security Policy, enforced** (spec Q.4; ADR-0048).
  - Every page carries a policy with a hash for each script and style element the build rendered: no inline script runs unless the build put it there, and only style attributes may be inline.
  - Outside scripts: Turnstile, and the Cloudflare Web Analytics host for when analytics are switched on.
  - `frame-ancestors 'none'` by header.
  - Own policies for `/documents/*`, `/demo/*` and `/admin`. The demo's configuration moved from an inline script to `demo/public/config.js` so it runs under `script-src 'self'`.
- **Every browser test runs under the policy** and fails on a violation in any page of this site (`e2e/fixtures.ts`). So every browser test is also a CSP test: every route in the sitemap, the wizard to success, the demo's whole quote request, the facades and the viewer. An injected script was used to check that the fixture reports violations.
- **`/contact` waits for its wizard** until the page has loaded and painted.
  - `DeferredContactWizard` with a new `client:afterload` directive.
  - The skeleton is server-rendered in the wizard's shape.
  - Its Largest Contentful Paint in Lighthouse went from 2.1 s to 1.66 s.
- **Budgets enforced in CI** (spec P.1).
  - `pnpm check:budgets`: homepage initial JavaScript 5.4 kB of 40 kB, and `/contact` 82 kB of 120 kB with the wizard included.
  - Lighthouse CI on the homepage, a work page and `/contact`: LCP, CLS and Total Blocking Time (for INP) on all three, and a performance score of 95 or more on home and work. Locally all three scored 99, with LCP 1.66 to 1.74 s, CLS 0 and TBT 0.
  - The homepage loads 163 kB on desktop and 169 kB on a phone with everything scrolled into view (budget 500 kB before video).
- **Responsive** (spec O). No page scrolls sideways at 320, 375, 390, 768, 1024, 1280 or 1440 px, including the returning homepage and the wizard's details step. Fixed: the email Copy button's tooltip hung past the edge at 375 and 390 px. It is gone, since the button has a visible label.
- **Touch targets at least 44 by 44 px** on every page and wizard screen. Fixed:
  - the name in the bar;
  - text buttons ("Cite");
  - footer links;
  - the email link;
  - the work breadcrumb;
  - timeline titles;
  - radio and checkbox rows (wizard engine, so the SCB demo too).
- **The bar no longer flickers.** With one 8 px threshold, the condensing bar and the browser's scroll anchoring moved each other every frame when a page rested just past the top, which also stopped clicks landing (it surfaced in CI on the taller wizard rows). The bar now condenses past 32 px and grows again within 8 px, and a browser test holds the page at 10, 20 and 30 px.
- **Forms.** 16 px text in every field. Help text is now tied to radio and checkbox options with `aria-describedby`; before, only errors were.
- **Keyboard.**
  - Every tab stop on every page shows a visible indicator.
  - The skip link is first and moves focus to the main content.
  - These flows were run by keyboard alone in the browser tests: the threshold, the contact wizard from first question to sent, the document viewer, and the video facade.
- **Caching** (spec P.3), checked against `wrangler dev`:
  - HTML `public, max-age=0, must-revalidate` (the Worker's default);
  - `/_astro/*` immutable for a year;
  - `/documents/*` and `/media/*` for a week.
- **Manual passes.** The keyboard pass is scripted (above). The screen-reader pass of spec R (VoiceOver or NVDA on the homepage, a work page, `/contact` and `/work/growtrades`) has not been done: it needs a person with a screen reader. It is listed for Josh under Open items.
- Docs: ADR-0048; ADR-0047's consequences; the analytics row in `deployment.md`.

### Pass 8: Music, media, GitHub and LinkedIn (2026-10-05)

- Facades (spec K.2; ADR-0046): YouTube and Spotify players show the real title and a thumbnail fetched by oEmbed at build time and served from this site (the 1280 px YouTube still where it exists), load nothing from the provider until Play, and fall back to the content's title and a plain panel if the provider cannot be reached. Every remote image is checked before Astro is asked for it, so a missing one never fails the build.
- The footage loop (spec K.3): poster first at a fixed 16:9, files attached within a screen of view and chosen for the screen (AV1, then H.264, portrait crop on upright phones), plays while half visible, pauses otherwise, never starts by itself with reduced motion, Save-Data or a slow connection, always has a pause and play button. Waiting for Josh's footage.
- `/music` (spec K.1) and the homepage music band (G.5): built from music entries (Spotify releases, YouTube videos, the first footage loop) and the profile's links, and only once a music entry exists; until then the page, the band, the Music link and the threshold's music answer stay out of production.
- GitHub (spec M.1): profile, pinned repositories and the contribution calendar from the GraphQL API at build time with `GH_PROFILE_TOKEN`, written to `src/data/github.snapshot.json`; without the token or if GitHub fails, the committed snapshot (real data, fetched 4 October 2026: 1,230 contributions in the last year, 8 public repositories). The homepage's Elsewhere section (G.8) is now live: the calendar in five palette steps with a summary and a monthly table for screen readers, pinned repositories (none pinned yet), the avatar served from this site, "Updated" date, and YouTube.
- LinkedIn (spec M.2): a plain card from the profile, shown once `links.linkedin` is set. Link previews are skipped until Josh supplies screenshots.
- Browser tests (`e2e/media.spec.ts`): no request to another host on any route before interaction (every request recorded, pages scrolled through), the YouTube facade's real title and local thumbnail, and Elsewhere from the snapshot with axe. Unit tests: oEmbed parsing and fallbacks, the image probe, GitHub parsing, the no-token and API-blocked fallbacks and the calendar helpers, the footage decisions, and the music selection.
- Docs: ADR-0046; the authoring guide's Music section; the GitHub token step in `deployment.md`.

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

## Gate state (last verified: Pass 10, 2026-10-05)

Node 24.21.0, pnpm 9.15.0, Windows.

- `pnpm format:check`: clean.
- `pnpm lint`: ESLint 0 errors and 0 warnings in the wizard, the site and the Worker; `scripts/check-design.mjs` clean.
- `pnpm typecheck`: 0 errors (wizard production and test tsconfig, Worker).
- `pnpm test`: **1,149 passed**: wizard 888 (70 files), site 139 (18 files, now including the structured data), Worker 122 (4 files).
- `pnpm --filter @jl/site check`: 0 errors, 0 warnings (one hint: `tseslint.config()` is deprecated).
- `pnpm --filter @jl/edge test`: 122/122.
- `pnpm build`: clean, no placeholders in the built site. Builds the wizard, then the SCB demo (1.3 MB, no source maps), then the site and the Worker.
- `pnpm check:budgets`: homepage 5.4 kB of 40 kB, `/contact` 82 kB of 120 kB (gzip).
- `pnpm test:e2e`: **147 passed** on desktop and an emulated phone (31 skipped: tests that run on one device only, such as the viewport matrix on desktop and touch sizes on the phone, and the case-study tests until GrowTrades is published). Every test runs under the enforced Content Security Policy with no violation; zero serious or critical axe violations; no request to another host before interaction on any route.
- Pass 10 acceptance:
  - Structured data validates against schema.org's definitions on every page (browser test). The online validators need the live URL ([`deployment.md`](deployment.md) step 13).
  - The sitemap lists only public pages.
  - Lighthouse accessibility and SEO are 100 on the key pages.
  - Spec X passes on every page (reviewed below).
- Pass 9 acceptance, still met: budgets; zero serious or critical axe violations; the CSP enforced with no violation on any route or flow the suite runs; no horizontal scroll at any width in the matrix.
- Lighthouse CI (homepage, `/work/kerr-microscopy-dissertation` and `/contact`; three mobile runs each, run locally with the CI configuration):
  - performance 99, 99 and 99;
  - accessibility, best practices and SEO 100 on all three;
  - LCP 1.74, 1.66 and 1.66 s;
  - CLS 0;
  - TBT 0 ms.
- PHP: none left; the plugin was deleted once the Worker matched it (ADR-0043).

## Anti-slop review (spec X), Pass 10: every page

Each page was reviewed at desktop width and on a phone. The homepage was reviewed both for a first visit and for a returning visitor. Pages: the homepage, `/work`, both work pages, `/research`, `/about`, `/contact`, `/privacy` and the 404.

- **No gradients, blur, glass or glow:** none anywhere. Covers sit on a hairline; the stage sections are flat black.
- **No purple:** none.
- **One accent:**
  - tungsten is only the stage buttons (the bar's "Start a conversation" over the threshold, "Get in touch");
  - it is the timeline's line on `/about`;
  - it is never text on paper.
- **No rows of identical cards:**
  - work rows and the research shelf show each document's own first page;
  - Elsewhere shows the real calendar;
  - the contact wizard's options are a selection list, not content cards.
- **Icons:** GitHub and YouTube marks beside their labels, and the menu icon with a label. Nothing decorative.
- **No spinners:** the wizard's skeleton is a flat pulse.
- **No all-caps labels, middle dots, arrows in link text, or coloured or italic headline words.**
- **Motion:** the threshold's transition and the timeline fill only, both off with reduced motion.
- **Copy:**
  - every sentence about Josh is from the profile or the entries;
  - the new share card says only the name, the headline and the domain;
  - the 404 says what happened and offers the homepage.
- **Without JavaScript:** every page reads in full. The browser tests check the homepage, `/work`, the menu and `/contact` without it.

## Anti-slop review (spec X), Pass 9

- Nothing new to look at: this pass changed sizes, not styles. Targets grew to 44 px without new borders, fills or shadows.
- One tooltip fewer: the email Copy button says what it does, so it needs none.
- The contact skeleton is the same flat pulse as before, now rendered by the page.
- No spinners, no motion added.
- Copy: one new sentence, for a wizard that fails to load ("The questions did not load. Reload the page to try again, or use the email address below.").

## Anti-slop review (spec X), Pass 8

- No gradients, blur or glow: the calendar is flat squares in palette steps; facades are flat stage panels with a still.
- No purple: none.
- One accent: tungsten only on the stage Play buttons.
- No identical cards: Elsewhere shows real data (the calendar), not tiles; the LinkedIn card is one plain card, shown only with a real profile URL.
- Icons: Simple Icons marks beside text labels; Lucide play and pause on the footage control, with a label and tooltip.
- No spinners.
- No all-caps labels, middle dots or arrows.
- Motion: the footage loop only (N.6), with reduced-motion, Save-Data and slow-connection rules and a pause button.
- Copy: titles come from the providers or the content; GitHub figures from GitHub; nothing invented.
- Aceternity: none used; link previews skipped without Josh's screenshots.
- Without JavaScript: facades are links to the video or track; the calendar and its table are plain HTML.

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

- **The domain and email** ([`deployment.md`](deployment.md) steps 8 to 12): `joshlennon.com` on Cloudflare and attached to the Worker, `www` redirected, then `workers.dev` switched off (tell Claude "the domain is live" for the `wrangler.jsonc` change), and Email Routing for `hello@joshlennon.com`. After launch, step 13: Search Console and the online structured-data validators.
- **A screen-reader pass before launch** (spec R): VoiceOver (Safari, Mac or iPhone) or NVDA (Windows, free) on the homepage, a work page, `/contact` and `/work/growtrades`. Listen for:
  - the threshold's question and its five answers;
  - the work rows' titles and links;
  - the GitHub summary;
  - each wizard step's heading as it changes, and the errors;
  - the success message with its reference.

  Record what you find here. The automated checks (axe on every page, keyboard flows) do not replace this.

- **Cloudflare set-up** (blocks the first real deploy, not the merges): account, `workers.dev` subdomain, API token, and the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets. Steps 1 to 3 in [`deployment.md`](deployment.md).
- **The contact form** (after the first deploy): a Turnstile widget and the `PUBLIC_TURNSTILE_SITE_KEY` variable, the Make.com scenario ([`make-com.md`](make-com.md)), and the four Worker secrets. Steps 4 to 6 in [`deployment.md`](deployment.md). Until then, messages are stored in D1 and wait.
- **Music** (spec W, K): the Spotify artist URL for `links.spotify`, the releases and music videos to feature, and encoded footage (`pnpm media:video` on a Lumix clip, after `winget install Gyan.FFmpeg`). One music entry brings the page, the band and the Music link.
- **GitHub**: pin up to four repositories to list them; add `GH_PROFILE_TOKEN` (`deployment.md` step 7) for fresh data on every deploy.
- **LinkedIn**: the profile URL for `links.linkedin` (the card and the footer link appear with it), and optionally screenshots of your GitHub and LinkedIn profiles for link previews.
- **The privacy notice** at `/privacy` is written for what the site does; read it, and check with the ICO's self-assessment whether the data protection fee applies to you. It says your inbox and Sheet copies are kept "only as long as I need them"; give a period if you prefer one.
- `awkwardapples/scb-handyman` and `awkwardapples/Handy-Man` are public and still hold the agency documents (SCB's ranking and enquiry figures, the agreement template, the sales PDF), the old Sheet link and the now-rotated webhook token on `main`. Josh is handling these repositories (spec W item 2).
- GitHub can keep serving the pre-rewrite commits to anyone who already has their hashes until it garbage-collects them; GitHub Support can purge them on request (first changed commit `fa585a21686cd0bb88e015af7870ae735d3e40cb`).
- Any clone made before the Pass 0 rewrite must be re-cloned rather than pushed from. This machine's clone still holds the old objects in its reflog until `git reflog expire --expire=now --all && git gc --prune=now` is run.
- Node 24 for local work: `nvm use 24.21.0` (installed on this machine alongside Node 20, which stays the default), then `corepack enable pnpm`.
