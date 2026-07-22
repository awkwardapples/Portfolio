# Audit 6.3-A: Service Configuration Structure

_Compiled: 2026-07-22_

## Config files present (`domain/fixtures/*.config.ts`)

```
carpentry.config.ts   decking.config.ts    driveway.config.ts
electrical.config.ts  fencing.config.ts    general-repairs.config.ts
jetwash.config.ts     painting.config.ts   patio.config.ts
plumbing.config.ts    steps.config.ts
```

11 files, one per service vertical — same location and one-file-per-service
convention confirmed in 6.1/6.2. Naming: `<service-id>.config.ts`
(kebab-case id, e.g. `general-repairs.config.ts` for id `general-repairs`).
`other.config.ts` follows the same convention.

## Common metadata structure

Every config exports two consts: `<camelCase>WizardConfig: WizardConfig`
and `<camelCase>PricingConfig: PricingConfig` (manual-quote services alias
the shared `manualQuotePricingStub` instead of a real pricing config — see
Audit B). `WizardConfig` itself (`domain/config/wizard-config.ts`) has no
`name`/`description` fields at the wizard level — the spec's illustrative
`{ id, name, description, quoteMode, steps }` shape doesn't match. The real
shape is `{ schemaVersion: 1, id, quoteMode?, title, steps }`. There is no
wizard-level "description" shown anywhere on the marketing site or wizard
selector — `title` is the only human-facing label at this layer.

## How services are registered/aggregated — critical finding

**There is no `domain/fixtures/index.ts` aggregator.** The spec's assumed
file doesn't exist. Registration happens in
`apps/wizard/src/domain/registry/verticals.ts`, which:

1. Imports each service's `{xxx}WizardConfig, {xxx}PricingConfig` pair.
2. Builds a `Vertical` object per service: `{ id, label, schemaVersion: 1,
categoryId?, wizard, pricing }`.
3. Assembles them into a single frozen `VERTICALS: Readonly<Record<string,
Vertical>>` object literal.

`domain/registry/services.ts`'s `listEnabledServiceIds()` derives the
default (no-override) list from `Object.keys(VERTICALS)` — plain object
key insertion order, exactly the mechanism confirmed by
`domain/registry/__tests__/resolve.test.ts`'s `listVerticalIds` test
("returns all 11 services in registry insertion order"). Per-client
overrides come from `PublicConfig.enabledServiceIds` (WordPress option),
filtered against the registry and returned in **override order**, not
registry order — but the _default_ (nothing configured) case is exactly
"whatever order the object literal lists them in."

## Position/ordering mechanism

**No explicit `position`/`displayOrder`/`sortOrder` field exists on
`Vertical`** (unlike `CategoryConfig`, which does have `displayOrder`).
Order is purely "where the key sits in the `VERTICALS` object literal."
Per D1=A ("Other" last), the new `other` entry must be the **last key**
added to the object literal in `verticals.ts` — nothing more is needed;
no numeric field to set.

## `categoryId` — no fit for "Other"

`CATEGORIES` (`domain/registry/categories.ts`) has exactly four entries:
`landscaping`, `decorating`, `exterior-cleaning`, `handyman`. None
describes an uncategorized catch-all, and `categoryId` is optional on
`Vertical` (`domain/registry/types.ts:30`, comment: "Absent means this
vertical has no category assignment; it is still fully functional and
visible when category navigation is disabled"). Decision: leave `other`'s
`categoryId` unset. Consequence (documented in ADR-0035): when a client
deployment has `enableCategoryNavigation: true` and a user drills into a
specific category, `ServiceSelector.tsx`'s `filterByCategoryId` filter
(`VERTICALS[s.id]?.categoryId === filterByCategoryId`) will never match
`undefined`, so "Other" only appears in the flat "all services" listing
(category navigation is `false` by default template-wide, so this affects
no current deployment).

## Marketing site content — out of scope

`src/site/content/services-content.ts` (the `/services` page + homepage
preview content) is **independent** of the `VERTICALS` registry — its own
doc comment calls the shared `id` "stable for future cross-referencing,"
not an enforced link, and `content.test.ts` has no cross-reference
assertion tying its length or ids to `VERTICALS`. The 6.3 spec's
Architecture Overview never lists this file for modification either.
Per-client marketing copy for "Other services" (if wanted) is a content
customization exercise, not part of this step; not touched here.
