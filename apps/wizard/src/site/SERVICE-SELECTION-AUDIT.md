# Service Selection Audit — Pre-5.10a State

**Date:** 2026-06-24  
**Purpose:** Document the category selection and service selection component structure
before the category back button is added.

## Component Locations

| Component / Hook           | File                                                        |
| -------------------------- | ----------------------------------------------------------- |
| `CategorySelector`         | `apps/wizard/src/components/selection/CategorySelector.tsx` |
| `ServiceSelector`          | `apps/wizard/src/components/selection/ServiceSelector.tsx`  |
| `useCategorySelection`     | `apps/wizard/src/runtime/hooks/useCategorySelection.ts`     |
| `QuotePage` (orchestrator) | `apps/wizard/src/site/pages/QuotePage.tsx`                  |

## CategorySelector

```tsx
interface CategorySelectorProps {
  readonly categories: readonly CategoryConfig[];
  readonly onSelect: (categoryId: CategoryId) => void;
}
```

Shown before service selection when `enableCategoryNavigation` is true and a category is not
yet selected. User picks a category; parent (QuotePage) stores it in `selectedCategoryId` via
`selectCategory()`.

**No back button needed here** — this is the first phase; there is nothing to go back to
from within the wizard (the pre-step's Back button handles returning to the service selector).

## ServiceSelector

```tsx
interface ServiceSelectorProps {
  readonly services: readonly ServiceConfig[];
  readonly onSelect: (serviceId: string) => void;
  readonly filterByCategoryId?: string;
}
```

`filterByCategoryId` filters the displayed services to those matching the category. Set to
`selectedCategoryId ?? undefined` in QuotePage. When set, the user is in a category-filtered
view and should have a way to return to the full category list.

**Finding:** No back button exists. `onReturnToCategorySelection` prop is absent.

## useCategorySelection hook

```typescript
export interface CategorySelectionState {
  readonly selectedCategoryId: CategoryId | null;
  readonly selectCategory: (id: CategoryId) => void;
  readonly resetCategory: () => void;
}
```

`resetCategory` sets `selectedCategoryId` back to `null`. QuotePage currently imports
`selectCategory` but NOT `resetCategory` — it needs to be added to the destructure and
passed to ServiceSelector.

## QuotePage flow (pre-5.10a)

```
selectedId === null && enableCategoryNavigation && categories.length > 0 && selectedCategoryId === null
  → render CategorySelector (onSelect=selectCategory)

selectedId === null (category selected or category nav disabled)
  → render ServiceSelector (filterByCategoryId=selectedCategoryId ?? undefined)
        ← MISSING: no onReturnToCategorySelection

selectedId !== null && wizardResources !== null
  → render WizardProvider + WizardShell (onReturnToSelector=setSelectedId(null))
```

## What 5.10a adds

1. `onReturnToCategorySelection?: () => void` prop to `ServiceSelector`.
2. When `filterByCategoryId !== undefined && onReturnToCategorySelection !== undefined`: render
   `← All categories` button at top of service list.
3. `QuotePage`: destructure `resetCategory` from `useCategorySelection()`; pass it as
   `onReturnToCategorySelection` on both `ServiceSelector` instances.
4. Extracted pure helper `isCategoryFilterActive(categoryId)` in `useCategorySelection.ts`
   for testability (3 Vitest tests).

## State management approach

Category state is component-local to QuotePage (per ADR-0017: "State is local to the QuotePage
mount; navigating away and back resets the selection"). The back button resets this local state
by calling `resetCategory()`, which sets `selectedCategoryId` to null, causing QuotePage to
re-render and show CategorySelector again.

No wizard-level state is involved. `STEP_BACK` is not dispatched for this flow (that is
the existing NavigationControls back button within the wizard steps).
