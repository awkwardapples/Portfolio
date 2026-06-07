/**
 * Category registry for grouping wizard services.
 *
 * Optional capability: when enableCategoryNavigation is false in PublicConfig,
 * this registry is inert. When true, the wizard presents a category selection
 * step before service selection, and services declare their categoryId.
 *
 * Categories are pure data — no behavior, no special rendering rules.
 * The CATEGORIES map is empty in the canonical template; each client fork
 * populates it alongside their service assignments.
 */

/** Stable identifier for a category. Same constraints as service IDs. */
export type CategoryId = string;

export interface CategoryConfig {
  /** Stable registry key. Must match the key it lives under. */
  readonly id: CategoryId;
  /** Human-readable label shown in the category selector. */
  readonly label: string;
  /** Optional subtitle or description shown below the label. */
  readonly description?: string;
  /** Controls display order in the category selector (ascending). */
  readonly displayOrder: number;
}

/**
 * The closed category registry.
 *
 * Empty in the canonical template. Each client fork declares its own
 * categories here and assigns services to them via the categoryId field
 * on each Vertical in verticals.ts.
 */
export const CATEGORIES: Readonly<Record<CategoryId, CategoryConfig>> = Object.freeze({});

/**
 * Return all categories sorted by displayOrder ascending.
 * Returns an empty array when no categories are registered.
 */
export function listCategories(): readonly CategoryConfig[] {
  return Object.values(CATEGORIES).sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Resolve a category by ID. Returns null when the ID is not in the registry.
 */
export function resolveCategory(categoryId: CategoryId | undefined): CategoryConfig | null {
  if (categoryId === undefined) return null;
  return CATEGORIES[categoryId] ?? null;
}
