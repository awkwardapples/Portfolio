# Growth Operations Platform

A WordPress-based lead generation platform with an embedded React quote wizard, built for local trades businesses. This repository is the source of truth for the React engine, the WordPress plugin, the Make.com automation blueprints, and all supporting documentation.

> **Status:** Closing Phase 5 - Wired the WordPress plugin to do real work and ready to connect to Make.com, HubSpot, and email.. This README is updated as later phases land.

---

## What is in this repository

| Path                    | What it is                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| `apps/wizard/`          | The React + TypeScript quote wizard (built with Vite).                                                      |
| `plugins/quote-wizard/` | The WordPress plugin that hosts the wizard, exposes the REST submission endpoint, and forwards to Make.com. |
| `config/trades/`        | Reference pricing configs (JSON) and the canonical TypeScript types/schema.                                 |
| `automation/`           | Make.com scenario blueprints, HubSpot property definitions, email templates.                                |
| `docs/`                 | Architecture, roadmap, risk analysis, pricing engine spec, and Architecture Decision Records (ADRs).        |
| `scripts/`              | Build and packaging scripts.                                                                                |

For the full layout and the rationale behind it, see [`docs/03-project-structure.md`](docs/03-project-structure.md).

---

## Prerequisites

| Tool     | Version | Notes                                                                |
| -------- | ------- | -------------------------------------------------------------------- |
| Node     | 20 LTS  | Pinned via `.nvmrc`. Run `nvm use` after cloning.                    |
| pnpm     | 9.x     | Pinned via the `packageManager` field in `package.json`.             |
| Git      | 2.30+   |                                                                      |
| LocalWP  | latest  | For running a local WordPress with the plugin installed.             |
| PHP      | 8.2     | LocalWP installs this for you inside its environment.                |
| Composer | 2.x     | Used inside `plugins/quote-wizard/` for autoloading and dev tooling. |

---

## Quick start

```bash
# 1. Use the pinned Node version
nvm use

# 2. Install JS dependencies (root + workspaces)
pnpm install

# 3. Verify formatting
pnpm format:check
```

At this point in Phase 3A there is nothing to run yet — the React app and plugin code arrive in steps 3B and 3D. The current state is "the repo is scaffolded; formatting and Git hooks work." See [`docs/04-implementation-roadmap.md`](docs/04-implementation-roadmap.md) for what comes next.

---

## Documentation map

Start here:

- [`docs/01-system-overview.md`](docs/01-system-overview.md) — what this system is, who it serves, success criteria.
- [`docs/02-architecture.md`](docs/02-architecture.md) — component diagram, data flow, security model, GDPR.
- [`docs/03-project-structure.md`](docs/03-project-structure.md) — the full repository layout with annotations.
- [`docs/04-implementation-roadmap.md`](docs/04-implementation-roadmap.md) — phases, tickets, acceptance criteria.
- [`docs/05-risk-analysis.md`](docs/05-risk-analysis.md) — known risks and mitigations.
- [`docs/06-pricing-engine-spec.md`](docs/06-pricing-engine-spec.md) — the formal pricing engine contract.
- [`docs/decisions/`](docs/decisions/) — Architecture Decision Records (ADRs).

Before opening a pull request, read [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

## Licence

This codebase is proprietary and not licensed for redistribution. See [`LICENSE`](LICENSE).
