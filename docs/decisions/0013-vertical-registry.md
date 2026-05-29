# ADR-0013: Vertical Registry System

**Status:** Accepted
**Date:** 2026-05-29

## Context

After Step 4.4, the wizard engine (FSM, pricing, validation, rendering) is
vertical-agnostic by design, but `App.tsx` still imports `fencingWizardConfig`
and `fencingPricingConfig` directly. This makes the codebase structurally
single-vertical: adding a second client means touching `App.tsx`.

The project direction (ADR-0014) is now a reusable template platform where
each client is defined by configuration. We need a clean separation between
"which vertical does this deployment run?" and "how is a wizard implemented?".

## Decision

Introduce a closed, in-repo **vertical registry** under
`src/domain/registry/`. A vertical is the minimal bundle:

```
Vertical = { id, label, schemaVersion: 1, wizard: WizardConfig, pricing: PricingConfig }
```

Resolution is via a pure function:

```
resolveVertical(wizardId: string): SessionConfig | null
```

The deployment selects a vertical by setting `PublicConfig.wizardId` (PHP
emits this from `goqw_wizard_id`). `App.tsx` resolves the vertical at startup,
falling back to a documented `FALLBACK_VERTICAL_ID` (currently `'fencing'`)
if the configured id is unknown.

The registry is **curated in-repo**. There is no dynamic registration; adding
a vertical requires a PR. This keeps every vertical type-checked and
schema-validated at build time and avoids CMS complexity.

The `Vertical` shape is **intentionally minimal**. Branding, theme, content,
and site templates are NOT included; those belong to the site-template layer
(Phase 5) and live in a separate registry / data path.

## Alternatives considered

- **Dynamic registration / runtime-fetched configs.** Rejected for now: adds
  CMS-like complexity, weakens type guarantees, and no client requires it.
  Revisited when an operator-editing requirement is real.
- **Storing branding/theme in Vertical now.** Rejected: couples the wizard
  registry to concerns it doesn't own. Phase 5 introduces a separate site-
  template config layer with its own schema.
- **Continue with direct fencing imports in `App.tsx`.** Rejected: blocks any
  second client and entangles deployment selection with the wizard engine.

## Consequences

**Easier:**

- A second vertical is added in one PR (new fixture + one registry entry).
- `App.tsx` no longer knows about fencing specifically.
- The "which vertical" question has a single, typed answer.

**Harder:**

- Every PR touching a vertical must keep the registry, the fixture, and tests
  in sync (small cost; well-scoped).
- The fallback behaviour creates a defined-but-easily-overlooked path: an
  unknown configured `wizardId` silently runs as the fallback. Mitigated by
  the `console.error`/admin-visible diagnostic when both configured and
  fallback resolution fail.

## Status note

Registry contains exactly one entry (`fencing`) at the time of this ADR.
A second entry is the eventual proof of the abstraction and is deferred to
the appropriate phase.
