/**
 * Reading content (spec H, T.4). Pages use these helpers instead of calling
 * getCollection directly, so drafts are handled in one place:
 *
 * - `astro dev` shows drafts and draft items (marked as drafts), so Josh can
 *   preview work in progress with its gaps highlighted;
 * - production builds leave them out.
 */
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

import { formatProblems, referenceProblems, type EntryLike } from '~/content/checks';

export const SHOW_DRAFTS = import.meta.env.DEV;

export type Work = CollectionEntry<'work'>;
export type Post = CollectionEntry<'posts'>;
export type Profile = CollectionEntry<'profile'>['data'];

function visible<T extends { data: { draft: boolean } }>(entries: T[]): T[] {
  return SHOW_DRAFTS ? entries : entries.filter((entry) => !entry.data.draft);
}

function visibleItems<T extends { draft: boolean }>(items: T[]): T[] {
  return SHOW_DRAFTS ? items : items.filter((item) => !item.draft);
}

/** The date, or undefined while a draft still has a placeholder there. */
export function dateOf(value: Date | string): Date | undefined {
  return value instanceof Date ? value : undefined;
}

function newestFirst(a: { data: { date: Date | string } }, b: { data: { date: Date | string } }) {
  return (dateOf(b.data.date)?.getTime() ?? 0) - (dateOf(a.data.date)?.getTime() ?? 0);
}

/** Every visible work entry, newest first. */
export async function getWork(): Promise<Work[]> {
  return visible(await getCollection('work')).sort(newestFirst);
}

/** Featured work in `featuredOrder` (spec G.2). */
export async function getFeaturedWork(): Promise<Work[]> {
  return (await getWork())
    .filter((entry) => entry.data.featured)
    .sort((a, b) => (a.data.featuredOrder ?? 0) - (b.data.featuredOrder ?? 0));
}

let postProjectsChecked = false;

/** Every visible post, newest first. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('posts');
  if (!postProjectsChecked) {
    postProjectsChecked = true;
    // A published post may not point at a missing or draft project (spec H.3).
    const work = await getCollection('work');
    const problems = referenceProblems(posts as EntryLike[], 'project', work as EntryLike[]);
    if (problems.length > 0) {
      const message = formatProblems('posts', problems);
      if (import.meta.env.DEV) console.warn(message);
      else throw new Error(message);
    }
  }
  return visible(posts).sort(newestFirst);
}

/** The profile, with draft items left out of production builds. */
export async function getProfile(): Promise<Profile> {
  const entry = await getEntry('profile', 'profile');
  if (!entry) throw new Error('apps/site/src/content/profile/profile.yaml is missing.');
  const { data } = entry;
  return {
    ...data,
    education: visibleItems(data.education),
    experience: visibleItems(data.experience),
    photos: visibleItems(data.photos),
  };
}
