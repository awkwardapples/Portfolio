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

## Amendment — 2026-06-01: Per-session service selection (Step 4.7)

ADR-0013 originally framed the registry as supporting per-deployment defaults
("which vertical does this deployment run?") and template-repo cleanliness.
Step 4.7 broadens this: the registry now also supports **per-session selection**
where the end user picks a service from the deployment's enabled set, and the
wizard mounts the corresponding ServiceConfig.

This is additive. The registry data structure is unchanged. New helpers
`listEnabledServiceIds(override?)` and `resolveService(id)` (alias of
`resolveVertical`) sit alongside the existing API. `PublicConfig.wizardId`
continues to denote the **default selection** (used as the pre-selected option
or when only one service is enabled). A new optional field
`PublicConfig.enabledServiceIds: string[]` restricts the available set to a
subset of the registry; absent or empty means "all registered services."

### Synonyms

The terms "vertical" and "service" are interchangeable. The codebase retains
`Vertical` and `SessionConfig` types and `resolveVertical()`. New aliases
`ServiceId = string` and `ServiceConfig = SessionConfig` exist for readability
in selection-layer code. There is no renaming.

### Single-engine commitment

This step does NOT introduce a multi-engine architecture. The FSM
(`transition()`), pricing engine (`computePrice()`), validation, navigation,
persistence, and submission pipeline are identical regardless of which service
is active. Only the `WizardConfig` and `PricingConfig` data differ between
services.

---

## Amendment — Step 5.5a (June 7, 2026)

The registry supports an optional **category dimension**. Two additions:

1. A new `CategoryConfig` type and `CATEGORIES` registry in
   `src/domain/registry/categories.ts`. Categories are independent records;
   each vertical declares which category it belongs to via an optional
   `categoryId` field on `Vertical`. The registry is empty in the canonical
   template; each client fork populates it.

2. The `Vertical` type gains two optional fields:
   - `categoryId?: string` — links this vertical to a category.
   - Neither field affects resolution or fallback logic; both are purely metadata
     for the category-navigation layer.

The `FALLBACK_VERTICAL_ID` continues to apply and is unaffected. A vertical
without a `categoryId` is still valid and fully functional.

See ADR-0017 for the category navigation capability rationale.
