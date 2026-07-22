# Audit 6.4-C: Service Category System

_Compiled: 2026-07-22_

## How categories are defined

`domain/registry/categories.ts`. A category is a plain data record:

```ts
interface CategoryConfig {
  readonly id: CategoryId; // = string
  readonly label: string;
  readonly description?: string;
  readonly displayOrder: number; // ascending sort key
}
```

The **closed** `CATEGORIES: Readonly<Record<CategoryId, CategoryConfig>>`
registry has exactly 4 entries, frozen at runtime:

| id                  | label             | displayOrder |
| ------------------- | ----------------- | ------------ |
| `landscaping`       | Landscaping       | 1            |
| `decorating`        | Decorating        | 2            |
| `exterior-cleaning` | Exterior Cleaning | 3            |
| `handyman`          | Handyman Services | 4            |

`listCategories()` returns them sorted by `displayOrder` ascending;
`resolveCategory(id)` looks one up, returning `null` for unknown/undefined.
There is **no separate "category enumeration" or "category navigation
display" config file** beyond this one — the spec's Section 7.2 assumes a
second file to update ("Also update category configuration file if
categories are enumerated separately"); there isn't one. `categories.ts`
is the single source of truth.

## How categories are assigned to services

Each `Vertical` (`domain/registry/verticals.ts`) carries an **optional**
`categoryId?: string` field. Assignment is a plain property on the
vertical's object literal in `verticals.ts` — nothing in
`ServiceSchemaEmitter.php` or elsewhere assigns categories; that PHP
file's own `category` field is a **separate, independently-maintained
mirror** of the same value (see `AUDIT-6.4-sync-obligations.md`), not the
canonical source. The spec's Section 7.2 illustrative snippet edits
`ServiceSchemaEmitter.php` to assign a category — this edits the SEO
mirror, not the actual category assignment, which lives in
`verticals.ts` and is what the wizard's own `ServiceSelector.tsx` filtering
logic reads.

## Where category navigation appears

`components/selection/CategorySelector.tsx` (category picker UI, shown
before service selection) and `components/selection/ServiceSelector.tsx`
(the service list itself — accepts an optional `filterByCategoryId` prop;
when set, it filters to `VERTICALS[s.id]?.categoryId === filterByCategoryId`).
Category navigation as a _feature_ is gated by
`PublicConfig.enableCategoryNavigation` (a WordPress option), defaulting
to `false` — the template ships with a single flat service list by
default; category drill-down is opt-in per client (ADR-0017).

## Which services are in which categories (current registry state)

| Category            | Services                                                 |
| ------------------- | -------------------------------------------------------- |
| `landscaping`       | `fencing`, `decking`, `patio`, `driveway`, `steps`       |
| `decorating`        | `painting`                                               |
| `exterior-cleaning` | `jetwash`                                                |
| `handyman`          | `general-repairs`, `plumbing`, `electrical`, `carpentry` |
| _(none)_            | `other`                                                  |

## What happens when a service has no category (e.g. "Other," Step 6.3)

- `categoryId` is `undefined` on that `Vertical`. `domain/registry/
types.ts`'s own doc comment: "Absent means this vertical has no
  category assignment; it is still fully functional and visible when
  category navigation is disabled."
- When `enableCategoryNavigation` is `false` (the default): **fully
  visible**, no different from any other service — the flat list doesn't
  consult `categoryId` at all.
- When `enableCategoryNavigation` is `true` and a user has drilled into a
  specific category: **invisible in that filtered view** —
  `ServiceSelector`'s filter (`categoryId === filterByCategoryId`) can
  never match `undefined`. The uncategorized service only appears if/when
  the UI offers an unfiltered "all services" view; `CategorySelector`
  itself doesn't currently offer a "browse everything, no category"
  option, so a deployment with category navigation enabled effectively
  hides any uncategorized service from normal browsing. This is a real,
  documented consequence (ADR-0035), not a bug — it's the tradeoff of
  leaving a genuinely-uncategorizable long-tail catch-all unassigned
  rather than forcing it into one of the four existing categories.
- **Fix, if wanted for a specific client:** assign any existing
  `categoryId` (or a new one, added to `CATEGORIES` first) to the
  service's `Vertical` entry in `verticals.ts`. No schema change needed —
  the field already exists and is optional.
