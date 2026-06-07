/** Vertical registry public surface. */
export { VERTICALS, FALLBACK_VERTICAL_ID } from '@/domain/registry/verticals';
export {
  resolveVertical,
  resolveFallbackVertical,
  listVerticalIds,
} from '@/domain/registry/resolve';
export { listEnabledServiceIds, resolveService } from '@/domain/registry/services';
export type { Vertical, SessionConfig, ServiceId, ServiceConfig } from '@/domain/registry/types';
export { CATEGORIES, listCategories, resolveCategory } from '@/domain/registry/categories';
export type { CategoryId, CategoryConfig } from '@/domain/registry/categories';
