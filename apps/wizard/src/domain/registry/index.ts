/** Vertical registry public surface. */
export { VERTICALS, FALLBACK_VERTICAL_ID } from '@/domain/registry/verticals';
export {
  resolveVertical,
  resolveFallbackVertical,
  listVerticalIds,
} from '@/domain/registry/resolve';
export type { Vertical, SessionConfig } from '@/domain/registry/types';
