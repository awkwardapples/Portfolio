# ADR-0039: Portfolio architecture: Astro static site plus a Worker; WordPress leaves this repository

**Status:** Accepted
**Date:** 2026-10-04 (Portfolio Pass 1)

## Context

This repository becomes Josh Lennon's personal portfolio ([`docs/portfolio-spec.md`](../portfolio-spec.md)). Its old host, a WordPress plugin rendering an empty `<div id="qw-root">` and building every page in the browser, is the wrong model for a content site: search engines and link previews see no content, unknown routes render the homepage as soft 404s, and the bundle was over twice its budget (spec B.4). The wizard engine in `apps/wizard`, by contrast, is pure, typed and covered by 856 tests, and is worth keeping (spec B.2).

## Decision

The repository is a pnpm monorepo of three packages:

- **`apps/site` (`@jl/site`)**: an Astro site. Every page is pre-rendered (`output: 'static'`), with one URL per page (`trailingSlash: 'never'`, `build.format: 'file'`). Interactive parts are React islands. Tailwind 3.4 runs through PostCSS with a replaced, closed theme, as in the wizard (ADR-0003). The alias `@` keeps meaning `apps/wizard/src`, because the engine's files import each other that way; the site's own code uses `~`.
- **`apps/edge` (`@jl/edge`)**: a Cloudflare Worker that serves the built site and the `/api/*` routes (ADR-0040). It starts with `GET /api/health`; `POST /api/submit` is the TypeScript port of the plugin's pipeline (Pass 6, ADR-0043).
- **`apps/wizard` (`@growth-ops/wizard`)**: unchanged in role. Its engine powers the contact wizard; its SCB site becomes a static demo (Pass 7). The package name is kept, because renaming it would touch scripts and documents for no gain.

`plugins/quote-wizard/` leaves the build and CI now, but stays in the tree as the reference implementation until Pass 6 ports it with parity tests and deletes it. The plugin build scripts (`scripts/build-plugin.mjs`, `scripts/package-plugin.mjs`, `.distignore`) and their `archiver` dependency are removed.

Versions, checked on the day rather than taken from the spec's notes:

- **Astro 7.3.5**, not the 6.x the spec mentions; the spec says to use the current stable release. `@astrojs/react` 7 supports React 18, so the wizard and site stay on React 18 and no upgrade is needed.
- **Node 24 LTS.** Astro 7, its integrations and Wrangler 4 all require Node 22.12 or newer, and Node 20 reached end of life in April 2026. `.nvmrc` is `24`; `engines.node` is `>=22.12.0`. The wizard's 856 tests, typecheck and build pass unchanged on Node 24.
- **TypeScript 5.9** across the packages (`@astrojs/check` does not support TypeScript 7).

Tooling:

- The design bans from ADR-0012 (gradients, blur, spinners, raw hex, arbitrary values, marketing words, emoji) now live in `apps/wizard/eslint-local/design-constraints.js`, shared by the wizard's and the site's ESLint configs. `.astro`, `.css` and `.mdx` files are checked by `scripts/check-design.mjs`, which also implements the spec's "no spinners" check (P.4), because linting `.astro` files would need `eslint-plugin-astro`, outside the approved dependencies (spec U.6). For the same reason Prettier does not format `.astro` files.
- `pnpm gates` runs every gate in spec V.0 in order.
- No new dependencies beyond spec U.6: the site and Worker reuse the wizard's existing versions of TypeScript, Vitest, ESLint, Tailwind and PostCSS.

## Alternatives considered

- **Keep WordPress and add server-rendered templates.** Rejected: PHP templates would duplicate the React site, and the host would keep the cost and attack surface of WordPress for a static portfolio.
- **Next.js or a Vite SPA.** Rejected: a content portfolio needs pre-rendered HTML with a little interactivity, which is Astro's model; Next.js would add a server runtime for nothing.
- **Astro 5 to stay on Node 20.** Rejected: Node 20 is past end of life, and the spec relies on features of current Astro (stable CSP support, the content layer with Zod 4).

## Consequences

- Every page is real HTML, so content is indexable, fast and works without JavaScript.
- Developers need Node 24 locally (`nvm install 24` then `nvm use 24` on Windows) and pnpm through Corepack (`corepack enable pnpm`).
- The engine is consumed as source through the `@` alias rather than as a published package, so the site's build type-checks and bundles exactly the code the wizard's tests cover.
- pnpm 9 can leave `node_modules` without `@emnapi/core` and `@emnapi/runtime` after incremental installs, which breaks `astro check` (its `@astrojs/astro2tsx` dependency is WebAssembly-only). A fresh install fixes it; CI always installs fresh. Recorded in [`docs/technical-debt.md`](../technical-debt.md).
