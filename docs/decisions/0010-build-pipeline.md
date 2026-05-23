# ADR-0010: Cross-platform Node-script build pipeline

**Status:** Accepted
**Date:** 2026-05-16

## Context

Step 3F automates the build and packaging workflow that was manual in Step 3E. Two design decisions had to be made:

1. **Implementation language for the scripts.** Bash + PowerShell parallel scripts, or a single source of truth in another tool (Node, Make, just, etc.)?
2. **Allowlist vs denylist for the distributable ZIP.** Which discipline catches more accidental leaks?

A third, smaller decision is captured here for traceability:

3. **Operational logging convention.** How does an operator distinguish routine warnings from critical "you need to act" events?

## Decision

### 1. Build scripts are written as Node `.mjs` modules

- `scripts/build-plugin.mjs` — builds the wizard, validates the manifest, copies to the plugin.
- `scripts/package-plugin.mjs` — builds first, then produces a ZIP via allowlist.
- Shared helpers in `scripts/lib/file-utils.mjs` and `scripts/lib/paths.mjs`.

A single new dev dependency, `archiver`, handles ZIP creation cross-platform.

### 2. Packaging uses an allowlist, not a denylist

Only paths matching the enumerated allowlist enter the ZIP. Refusal rules (`.env`, `*secret*`, `node_modules`, `*.map`, files > 5MB) act as a secondary safety net.

### 3. `Logger::operational()` for unconditional critical events

A new method on the existing `Logger` class writes lines with the prefix `[goqw-ops]`. These are written regardless of `WP_DEBUG_LOG` and identify events the operator must see.

## Alternatives considered

### Build script implementation

**A. Parallel bash + PowerShell scripts.**

- Pros: zero new deps; native to each platform.
- Cons: two scripts to maintain, diverging over time. Bash subtleties and PowerShell subtleties bit us in Step 3D. We'd invite that class of bug for every future change.

**B. `just` or `task` as a cross-platform runner.**

- Pros: declarative, simple.
- Cons: new tool dependency for engineers to install. Less expressive than JS for the manifest validation logic we actually need.

**C. Node `.mjs` scripts (chosen).**

- Pros: Node is already required (Vite, pnpm). One source of truth. Full programming language for non-trivial logic. `pnpm run X` works identically on every platform.
- Cons: one new dev dep (`archiver`) for ZIP creation; ~30KB.

### Allowlist vs denylist

**A. Denylist via `.gitignore`-style file.**

- Pros: familiar.
- Cons: the next sensitive file added that doesn't match a pattern ships. Failure mode is silent.

**B. Allowlist (chosen).**

- Pros: every file in the ZIP is there because someone explicitly enumerated its category. New files don't ship until their category is added. Failure mode is loud (file is missing from the ZIP).
- Cons: adding a new file type requires editing the allowlist. Acceptable; happens rarely.

`.distignore` exists as documentation for humans, not as the enforcement mechanism.

### Source maps in the production ZIP

**A. Include them.** Smaller incremental ZIP size hit (~350KB).
**B. Exclude them (chosen).** Avoid information leakage, avoid bloating client hosting disk, avoid cache layers serving them unnecessarily. Local dev (`pnpm dev`) and the preview environment still produce maps. Production-equivalent debugging is a Phase 6 concern (Sentry source-map upload pattern, not in this step).

### Operational logging

**A. Single `Logger::error` channel for everything.**

- Pros: simpler API.
- Cons: routine errors drown the rare critical signal. Operators can't grep effectively.

**B. New `Logger::operational` method with distinct prefix (chosen).**

- Pros: a single grep — `grep "goqw-ops" debug.log` — surfaces every event the operator must act on. The prefix is stable across releases.
- Cons: one more method on Logger. Trivial.

## Build determinism

We make builds "deterministic enough" — same Git commit produces a ZIP that differs only in compression-byte-level details:

- Allowlist is sorted alphabetically before adding to the archive.
- All file mtimes inside the archive are set to the mtime of the plugin's `manifest.json` (which is derived from bundle content, so stable for the same code).
- No build-host info, usernames, or absolute paths leak into archive metadata.

We do **not** reach for zlib-level determinism. The above is sufficient for our purposes; if bit-for-bit reproducibility becomes a requirement (regulated industries), we revisit.

## Operational logging convention

| Method                | Severity            | Triggers          | Tag in log               |
| --------------------- | ------------------- | ----------------- | ------------------------ |
| `Logger::info`        | Diagnostic          | WP_DEBUG_LOG only | `[quote-wizard] [INFO]`  |
| `Logger::warning`     | Recoverable issue   | Always            | `[quote-wizard] [WARN]`  |
| `Logger::error`       | Failure             | Always            | `[quote-wizard] [ERROR]` |
| `Logger::operational` | Operator-actionable | Always            | `[goqw-ops]`             |

Operators looking at production logs run:

```
grep "goqw-ops" /path/to/debug.log
```

…to see only the events that require action. Routine warnings and info do not pollute this output.

## Consequences

**Easier:**

- One build script set for every platform; no parallel maintenance burden.
- Adding a file type to the allowlist is a deliberate, reviewed change.
- Refusal rules guarantee `.env`, secrets, source maps, and oversized files never ship.
- Operators have a single grep to find the events that matter.
- New engineers (Windows or Unix) follow the same docs.

**Harder:**

- One new dev dep (`archiver`) — accepted.
- Manifest validation and refusal logic live in JS, not in `composer.json` scripts. Engineers debugging packaging issues read JS. Acceptable; scripts are short and well-commented.

**To revisit:**

- If we add a second JS workspace package, the build scripts may want to grow knowledge of which package to ship.
- If reproducible builds become important for compliance, reach for zlib-level determinism with a tool like `strip-nondeterminism`.
- If `Logger::operational` events become numerous, consider routing them to a separate file or aggregator.
