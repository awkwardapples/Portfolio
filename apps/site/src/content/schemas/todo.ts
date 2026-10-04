import { z } from 'astro/zod';

import { TODO_MARK } from '../checks';

/**
 * A placeholder for content Josh has not supplied yet (spec T.4), written as
 * `TODO(josh): what is needed`. Fields that can be missing accept one in a
 * draft; the content checks fail a production build if a placeholder is left
 * in anything that is not a draft.
 */
export const todo = z
  .string()
  .startsWith(TODO_MARK, { message: `A placeholder starts with "${TODO_MARK}:"` });

/** The field's real type, or a placeholder. */
export function orTodo<T extends z.ZodType>(schema: T) {
  return z.union([todo, schema]);
}
