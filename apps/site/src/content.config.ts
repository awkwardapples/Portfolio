/**
 * Content collections (spec H.1, ADR-0041). Each entry is a folder, so
 * everything about a piece of work lives together:
 *
 *   content/work/<slug>/index.mdx                 a project, paper or venture
 *   content/posts/<yyyy-mm-dd>-<slug>/index.mdx   a dated log post
 *   content/profile/profile.yaml                  site-wide facts about Josh
 *
 * Schemas use Astro's own Zod (astro/zod); the wizard's Zod 3 never meets
 * them. The checks in content/checks.ts run after every load.
 */
import { existsSync } from 'node:fs';

import { defineCollection } from 'astro:content';

import {
  altTextProblems,
  documentProblems,
  featuredOrderProblems,
  placeholderProblems,
  referenceProblems,
  slugProblems,
} from './content/checks';
import { checkedGlob, documentStore } from './content/loader';
import { postSchema } from './content/schemas/posts';
import { profileSchema } from './content/schemas/profile';
import { workSchema } from './content/schemas/work';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATED_SLUG = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;

const work = defineCollection({
  loader: checkedGlob(
    {
      pattern: '*/index.mdx',
      base: './src/content/work',
      generateId: ({ entry }) => entry.split('/')[0] ?? entry,
    },
    (entries, context) => [
      ...slugProblems(entries, SLUG, 'my-project'),
      ...entries.flatMap((entry) => placeholderProblems(entry)),
      ...entries.flatMap((entry) => altTextProblems(entry)),
      ...featuredOrderProblems(entries),
      ...referenceProblems(entries, 'related', entries),
      ...documentProblems(entries, documentStore(context.config.root)),
    ],
  ),
  schema: workSchema,
});

const posts = defineCollection({
  loader: checkedGlob(
    {
      pattern: '*/index.mdx',
      base: './src/content/posts',
      // The folder is <yyyy-mm-dd>-<slug>; the URL is /log/<slug>.
      generateId: ({ entry }) => (entry.split('/')[0] ?? entry).replace(/^\d{4}-\d{2}-\d{2}-/, ''),
    },
    (entries, context) => [
      ...slugProblems(entries, DATED_SLUG, '2026-10-04-my-post'),
      ...entries.flatMap((entry) => placeholderProblems(entry)),
      ...entries.flatMap((entry) => altTextProblems(entry)),
      ...documentProblems(entries, documentStore(context.config.root)),
    ],
  ),
  schema: postSchema,
});

const profile = defineCollection({
  loader: checkedGlob(
    { pattern: 'profile.yaml', base: './src/content/profile' },
    (entries, context) =>
      entries.flatMap((entry) => {
        const problems = placeholderProblems(entry, { draftItems: true });
        const cv = (entry.data.cv as { file?: string } | undefined)?.file;
        if (cv && !existsSync(new URL(`public${cv}`, context.config.root))) {
          problems.push({
            file: entry.filePath ?? entry.id,
            field: 'cv.file',
            message: `apps/site/public${cv} does not exist.`,
          });
        }
        return problems;
      }),
  ),
  schema: profileSchema,
});

// Cross-collection references (a post's project) are checked when pages are
// built, in src/lib/content.ts, because each loader only sees its own entries.
export const collections = { work, posts, profile };
