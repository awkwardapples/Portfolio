# ADR-0002: pnpm workspaces over Nx or Turborepo

**Status:** Accepted
**Date:** 2026-05-11

## Context

The repository contains two distinct buildable artifacts: a React app (`apps/wizard/`) and a WordPress plugin (`plugins/quote-wizard/`). The plugin is PHP and consumes the React app's built output but does not share any runtime code with it.

We need a way to manage shared tooling (Prettier, EditorConfig, Husky), to coordinate scripts across packages, and to keep dependency installation efficient.

## Decision

We use **pnpm workspaces** with a single `pnpm-workspace.yaml` declaring `apps/*` as the workspace pattern. No additional monorepo tooling (Nx, Turborepo, Lerna, Rush) is introduced.

## Alternatives considered

**Nx.**

- Pros: caching, task graph, generators.
- Cons: significant learning curve, opinionated about project structure, adds substantial dev-time complexity for what amounts to two buildable units.

**Turborepo.**

- Pros: caching, parallel task execution.
- Cons: incremental benefits are real only when there are many packages or many engineers. With two packages and a small team, the setup time exceeds the benefit.

**No workspaces (separate directories, separate `node_modules`).**

- Pros: simplest possible mental model.
- Cons: duplicated installs, no shared lockfile, harder to keep Prettier and other root-level tools consistent.

**npm workspaces.**

- Pros: built into npm, no additional install.
- Cons: pnpm is strictly faster, uses less disk via content-addressed storage, and is stricter about phantom dependencies — catching a class of bug that npm allows.

## Consequences

**Easier:**

- One `pnpm install` at the root sets up everything.
- Adding a third package (e.g. a future shared types package, if we ever justify one) is a one-line change to `pnpm-workspace.yaml`.
- Cross-package scripts via `pnpm --filter` are straightforward.

**Harder:**

- Engineers must use pnpm specifically. The `packageManager` field in `package.json` enforces this at install time. The `.nvmrc` and root README direct new engineers to install pnpm before anything else.

**To revisit:**

- If the repo grows past ~5 distinct packages or if build/test times become a bottleneck, we reassess Turborepo. The pnpm workspace structure does not have to change to adopt it later.
