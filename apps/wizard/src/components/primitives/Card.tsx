import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/design/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /**
   * Whether this card responds to hover (i.e. it is, or wraps, a link). Adds
   * a border-colour shift only — never a shadow. Design-bible.md §5: static
   * cards never get a shadow; hover affordance comes from a border/background
   * change instead.
   */
  interactive?: boolean;
  /**
   * `'dark'` (Phase 12) renders the card for use inside a dark-surfaced
   * section (e.g. Services Preview's tiles on `surface-dark-raised`) —
   * `surface-dark-elevated` fill (one step lighter than either dark section
   * tone, reading as "raised" rather than sunken) and `border-inverse`
   * instead of the light-mode `surface`/`border`. Defaults to `'light'`,
   * which is byte-for-byte the original recipe — every other Card call site
   * (Our Work, Contact) is untouched by this addition.
   */
  surface?: 'light' | 'dark';
}

/**
 * Card primitive — the one flat-card pattern for the whole product (UI
 * overhaul Phase 1 foundation). Hairline border, single radius, no shadow at
 * rest, ever. Used by Services Preview, and any future card-shaped content
 * (testimonials nested in Why Choose Us, etc.) so every card on the site
 * shares one recipe rather than each section inventing its own.
 *
 * Deliberately NOT used by Why Choose Us's value-prop grid — design-bible.md
 * §9 keeps that section card-less on purpose, to visually differentiate two
 * structurally similar grid sections.
 */
export function Card({
  children,
  interactive = false,
  surface = 'light',
  className,
  ...rest
}: CardProps) {
  const isDark = surface === 'dark';
  return (
    <div
      className={cn(
        'rounded border p-6',
        isDark ? 'border-border-inverse bg-surface-dark-elevated' : 'border-border bg-surface',
        interactive &&
          (isDark
            ? 'transition-colors duration-fast hover:border-text-inverse-muted'
            : 'transition-colors duration-fast hover:border-border-strong active:bg-surface-sunken'),
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
