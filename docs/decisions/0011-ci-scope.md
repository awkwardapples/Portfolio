# ADR-0011: Continuous Integration scope

**Status:** Accepted
**Date:** 2026-05-23

## Context

Step 3G introduces GitHub Actions CI. The project is a private, single-team agency platform with one supported runtime target per language (Node 20, PHP 8.1) and one deployment target (Cloudways/Linux). We need to decide what CI does — and, just as importantly, what it deliberately does not do yet.

The guiding principle established across Steps 3A–3F is **operational clarity over cleverness**, and **parity between local and CI commands**. Windows + LocalWP has already surfaced environmental edge cases (Step 3D, Step 3F); CI running on Linux gives us cross-platform coverage for free, but only if the commands are genuinely the same ones developers run.

## Decision

CI codifies the already-proven local gate sequence. It does not invent a separate process.

**Triggers:** `push` to `main` and all `pull_request`.

**Two parallel jobs**, no inter-job dependency (so a failure in one doesn't mask the other):

1. **js-ts** (Node 20, from `.nvmrc`): `pnpm install --frozen-lockfile` → `format:check` → `lint` → `typecheck` → `build-plugin` → source-map guard → manifest guard.
2. **php** (PHP 8.1): `composer install` → `composer lint` (PHPCS) → `composer analyse` (PHPStan) → `composer test` (Pest).

**Hard-fail conditions** (each tied to a real mechanism, not a hope):

| Condition                           | Mechanism                                                                         |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| Stale `pnpm-lock.yaml`              | `pnpm install --frozen-lockfile`                                                  |
| Missing/malformed `manifest.json`   | `build-plugin.mjs` `fatal()` + explicit CI guard step                             |
| Source-map leakage into plugin dist | Explicit CI `find` guard (defence in depth over the build script)                 |
| PHPCS warnings (not only errors)    | `ignore_warnings_on_exit=0` in `phpcs.xml.dist` — enforced identically local + CI |
| PHPStan notices                     | PHPStan exit code at configured level                                             |

**CI calls `pnpm build-plugin`, not a bare build** — this exercises the actual Step 3F production packaging path, so CI validates what we ship, not a dev-only build.

## Deliberately deferred (future-facing TODOs)

These are **intentionally omitted** at the current maturity. Each has a clear trigger for when to revisit:

- **Matrix testing** (multiple Node/PHP versions): deferred until we actually support more than one runtime per language. Today there is exactly one supported version each (Node 20, PHP 8.1). A matrix now would multiply run time and YAML complexity for zero coverage gain. **Revisit when:** a second supported PHP or Node version becomes a real requirement (e.g. a client host pins a different PHP).
- **Dependency caching** (`actions/cache` for Composer; explicit pnpm store cache beyond `setup-node`'s built-in): deferred until workflow run time justifies the added YAML. **Revisit when:** CI wall-clock becomes a friction point (rough threshold: routinely > 5 minutes).
- **Release automation** (building/uploading the plugin ZIP, tagging, GitHub Releases): intentionally omitted. 3G is **gates only**. Packaging-to-release is a separate concern with its own security surface (signing, provenance) and should be designed deliberately, not bolted onto the gate workflow. **Revisit when:** we reach a deployment step in Phase 7 that needs reproducible release artifacts.
- **Artifact uploads / deploy previews:** none for now. The gate either passes or fails; we don't publish build outputs from CI yet. **Revisit when:** a reviewer workflow genuinely needs to download a built ZIP from a PR.

## Alternatives considered

**A. Matrix from the start (Node 18+20, PHP 8.1+8.2+8.3).**

- Pros: catches version-specific issues early.
- Cons: we don't support those versions. Testing matrices for environments we don't ship to is testing theatre. Rejected until multi-version support is real.

**B. One combined job running both JS and PHP sequentially.**

- Pros: marginally simpler YAML.
- Cons: a PHP failure would prevent seeing JS results and vice-versa. Parallel jobs give complete feedback on every run. Rejected.

**C. Enforce warnings-fail via a CI-only phpcs flag.**

- Pros: no change to `phpcs.xml.dist`.
- Cons: breaks local/CI parity — `composer lint` would behave differently in the two places. Putting `ignore_warnings_on_exit=0` in the shared config means a developer's local `composer lint` fails on warnings exactly as CI does. Chosen.

## Consequences

**Easier:**

- `main` is always in a known-green state before Phase 4's heavier work begins.
- Cross-platform coverage: developers on Windows, CI on Linux, same commands.
- The source-map and manifest guards turn the 3F security/packaging discipline into an automated, regression-proof check.
- `phpcs` warnings now fail locally too, so the "zero warnings" rule from ADR-0006 is mechanically enforced everywhere.

**Harder:**

- Adding a genuinely-needed second runtime version later means introducing a matrix then. Acceptable; deferred cost.
- CI has no caching, so installs run cold each time. Acceptable at current run times; explicitly revisitable.

**To revisit:** see "Deliberately deferred" above — each item has a named trigger.
