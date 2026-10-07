import type { SchemaContext } from 'astro:content';
import { z } from 'astro/zod';

import { localImage } from './media';
import { orTodo } from './todo';
import { THREADS } from './work';

/**
 * Site-wide facts about Josh (spec H.5, Y.2, Y.3): one entry, from
 * content/profile/profile.yaml. List items can be marked `draft: true` while
 * a fact is still missing; drafts are left out of production builds.
 */

const yearMonth = z.string().regex(/^\d{4}(-\d{2})?$/, 'Use YYYY or YYYY-MM');

const repoName = z.string().regex(/^[\w.-]+\/[\w.-]+$/, 'owner/name, e.g. awkwardapples/BEATLEASE');

const experience = (image: SchemaContext['image']) =>
  z
    .strictObject({
      title: orTodo(z.string().min(1)),
      organisation: z.string().min(1),
      employmentType: orTodo(
        z.enum([
          'full-time',
          'part-time',
          'contract',
          'founder',
          'internship',
          'placement',
          'programme',
          'volunteer',
        ]),
      ),
      start: orTodo(yearMonth),
      end: orTodo(yearMonth).optional(),
      description: z.array(orTodo(z.string().min(1))).max(4),
      confidential: z.boolean().default(false),
      links: z
        .array(
          z.strictObject({
            url: z.string().regex(/^(https:\/\/|\/)/, 'Links start with https:// or /'),
            label: z.string().min(1),
          }),
        )
        .default([]),
      images: z.array(localImage(image)).default([]),
      draft: z.boolean().default(false),
    })
    .superRefine((e, ctx) => {
      if (!e.confidential) return;
      if (e.employmentType === 'contract' && !e.title.endsWith('[Contract]')) {
        ctx.addIssue({
          code: 'custom',
          path: ['title'],
          message: 'Confidential contract titles must end with "[Contract]"',
        });
      }
      if (e.images.length > 0 || e.links.length > 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['links'],
          message: 'Confidential roles cannot carry images or links',
        });
      }
    });

const education = z.strictObject({
  institution: z.string().min(1),
  qualification: orTodo(z.string().min(1)),
  start: z.number().int(),
  end: z.number().int().optional(),
  status: z.enum(['complete', 'in-progress']).default('complete'),
  result: z.string().min(1).optional(),
  url: z.url().optional(),
  highlights: z.array(orTodo(z.string().min(1))).default([]),
  draft: z.boolean().default(false),
});

export const profileSchema = ({ image }: SchemaContext) =>
  z.strictObject({
    name: z.string().min(1),
    alternateNames: z.array(z.string().min(1)).default([]),
    artistName: z.string().min(1).default('Josh Lennon'),
    // How citations name Josh, e.g. "J Lennon" for "Lennon, J."; the name otherwise.
    citationName: z.string().min(1).optional(),
    location: z.string().min(1).optional(),
    headline: z.strictObject({
      role: z.string().min(1),
      focus: z.array(z.string().min(1)).default([]),
    }),
    availability: z.string().min(1).optional(),
    bioShort: z.string().min(1),
    bioLong: orTodo(z.string().min(1)).optional(),
    portrait: z.strictObject({ src: localImage(image), alt: z.string().min(1) }).optional(),
    // A phone screenshot of Josh's artist profile in the Spotify app, for the music section.
    spotifyScreenshot: z
      .strictObject({ src: localImage(image), alt: z.string().min(1) })
      .optional(),
    now: z.array(z.string().min(1)).default([]),
    links: z.strictObject({
      github: z.url().optional(),
      linkedin: orTodo(z.url()).optional(),
      youtube: z.url().optional(),
      spotify: orTodo(z.url()).optional(),
      email: z.email().optional(),
    }),
    // The public CV in apps/site/public; its size is read at build time.
    cv: z
      .strictObject({ file: z.string().regex(/^\/[a-z0-9-]+\.pdf$/, 'e.g. /cv.pdf') })
      .optional(),
    // The GitHub repositories the homepage lists, as owner/name (spec M.1). A repository can
    // carry Josh's own description in place of GitHub's: { repo: owner/name, description: ... }.
    githubRepos: z
      .array(
        z.union([
          repoName.transform((repo) => ({ repo, description: undefined })),
          z.strictObject({ repo: repoName, description: z.string().min(1).max(200) }),
        ]),
      )
      .default([]),
    education: z.array(education).default([]),
    experience: z.array(experience(image)).default([]),
    skills: z
      .array(z.strictObject({ group: z.string().min(1), items: z.array(z.string().min(1)).min(1) }))
      .default([]),
    photos: z
      .array(
        z.strictObject({
          image: localImage(image),
          alt: z.string().min(1, 'Every photo needs alt text'),
          caption: orTodo(z.string().min(1)).optional(),
          thread: z.enum(THREADS).optional(),
          draft: z.boolean().default(false),
        }),
      )
      .default([]),
  });
