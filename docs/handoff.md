# Handoff

How to keep this site going: for Josh, and for whoever (or whichever agent) works on it next. The transformation in [`portfolio-spec.md`](portfolio-spec.md) section V is complete. Passes 0 to 10 are merged, and what remains is content and a few one-time set-up steps that only Josh can do.

## What the site is

- `apps/site` is an Astro site. Every page is pre-rendered, and React islands handle the interactive parts: the contact wizard, the copy button, the demo frame and the footage loop.
- `apps/edge` is a Cloudflare Worker. It serves those files and `/api/submit`, stores messages in D1 and forwards them to Make.com.
- `apps/wizard` is the GrowTrades form engine the contact wizard is built on. It also contains the SCB Handyman site, built as the demo at `/demo/scb-handyman`.

The architecture is in [ADR-0039](decisions/0039-portfolio-architecture.md) and [ADR-0040](decisions/0040-cloudflare-hosting-and-deploy.md), and the rest of the decisions are indexed in [`decisions/README.md`](decisions/README.md).

## Before launch: what only Josh can do

The full list, with each item's reason, is under Open items in [`current-state.md`](current-state.md). In order:

1. **Cloudflare**, [`deployment.md`](deployment.md) steps 1 to 3. Merges deploy as soon as the two repository secrets exist; until then the deploy job passes with a "Deploy skipped" notice.
2. **The contact form**, steps 4 to 6: Turnstile, [Make.com](make-com.md) and the four Worker secrets. Until then messages are stored in D1 and wait to be forwarded.
3. **The domain**, steps 8 to 11: `joshlennon.com` on Cloudflare and attached to the Worker, `www` redirected, and `workers.dev` switched off.
4. **A screen-reader pass** (VoiceOver or NVDA). The checklist is in `current-state.md`.
5. **Content is in** (7 October 2026). `pnpm content:todo` prints any placeholder or draft that comes back; today there are none. What could still be added is under "As content arrives" in [`roadmap.md`](roadmap.md).

## Everyday tasks

| Task                                        | How                                                                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Add a post, a project or a release          | [`authoring-guide.md`](authoring-guide.md): `/admin`, `pnpm new`, or by hand. New entries start as drafts.                |
| Add photos, a PDF, a footage loop           | [`media-pipeline.md`](media-pipeline.md): `pnpm media:images`, `media:pdf`, `media:video`                                 |
| Change the name or headline on share images | Edit the profile, then `pnpm media:og`                                                                                    |
| Answer a data request or rotate a secret    | [`data-protection.md`](data-protection.md)                                                                                |
| See what is deferred and why                | [`technical-debt.md`](technical-debt.md)                                                                                  |
| Check a change before merging               | `pnpm gates`; CI runs the same, plus Lighthouse                                                                           |
| Deploy                                      | Merge to `main`. The Deploy workflow also runs daily (fresh GitHub data) and by hand: **Actions > Deploy > Run workflow** |

## Working on the code

1. **Set up** Node 24 and pnpm: `nvm use 24.21.0`, `corepack enable pnpm`, `pnpm install`. Install Playwright's Chromium once: `pnpm --filter @jl/site exec playwright install chromium`.
2. **Branch** from `main` (`feat/`, `fix/`, `docs/`), and open a pull request. A merge to `main` deploys. [`CONTRIBUTING.md`](../CONTRIBUTING.md) has the rules for commits, ADRs and dependencies (spec U.6 lists the approved ones).
3. **Run** `pnpm gates` before pushing. On Windows, stop any leftover `wrangler dev` first, because the browser tests start their own Worker on port 8788 and a fresh local D1.

The checks fail on the following, by design:

| Check                     | Fails on                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Content build             | A `TODO(josh)` placeholder in published content                                                                                                                                                                                                                                                                                                                   |
| ESLint and `check-design` | Banned design patterns (gradients, spinners, raw colours)                                                                                                                                                                                                                                                                                                         |
| Browser tests             | <ul><li>A Content Security Policy violation on any page (so a new inline script must be bundled, or hashed in `astro.config.mjs`)</li><li>A request to another host before the visitor interacts</li><li>Serious axe findings</li><li>Sideways scroll at any width from 320 to 1440 px</li><li>A tap target under 44 px</li><li>Invalid structured data</li></ul> |
| `pnpm check:budgets`      | JavaScript over budget (homepage 40 kB, `/contact` 120 kB, gzipped)                                                                                                                                                                                                                                                                                               |
| Lighthouse CI             | LCP over 2.0 s, CLS over 0.05, TBT over 200 ms, accessibility or SEO under 100, or performance under 95 on the home and work pages                                                                                                                                                                                                                                |

When something is added, these are the places to update:

| Adding                                 | Update                                                                                         |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| An outside script, frame or image host | `security.csp` in `apps/site/astro.config.mjs`, and `/privacy` if it receives visitor data     |
| A page                                 | Nothing: the sitemap, CSP, structured-data and viewport tests pick it up from the sitemap      |
| A page with a performance budget       | `lighthouserc.json`                                                                            |
| A large island                         | `client:afterload` (ADR-0048) or `client:visible`, so it does not compete with the first paint |

## Rules that do not expire

- **Never invent facts about Josh.** Missing facts are `TODO(josh)` placeholders, and they keep the entry a draft.
- **Mercor:** nothing beyond the confirmed lines. Never name or hint at Mercor's clients, never describe the role as employment, and keep "[Contract]" in the title.
- **Keep private data out of the repository and the site:** secret values (the Make.com webhook URL above all), real SCB customer data, and anyone's home address or personal phone number. Josh's email address (joshlennon71@gmail.com) appears only beside the contact form, in the privacy notice, in the CV and on the paper's title page: Josh's choice, 7 October 2026. The form is the way in, so it goes nowhere else.
- **The SCB images are licensed.** The sources in `apps/wizard/src/assets/images` are kept byte for byte; only the demo's build copies are re-encoded.
- **Don't link** the `scb-handyman` or `Handy-Man` repositories while they hold agency documents; `src/lib/github.ts` refuses them even if they are listed in the profile.
- **Writing about Josh:** use they/them or no pronouns.

## Where the record is

| Document                                 | What it records                                  |
| ---------------------------------------- | ------------------------------------------------ |
| [`current-state.md`](current-state.md)   | Every pass, the last gate run and the open items |
| [`roadmap.md`](roadmap.md)               | What could come after launch                     |
| [`portfolio-spec.md`](portfolio-spec.md) | The original specification (v1.2)                |
