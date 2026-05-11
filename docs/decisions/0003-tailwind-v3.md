# ADR-0003: Tailwind CSS v3 (not v4) for v1

**Status:** Accepted
**Date:** 2026-05-11

## Context

Tailwind CSS v4 was released in early 2025. It introduces a substantial overhaul: a new engine, CSS-first configuration, native CSS-cascade-layer-based composition, and altered toolchain expectations (no PostCSS plugin in the same way; new Vite plugin).

We must decide whether to start the React app on Tailwind 3 or Tailwind 4.

## Decision

We use **Tailwind CSS v3.x** for v1.

## Alternatives considered

**Tailwind 4.**

- Pros: newer engine, faster builds, ergonomic CSS-first config, fewer dependencies.
- Cons:
  - Substantially fewer examples, community resources, and Stack Overflow answers compared to v3.
  - Some plugin ecosystem fragmentation while authors update for v4.
  - Cloudways / shared-hosting environments occasionally lag on Node versions and toolchain expectations; v4's tooling assumes a modern environment which we have on dev but may surprise us in client maintenance scenarios.
  - The IDE / editor tooling story (Tailwind IntelliSense, prettier-plugin-tailwindcss) is mature for v3 and still settling for v4.

**No utility-first CSS framework (vanilla CSS or CSS modules).**

- Pros: zero dependency.
- Cons: writing the design system from scratch is a real time cost. The wizard needs ~10 UI primitives with consistent spacing, typography, and colour. Tailwind compresses that work substantially. This was a Phase 1 decision and is not re-litigated here.

## Consequences

**Easier:**

- Predictable behaviour, mature tooling, large ecosystem of solved problems.
- The team can lean on familiar patterns without learning the v4 paradigm shift mid-build.

**Harder:**

- We will eventually migrate to v4. The longer we wait, the more code there is to migrate. Mitigation: keep Tailwind usage idiomatic and avoid v3-specific edge cases.

**To revisit:**

- After v1 ships and after the v4 ecosystem (especially the prettier plugin and major component libraries) is unambiguously stable. Realistic horizon: 6–12 months post-launch.
