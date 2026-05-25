import { type ReactElement } from 'react';

import { cn } from '@/design/cn';

interface SkeletonProps {
  /** Tailwind height class from the spacing scale, e.g. 'h-4', 'h-10'. */
  className?: string;
  /** Accessible: skeletons are decorative placeholders, hidden from AT. */
  rounded?: boolean;
}

/**
 * Skeleton primitive — a single placeholder block.
 *
 * No spinners exist anywhere in the product (ADR-0012). Loading is always
 * represented by skeletons that mirror the real layout.
 *
 * The pulse is a SUBTLE OPACITY animation only — never a shimmer gradient
 * (gradients are banned, and a moving gradient would be decorative). The
 * animation is disabled entirely under prefers-reduced-motion via the base
 * layer media query in index.css.
 *
 * Skeletons are aria-hidden: they convey nothing to assistive tech, which
 * instead hears the loading state announced by the container (4.3+).
 */
export function Skeleton({ className, rounded = true }: SkeletonProps): ReactElement {
  return (
    <span
      aria-hidden="true"
      className={cn('block bg-neutral-100 animate-goqw-pulse', rounded ? 'rounded' : '', className)}
    />
  );
}
