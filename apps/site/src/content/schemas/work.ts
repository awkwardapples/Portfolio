import { reference, type SchemaContext } from 'astro:content';
import { z } from 'astro/zod';

import { documentItem, localImage, mediaItem } from './media';
import { orTodo } from './todo';

/** What an entry is (spec H.3). */
export const KINDS = ['research', 'software', 'venture', 'music', 'writing'] as const;

/** Which sides of Josh an entry belongs to (spec F.4). */
export const THREADS = [
  'ai',
  'research',
  'software',
  'venture',
  'music',
  'university',
  'life',
] as const;

const yearMonthOrDate = z.coerce.date();

/**
 * A work date can be a full date (2025-08-11), a month (2025-08) or just a
 * year (2026). A year alone becomes 1 January with `datePrecision: year`, so
 * pages show "2026" and never a month nobody gave. (Left alone, z.coerce
 * would read the number 2026 as milliseconds after 1970.)
 */
function yearOnly(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const record = raw as Record<string, unknown>;
  const { date } = record;
  const year =
    (typeof date === 'number' && Number.isInteger(date)) ||
    (typeof date === 'string' && /^\d{4}$/.test(date));
  return year ? { ...record, date: `${date}-01-01`, datePrecision: 'year' } : raw;
}

/** One project, paper, dissertation, venture or release (spec H.3). */
export const workSchema = ({ image }: SchemaContext) =>
  z.preprocess(
    yearOnly,
    z
      .strictObject({
        title: orTodo(z.string().min(1)),
        subtitle: orTodo(z.string().min(1)).optional(),
        kind: z.enum(KINDS),
        threads: z.array(z.enum(THREADS)).min(1),
        // One or two sentences, used in lists and meta descriptions.
        summary: orTodo(z.string().min(1).max(220)),
        // When the work was completed or published.
        date: orTodo(yearMonthOrDate),
        // Set from `date: 2026` (see yearOnly); not written by hand.
        datePrecision: z.enum(['year']).optional(),
        updated: z.coerce.date().optional(),
        status: z.enum(['complete', 'ongoing', 'archived']),
        featured: z.boolean().default(false),
        featuredOrder: z.number().int().positive().optional(),
        // e.g. "Sole author", "Founder and engineer".
        role: orTodo(z.string().min(1)),
        authorship: z.strictObject({
          type: orTodo(z.enum(['sole', 'lead', 'contributor'])),
          collaborators: z
            .array(
              z.strictObject({
                name: z.string().min(1),
                role: orTodo(z.string().min(1)).optional(),
                url: z.url().optional(),
              }),
            )
            .default([]),
          supervisor: orTodo(z.string().min(1)).optional(),
        }),
        context: z
          .strictObject({
            institution: orTodo(z.string().min(1)).optional(),
            programme: orTodo(z.string().min(1)).optional(),
            result: orTodo(z.string().min(1)).optional(),
          })
          .optional(),
        cover: localImage(image).optional(),
        coverAlt: z.string().min(1).optional(),
        tags: z.array(z.string()).default([]),
        tech: z.array(z.string()).default([]),
        links: z
          .array(
            z.strictObject({
              type: z.enum(['github', 'live', 'demo', 'paper', 'video', 'spotify', 'other']),
              url: orTodo(z.string().regex(/^(https:\/\/|\/)/, 'Links start with https:// or /')),
              label: z.string().min(1),
            }),
          )
          .default([]),
        documents: z.array(documentItem).default([]),
        media: z.array(mediaItem(image)).default([]),
        references: z
          .array(z.strictObject({ text: z.string().min(1), url: z.url().optional() }))
          .default([]),
        related: z.array(reference('work')).default([]),
        // Spec H.3 calls this `layout`, but Astro's MDX reads a frontmatter `layout` as a
        // layout file to import, so the field is named `template` (ADR-0041).
        template: z.enum(['standard', 'case-study']).default('standard'),
        seo: z
          .strictObject({
            title: z.string().min(1).optional(),
            description: z.string().min(1).max(220).optional(),
          })
          .optional(),
        draft: z.boolean().default(false),
      })
      .refine((w) => !w.cover || w.coverAlt, {
        message: 'A cover image needs alt text',
        path: ['coverAlt'],
      })
      .refine((w) => !w.featured || w.featuredOrder !== undefined, {
        message: 'A featured entry needs featuredOrder',
        path: ['featuredOrder'],
      }),
  );
