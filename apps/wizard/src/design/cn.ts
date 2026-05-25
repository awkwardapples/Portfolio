import clsx, { type ClassValue } from 'clsx';

/**
 * Compose class names conditionally.
 *
 * A thin wrapper over clsx (already a dependency). We deliberately do NOT add
 * tailwind-merge: the closed token system means we rarely have conflicting
 * utilities, and adding merge behaviour would mask genuine mistakes (two
 * conflicting paddings should be a code-review catch, not silently merged).
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
