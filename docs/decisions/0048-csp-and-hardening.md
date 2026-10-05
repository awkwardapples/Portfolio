# ADR-0048: The Content Security Policy, the deferred contact wizard, and hardening checks in CI

**Status:** Accepted
**Date:** 2026-10-05 (Portfolio Pass 9)

## Context

Pass 9 asks for every requirement in spec O (responsive), P (performance) and R (accessibility) to be met and enforced in CI, and for the Content Security Policy of spec Q.4 to be enforced with no violations on any route. The spec suggests running the policy as report-only first. Three facts shaped the decisions below:

- Astro 7 can write a hashed policy into each page (`security.csp`), but only as a `<meta>` element. A meta policy cannot carry `frame-ancestors` and cannot be report-only, and Astro does not hash `is:inline` scripts.
- The SCB demo (ADR-0044) is a Vite page with an inline configuration script, and the content editor (ADR-0041) loads Sveltia CMS from unpkg.
- On `/contact`, Lighthouse's simulated throttling treated the React and wizard modules (about 75 kB) as part of the first paint, because Astro requests them while the page is still painting. That put the page's Largest Contentful Paint at 2.1 s against a 2.0 s budget.

## Decision

**The policy.**

- Every Astro page carries a meta policy with a hash for each script and style element it renders: `script-src 'self'`, Turnstile and the Cloudflare Web Analytics beacon host (allowed now so that switching analytics on needs no code change; `/privacy` must say so first). No `'unsafe-inline'` or `'unsafe-eval'` for scripts.
- Styles are stricter than spec Q.4: style elements are hashed, and `'unsafe-inline'` applies only to style attributes (`style-src-attr`), which is what the spec's reason (React and `motion` style attributes) needs. Shiki's syntax highlighting uses style attributes, so Astro's build warning about it does not apply.
- The layout's early script (`html.js` and the stored intent) lives in `src/lib/early-script.ts`; the layout renders that string and `astro.config.mjs` adds its hash, so the two cannot drift.
- `public/_headers` adds `frame-ancestors 'none'` everywhere by header.
  - `/documents/*` gets its own header policy (framed by this site only).
  - So does `/demo/*`, which has no meta policy. Its configuration moved from an inline script to `demo/public/config.js`, so it runs under `script-src 'self'`.
  - `/admin` and `/admin/*` get a policy scoped to Sveltia CMS (unpkg, the GitHub API, GitHub images). The page is served at `/admin`, which `/admin/*` does not match, so both rules exist.
  - Each path with its own policy detaches the global header first, since two policies would both apply.
- **No report-only phase in production.** A meta policy cannot be report-only, and the site has no production traffic yet. Instead, every browser test runs under the enforced policy (`e2e/fixtures.ts`) and fails on any violation in a page of this site. That covers every route in the sitemap and every flow the suite exercises: the contact wizard to success, the demo's whole quote request, the facades, the PDF viewer and filters. Nothing reaches `main` unless the suite is clean.

**The deferred contact wizard.**

- `/contact` server-renders a skeleton in the wizard's shape (`DeferredContactWizard`). A small custom directive, `client:afterload` (`src/directives/after-load.ts`, registered by `integrations/after-load.mjs`), hydrates it after three things happen in order:
  1. the `load` event;
  2. the browser's own first-contentful-paint entry, with two animation frames as the fallback and never more than three seconds;
  3. an idle moment.
- Only then is the wizard imported. The wizard itself still never runs on the server, as spec P.2's `client:only` intended.
- Astro's `client:idle` was tried first. It can fire before the first paint, which left `/contact` at 1.66 s or 2.27 s depending on the run. Waiting for `load` alone was not enough either, because Lighthouse's first paint comes after `load`.

**Checks in CI.**

- `pnpm check:budgets` (`scripts/check-budgets.mjs`) measures each built page's JavaScript, gzipped, by following the imports through Vite's chunks. It covers the homepage's initial JavaScript without `client:visible` islands (40 kB budget) and everything `/contact` loads, the dynamically imported wizard included (120 kB budget).
- Lighthouse CI (ADR-0047) now runs on the homepage, a work page and `/contact`:
  - LCP of 2.0 s or less, CLS of 0.05 or less, and Total Blocking Time of 200 ms or less (the lab stand-in for Interaction to Next Paint) on all three;
  - a performance score of 95 or more on the home and work pages.
- `e2e/hardening.spec.ts` covers:
  - the viewport matrix of spec O (320 to 1440 px, every page plus the wizard's details step);
  - 44 by 44 px touch targets on the phone project (links inside running text are exempt, as in WCAG 2.5.8);
  - 16 px form text;
  - help text tied to choices;
  - a visible focus indicator at every tab stop of every page;
  - the skip link;
  - the homepage's weight before any video.

## Alternatives considered

- **A Content Security Policy header per page, generated from the build.** Rejected: it duplicates what Astro already writes, and a stale `_headers` entry would block a page's own scripts.
- **`'unsafe-inline'` for the demo's script.** Rejected: moving four lines of configuration into a file costs nothing.
- **Report-only through a reporting endpoint on the Worker.** Rejected for now: there is no traffic to report on before launch, and the browser suite already enforces the policy on every flow. It can be added after launch if a third party is ever introduced.
- **Making the wizard render on the server.** Rejected: it reads the URL, `localStorage` and `sessionStorage` as it starts, and server rendering would add a hydration step for no benefit to the visitor.

## Consequences

- A new inline script anywhere fails the browser tests until it is bundled or hashed.
- A new outside host (an analytics provider, another embed) needs an entry in `astro.config.mjs`, and the privacy notice first.
- On a slow connection the wizard appears a moment after the rest of `/contact`. The skeleton holds its place, and the email address below it works throughout.
- The screen-reader passes spec R asks for (VoiceOver or NVDA) are manual and are recorded in `docs/current-state.md` when done.
