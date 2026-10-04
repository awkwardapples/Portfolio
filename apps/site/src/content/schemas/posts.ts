import { reference, type SchemaContext } from 'astro:content';
import { z } from 'astro/zod';

import { mediaItem } from './media';
import { orTodo } from './todo';
import { THREADS } from './work';

/**
 * A dated update, short or long (spec H.4). A post with a body gets its own
 * page at /log/<slug>; a post with only a summary and media renders inline
 * in lists and on its project's page, and still has a page for linking.
 */
export const postSchema = ({ image }: SchemaContext) =>
  z.strictObject({
    title: orTodo(z.string().min(1)),
    date: orTodo(z.coerce.date()),
    summary: orTodo(z.string().min(1).max(220)),
    threads: z.array(z.enum(THREADS)).min(1),
    project: reference('work').optional(),
    tags: z.array(z.string()).default([]),
    media: z.array(mediaItem(image)).default([]),
    draft: z.boolean().default(false),
  });
