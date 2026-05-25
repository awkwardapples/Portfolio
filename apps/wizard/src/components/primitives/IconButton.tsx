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
interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /** Plain-language description of the action. Required for accessibility. */
  label: string;
  /** The icon to render. */
  children: ReactNode;
  /** Tooltip side. Default 'top'. */
  tooltipSide?: 'top' | 'bottom';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, children, tooltipSide = 'top', className, type = 'button', ...rest },
  ref,
) {
  return (
    <Tooltip label={label} side={tooltipSide}>
      <button
        ref={ref}
        type={type}
        aria-label={label}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded',
          'text-text-muted hover:bg-surface-sunken hover:text-text',
          'transition-colors disabled:cursor-not-allowed disabled:text-text-subtle',
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    </Tooltip>
  );
});
