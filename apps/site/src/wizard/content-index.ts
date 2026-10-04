/**
 * The content the contact wizard's result step can show (spec I.4), built at
 * build time by pages/contact.astro and passed to the island as props. The
 * selection rules are pure functions here, unit-tested.
 */
import type { ContentResultItem } from '@/runtime/content-results';

import { selectWork } from '~/lib/home';

export type Selection = 'featured' | 'research' | 'venture' | 'music';

export interface ContentIndexEntry {
  readonly id: string;
  readonly kind: 'research' | 'software' | 'venture' | 'music' | 'writing';
  readonly featured: boolean;
  readonly featuredOrder?: number | undefined;
  /** ISO date, for newest-first ordering. */
  readonly date?: string | undefined;
  readonly item: ContentResultItem;
}

/** How many items a result step shows at most. */
export const RESULT_LIMIT = 4;

function newestFirst(entries: readonly ContentIndexEntry[]): ContentIndexEntry[] {
  return [...entries].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}

/**
 * The items for one selection (spec I.3):
 *
 * - featured: the featured work in order, filled with the newest other work,
 *   exactly as the homepage's selected work (lib/home.ts);
 * - research, venture, music: entries of that kind, newest first.
 */
export function selectResultItems(
  selection: Selection,
  index: readonly ContentIndexEntry[],
): ContentResultItem[] {
  const ordered = newestFirst(index);
  let chosen: ContentIndexEntry[];
  if (selection === 'featured') {
    const featured = ordered
      .filter((entry) => entry.featured)
      .sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0));
    chosen = selectWork(featured, ordered, RESULT_LIMIT);
  } else {
    chosen = ordered.filter((entry) => entry.kind === selection).slice(0, RESULT_LIMIT);
  }
  return chosen.map((entry) => entry.item);
}

/** Every selection's items, for the island's props. */
export function resultsBySelection(
  index: readonly ContentIndexEntry[],
): Record<Selection, ContentResultItem[]> {
  return {
    featured: selectResultItems('featured', index),
    research: selectResultItems('research', index),
    venture: selectResultItems('venture', index),
    music: selectResultItems('music', index),
  };
}
