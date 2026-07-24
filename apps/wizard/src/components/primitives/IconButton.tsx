import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';

import { cn } from '@/design/cn';
import { Tooltip } from '@/components/primitives/Tooltip';

/**
 * IconButton — an icon-only control.
 *
 * The `label` prop is REQUIRED (not optional). This is the structural
 * enforcement of ADR-0012's "icon-only buttons must have accessible labels":
 * you cannot construct an IconButton without a label, so the constraint
 * cannot be forgotten. TypeScript fails the build otherwise.
 *
 * The label drives BOTH:
 *   - the accessible name (aria-label), and
 *   - the visible tooltip text (on hover and focus).
 *
 * `label` is intentionally omitted from the spread onto the <button> so it is
 * never rendered as a stray DOM attribute.
 */
type IconButtonSize = 'sm' | 'lg';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /** Plain-language description of the action. Required for accessibility. */
  label: string;
  /** The icon to render. */
  children: ReactNode;
  /** Tooltip side. Default 'top'. */
  tooltipSide?: 'top' | 'bottom';
  /**
   * `sm` (32px, default) is unchanged from the original primitive. `lg`
   * (44px, added in the UI overhaul's Phase 1 foundation) meets the WCAG
   * touch-target minimum and should be used for any icon-only control on a
   * marketing page (e.g. the mobile nav's menu toggle).
   */
  size?: IconButtonSize;
  /**
   * `'dark'` (Phase 13) renders for use on a dark surface — `text-inverse-
   * muted` at rest, `text-inverse`/`surface-dark-elevated` on hover, instead
   * of the light-mode defaults. Defaults to `'light'` (unchanged behaviour).
   * Added rather than a `className` override because this primitive's own
   * colour utilities and an override would target the same CSS properties
   * with no `tailwind-merge` to resolve the conflict predictably — the same
   * reasoning `Card`'s `surface` prop already established.
   */
  surface?: 'light' | 'dark';
}

const sizeClasses: Record<IconButtonSize, string> = {
  sm: 'h-8 w-8',
  lg: 'h-11 w-11',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    label,
    children,
    tooltipSide = 'top',
    size = 'sm',
    surface = 'light',
    className,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isDark = surface === 'dark';
  return (
    <Tooltip label={label} side={tooltipSide}>
      <button
        ref={ref}
        type={type}
        aria-label={label}
        className={cn(
          'inline-flex items-center justify-center rounded',
          isDark
            ? 'text-text-inverse-muted hover:bg-surface-dark-elevated hover:text-text-inverse'
            : 'text-text-muted hover:bg-surface-sunken hover:text-text',
          'transition-colors duration-fast active:scale-95',
          isDark ? 'disabled:text-border-inverse' : 'disabled:text-text-subtle',
          'disabled:cursor-not-allowed disabled:active:scale-100',
          sizeClasses[size],
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    </Tooltip>
  );
});
