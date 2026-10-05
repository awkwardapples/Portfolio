# Josh Lennon: portfolio

The source of [joshlennon.com](https://joshlennon.com), Josh Lennon's personal portfolio: a static Astro site served by a Cloudflare Worker, with a contact wizard built on the quote-wizard engine from GrowTrades.

> **Status:** built (Passes 0 to 10 of [`docs/portfolio-spec.md`](docs/portfolio-spec.md) are merged). Launch waits on the Cloudflare, contact-form and domain steps in [`docs/deployment.md`](docs/deployment.md); [`docs/handoff.md`](docs/handoff.md) explains how to continue.

---

## What is in this repository

| Path           | What it is                                                                                                                                                                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/site/`   | The portfolio (`@jl/site`): Astro, every page pre-rendered, React islands for the interactive parts.                                                                                                                                           |
| `apps/edge/`   | The Cloudflare Worker (`@jl/edge`) that serves the site and the `/api/*` routes, with D1 migrations in `migrations/`.                                                                                                                          |
| `apps/wizard/` | The wizard engine (`@growth-ops/wizard`): a config-driven form engine with a pure state machine, typed ports for persistence and submission, and 888 tests. It also contains the SCB Handyman site, built as the demo at `/demo/scb-handyman`. |
| `scripts/`     | Repository checks (`check-design.mjs`, `check-budgets.mjs`), `pnpm new`, and the media tools in `scripts/media/`.                                                                                                                              |
| `docs/`        | The spec, living documents and decision records. GrowTrades-era documents are in `docs/archive/growtrades-platform/`.                                                                                                                          |

---

## Prerequisites

| Tool | Version       | Notes                                                                                                             |
| ---- | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| Node | 24 LTS        | Pinned in `.nvmrc`. Astro 7 and Wrangler 4 need Node 22.12 or newer. With nvm for Windows: `nvm install 24.21.0`. |
| pnpm | 9.15          | Pinned in `package.json` (`packageManager`). `corepack enable pnpm` installs the right version.                   |
| Git  | 2.30 or newer |                                                                                                                   |

## Quick start

```bash
nvm use 24.21.0          # or any Node 24
corepack enable pnpm
pnpm install
pnpm dev                 # the site at http://localhost:4321
```

To run the Worker with the built site, as it runs on Cloudflare:

```bash
pnpm build
pnpm --filter @jl/edge dev   # http://localhost:8787, try /api/health
```

## Gates

Every change passes the gates in spec V.0. `pnpm gates` runs them all in order:

| Command                        | Checks                                                                                                                                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm format:check`            | Prettier                                                                                                                                                                                                    |
| `pnpm lint`                    | ESLint in every package, then the design check for `.astro` and CSS                                                                                                                                         |
| `pnpm typecheck`               | TypeScript in the wizard and the Worker                                                                                                                                                                     |
| `pnpm test`                    | Vitest in every package (wizard, site and Worker)                                                                                                                                                           |
| `pnpm --filter @jl/site check` | `astro check` for the site                                                                                                                                                                                  |
| `pnpm --filter @jl/edge test`  | The Worker's tests                                                                                                                                                                                          |
| `pnpm build`                   | Wizard build, the SCB demo, site build, Worker dry run                                                                                                                                                      |
| `pnpm check:budgets`           | JavaScript budgets on the built site: homepage 40 kB, `/contact` 120 kB (gzip)                                                                                                                              |
| `pnpm test:e2e`                | Playwright and axe against the built site in `wrangler dev`, every test under the enforced Content Security Policy; install the browser once with `pnpm --filter @jl/site exec playwright install chromium` |

CI runs the same gates on every pull request, plus Lighthouse CI on the homepage, a work page and `/contact` (`.github/workflows/ci.yml`). Pushes to `main` deploy (`.github/workflows/deploy.yml`, [`docs/deployment.md`](docs/deployment.md)).

## Documentation

- [`docs/portfolio-spec.md`](docs/portfolio-spec.md): the governing specification.
- [`docs/current-state.md`](docs/current-state.md): what is built, the last gate run and open items.
- [`docs/handoff.md`](docs/handoff.md): how to keep the site going. Start here.
- [`docs/roadmap.md`](docs/roadmap.md), [`docs/technical-debt.md`](docs/technical-debt.md): what is next and what is deferred.
- [`docs/authoring-guide.md`](docs/authoring-guide.md), [`docs/media-pipeline.md`](docs/media-pipeline.md): adding content and media.
- [`docs/deployment.md`](docs/deployment.md): hosting, the deploy workflow and the one-time Cloudflare set-up.
- [`docs/decisions/`](docs/decisions/README.md): architecture decision records. 0001 to 0038 record the GrowTrades platform; 0039 onwards the portfolio.

Before opening a pull request, read [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Licence

This codebase is proprietary and not licensed for redistribution. See [`LICENSE`](LICENSE).
