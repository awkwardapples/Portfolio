# Audit 6.4-A: Complete Sync Obligation Map

_Compiled: 2026-07-22_

## Method

Built on 6.3's discovery of `ServiceSchemaEmitter.php` (a sync obligation
the 6.3 spec didn't anticipate) by grepping the whole `apps/wizard/src`
tree and `plugins/quote-wizard/src` for every hardcoded service-count
string (`"11 service"`, `"12 service"`, `"11 registered"`, etc.) and every
file that enumerates service IDs, rather than trusting the 6.3 spec's or
this spec's own assumed list. This found one additional surface (`ICON_MAP`)
neither prior step's spec mentioned — see "Conditional (not mandatory)"
below, which explains why it's _not_ actually broken.

## Path correction

The spec assumes `apps/wizard/src/content/services-content.ts`. The real
path (confirmed in 6.1/6.3) is `apps/wizard/src/site/content/services-
content.ts` — under `site/content/`, not a top-level `content/`.

## Mandatory sync obligations (must update when a service is added/removed)

| #   | File                                                    | What it holds                                                                                 | "In sync" means                                                                                                                                                                                                                                                                                                    |
| --- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `apps/wizard/src/domain/fixtures/<service>.config.ts`   | The service's `WizardConfig` + `PricingConfig` (or `manualQuotePricingStub` alias)            | File exists for every registered service id; deleted when a service is removed                                                                                                                                                                                                                                     |
| 2   | `apps/wizard/src/domain/registry/verticals.ts`          | The `VERTICALS` frozen object literal — the single source of truth for "which services exist" | Contains exactly one `Vertical` entry per service, in the desired display order (key insertion order — no separate position field; see Audit C)                                                                                                                                                                    |
| 3   | `apps/wizard/src/site/content/services-content.ts`      | Marketing copy (`name`, `summary`, `description`) for `/services` and the homepage preview    | Contains one `ServiceEntry` per service that should appear on the marketing site (not enforced 1:1 with `VERTICALS` by any test, but drives `ServiceSchemaEmitter.php`'s copy — see #4)                                                                                                                            |
| 4   | `plugins/quote-wizard/src/SEO/ServiceSchemaEmitter.php` | Static PHP mirror of the service registry (`SERVICES` const) for Service JSON-LD SEO schema   | Contains one entry per service that should get a schema.org Service block, with `name`/`description` sourced from #3. Has an **explicit, written contract**: `plugins/quote-wizard/src/SEO/SERVICE-REGISTRY-AUDIT.md`'s "Sync discipline" section says this "must be updated in the same commit" as `verticals.ts` |
| 5   | Test files with hardcoded service counts/lists          | Assertions like `toHaveLength(12)` or a literal id array                                      | Count/list matches the current `VERTICALS` registry. **Exactly 5 such files as of Step 6.3** (confirmed by grepping for `"1[12] service"`/`"1[12] registered"` and cross-checking each):                                                                                                                           |

The 5 test files (all under `apps/wizard/src`):

1. `domain/registry/__tests__/resolve.test.ts` — `ALL_VERTICAL_IDS` array + "returns all N services in registry insertion order" + "all N verticals resolve to non-null"
2. `domain/registry/__tests__/services.test.ts` — `ALL_SERVICE_IDS` array + three "returns all N registered services..." tests
3. `__tests__/service-selection.test.ts` — "returns all services when override is absent (all N registered services)"
4. `domain/fixtures/__tests__/manual-quote-configs.test.ts` — `MANUAL_CONFIGS` array (not a numeric count, but must list every manual-quote service id/config pair)
5. `domain/fixtures/__tests__/consent-field.test.ts` — `INSTANT_CONFIGS`/`MANUAL_CONFIGS` arrays (same shape as #4, split by quote mode)

Items 4 and 5 aren't "counts" in the numeric sense — they're **shared
parametrized test fixture lists** that must include every manual-quote (and,
for #5, every instant-quote) service by name. See `AUDIT-6.4-shared-
tests.md` for how these work and why instant-quote services don't have an
equivalent shared file.

## Conditional (not mandatory) — investigated and found NOT to be a gap

**`src/site/sections/ServicesPreview/icons/index.ts`'s `ICON_MAP`** and its
test, `src/site/sections/ServicesPreview/__tests__/services-preview.test.ts`
("contains all 11 service icon keys"), looked at first glance like a 6th
missed sync file — after Step 6.3, this test still says "11," and `other`
has no icon. **Investigated and confirmed this is correct, not stale**:

- `ICON_MAP` is not "one icon per registered vertical." It's "icons
  available for a `home-page-content.ts` `ServicesPreview` section to
  reference by key." `home-page-content.ts`'s actual `ServicesPreview`
  section features only **6** curated services (fencing, decking,
  painting, patio, jetwash, general-repairs) — not all 12, and not even
  all 11 pre-6.3 services (driveway/steps/plumbing/electrical/carpentry
  have icons in `ICON_MAP` but aren't currently featured on the homepage
  either).
- Since `other` isn't featured in any current `ServicesPreview` content
  and adding a homepage icon for it is a purely optional marketing
  decision (a manual "long-tail" catch-all is a poor fit for a
  homepage highlight card), `ICON_MAP` correctly has no `other` entry,
  and the test correctly asserts the current, real 11-icon set.
- **When this becomes a real obligation:** only if/when a client wants
  "Other" (or a newly added service) featured in a homepage
  `ServicesPreview` section — at that point, add an SVG icon component,
  register it in `ICON_MAP`, and update the test's expected array. Not
  required for a service to simply exist and be selectable in the wizard.

This distinction — **mandatory** (registry, wizard config, marketing
content, SEO schema, shared test fixtures) vs. **conditional** (homepage
icon curation) — is carried into the guide's Section 9 checklists.

## Other content referencing service ids (validity constraint, not a sync obligation)

`src/site/content/work-content.ts`'s `works` array (portfolio/"Our Work"
entries) has a `serviceId` field that must reference a real entry in
`services-content.ts` (enforced by `content.test.ts`'s "every work entry
references a real service id" test). This is a **one-directional validity
check**, not a sync obligation — adding a new service does not require
adding a portfolio work entry for it; only removing a service that has
existing work entries referencing it would break this test.

## What "in sync" does NOT include

- `apps/wizard/src/domain/registry/categories.ts` (`CATEGORIES`) — not
  service-count-dependent. See `AUDIT-6.4-categories.md`.
- The wizard engine (`domain/runtime/**`, `components/steps/**`) — entirely
  generic over `WizardConfig`; adding a service never requires touching it.
- `docs/llm-customization-handoff.md`'s service-count prose — not a test,
  but should still be updated for accuracy (already done in 6.3; not a
  build-breaking sync obligation, just a documentation-accuracy one).
