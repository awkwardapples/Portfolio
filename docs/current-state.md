# Current State

_Last updated: 2026-10-04 (Portfolio Pass 2)_

This repository is being turned into Josh Lennon's portfolio. The governing document is [`docs/portfolio-spec.md`](portfolio-spec.md) (v1.2). Work happens in the passes of its section V on the `portfolio-transformation` branch, with a draft pull request open against `main` and a merge to `main` at the end of each pass once its gates are green. The GrowTrades platform's own state, as last recorded, is archived in [`archive/growtrades-platform/current-state.md`](archive/growtrades-platform/current-state.md).

## Passes

| Pass | Scope                                      | Status          |
| ---- | ------------------------------------------ | --------------- |
| 0    | Security and repository hygiene            | Done 2026-10-03 |
| 1    | Architecture scaffold                      | Done 2026-10-04 |
| 2    | Content model, migration and media tooling | Done 2026-10-04 |
| 3    | Visual system and global layout            | Next            |
| 4    | Homepage, threshold and navigation flow    |                 |
| 5    | Work, research, log and about pages        |                 |
| 6    | Contact wizard and submission pipeline     |                 |
| 7    | GrowTrades case study and SCB demo         |                 |
| 8    | Music, media, GitHub and LinkedIn          |                 |
| 9    | Responsive, performance and accessibility  |                 |
| 10   | SEO foundations, documentation and launch  |                 |

## What exists

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

## Gate state (last verified: Pass 2, 2026-10-04)

Node 24.21.0, pnpm 9.15.0, Windows.

- `pnpm format:check`: clean.
- `pnpm lint`: ESLint 0 errors and 0 warnings in the wizard, the site and the Worker; `scripts/check-design.mjs` clean.
- `pnpm typecheck`: 0 errors (wizard production and test tsconfig, Worker).
- `pnpm test`: **889 passed**: wizard 856/856 (66 files), site 27 (2 files), Worker 6 (1 file).
- `pnpm --filter @jl/site check`: 0 errors, 0 warnings (one hint: `tseslint.config()` is deprecated).
- `pnpm --filter @jl/edge test`: 6/6.
- `pnpm build`: clean, no placeholders in the built site. Wizard JS 99.50 kB gzip (unchanged); site 2 pages (content pages arrive in Passes 4 and 5) and 2 documents; Worker dry run reads 15 asset files.
- Pass 2 acceptance: a placeholder planted in a published entry fails the production build, naming the file and field (`tags[1]`; in the body, `body, line 7`), and the build passes once it is removed; a schema mistake names the entry, the file and each field; a post made with `pnpm new` and one made by hand both appear at `/dev/content`, including one added while the dev server was running; PDF covers render on Windows (all three of Josh's PDFs) and in CI on Linux; `media:images` output carries no EXIF.
- PHP: not run; the plugin is unchanged.

## Open items

Needs Josh, for content (each one keeps an entry or item a draft until it is answered; `pnpm content:todo` has the full list):

- **The deep-learning paper.** The PDF on the old site prints a personal Gmail address on page 1, which spec U.8 keeps off the site, so it is not committed. It is titled "Introduction to Deep Learning" inside but "Understanding Deep Learning" on the old site, and it lists Anirbit Mukherjee as a second author, so it cannot be described as sole or independent work. Needed: a PDF without the personal address, the title to use, and how to describe the authorship.
- **Degree title on the dissertation.** The dissertation's title page says "Bachelor of Science in Computer Science"; spec 1.2 records the degree as "BSc Artificial Intelligence", which the profile uses. Nothing is changed until Josh says which is right (the PDF itself cannot be changed). The title page also names the supervisor; the entry leaves the name off until Josh says otherwise.
- **Headshot.** `Headshot.png` (spec U.8) is not on this machine; the profile has no portrait until it is added with `pnpm media:images Headshot.png --to apps/site/src/content/profile --name portrait`.
- None of the three PDFs has an embedded title. Optional: re-export with File, Properties, Title set.

Needs Josh, for set-up:

- **Cloudflare set-up** (blocks the first real deploy, not the merges): account, `workers.dev` subdomain, API token, and the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets. Steps in [`deployment.md`](deployment.md).
- `awkwardapples/scb-handyman` and `awkwardapples/Handy-Man` are public and still hold the agency documents (SCB's ranking and enquiry figures, the agreement template, the sales PDF), the old Sheet link and the now-rotated webhook token on `main`. Josh is handling these repositories (spec W item 2).
- GitHub can keep serving the pre-rewrite commits to anyone who already has their hashes until it garbage-collects them; GitHub Support can purge them on request (first changed commit `fa585a21686cd0bb88e015af7870ae735d3e40cb`).
- Any clone made before the Pass 0 rewrite must be re-cloned rather than pushed from. This machine's clone still holds the old objects in its reflog until `git reflog expire --expire=now --all && git gc --prune=now` is run.
- Node 24 for local work: `nvm use 24.21.0` (installed on this machine alongside Node 20, which stays the default), then `corepack enable pnpm`.
