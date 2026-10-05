import type { SchemaContext } from 'astro:content';
import { z } from 'astro/zod';

/**
 * Shared media schemas (spec H.2). Objects are strict, so a mistyped key is
 * reported with the file and the field instead of being silently ignored.
 */

type ImageFn = SchemaContext['image'];

/**
 * An image beside the entry. Accepts `photo.jpg` as well as `./photo.jpg`,
 * because the CMS may write either for files saved in the entry's folder.
 */
export function localImage(image: ImageFn) {
  return z.preprocess(
    (value) =>
      typeof value === 'string' && !/^(\.{1,2}\/|\/|[a-z][a-z0-9+.-]*:)/i.test(value)
        ? `./${value}`
        : value,
    image(),
  );
}

export const credit = z
  .strictObject({
    owner: z.enum(['josh', 'external']),
    name: z.string().optional(),
    url: z.url().optional(),
  })
  .refine((c) => c.owner === 'josh' || Boolean(c.name && c.url), {
    message: 'External media needs a credit name and source URL',
  });

/** A PDF in apps/site/public/documents/, added with `pnpm media:pdf`. */
export const documentFields = {
  file: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*\.pdf$/,
      'Use the lowercase-hyphenated file name in public/documents/, e.g. kerr-microscopy-dissertation.pdf',
    ),
  title: z.string().min(1),
  docType: z.enum(['paper', 'dissertation', 'report', 'slides', 'poster']),
  peerReviewed: z.boolean(),
  credit: credit.default({ owner: 'josh' }),
};

export const documentItem = z.strictObject(documentFields);

export const mediaItem = (image: ImageFn) =>
  z.discriminatedUnion('type', [
    z.strictObject({
      type: z.literal('image'),
      src: localImage(image),
      alt: z.string().min(1, 'Every image needs alt text'),
      caption: z.string().optional(),
      credit: credit.default({ owner: 'josh' }),
    }),
    z.strictObject({
      type: z.literal('youtube'),
      id: z.string().regex(/^[\w-]{11}$/, 'A YouTube video id is 11 characters'),
      title: z.string().min(1),
      start: z.number().int().optional(),
      playlist: z.string().optional(),
      // The date YouTube shows under the video; with it, search engines get a VideoObject (spec S).
      uploadDate: z.coerce.date().optional(),
    }),
    z.strictObject({
      type: z.literal('spotify'),
      url: z.url(),
      title: z.string().min(1),
    }),
    z.strictObject({
      type: z.literal('video'),
      // Refers to an encoded set in public/media/video/<name>/ (pnpm media:video).
      name: z.string().regex(/^[a-z0-9-]+$/),
      title: z.string().min(1),
      captions: z.string().optional(),
      loop: z.boolean().default(false),
    }),
    z.strictObject({
      type: z.literal('audio'),
      src: z.string().min(1),
      title: z.string().min(1),
      transcript: z.string().optional(),
    }),
    z.strictObject({ type: z.literal('document'), ...documentFields }),
  ]);
