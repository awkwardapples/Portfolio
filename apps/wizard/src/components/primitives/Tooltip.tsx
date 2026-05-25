import { type ReactElement, cloneElement, useId, useState, useCallback } from 'react';

import { cn } from '@/design/cn';

interface TooltipProps {
  /** Plain-language description of what the wrapped control does. */
  label: string;
  /** The single interactive child the tooltip describes. */
  children: ReactElement;
  /** Side to render the tooltip. Default 'top'. */
  side?: 'top' | 'bottom';
}

/**
 * Tooltip primitive.
 *
 * Accessibility is structural (ADR-0012):
 *   - Shows on BOTH hover and keyboard focus.
 *   - The trigger is linked to the tooltip via aria-describedby.
 *   - The tooltip has role="tooltip".
 *   - Escape dismisses it.
 *
 * Positioning is intentionally simple (absolute, fixed side) rather than
 * collision-aware. If we later need flip/shift behaviour near viewport edges,
 * that is the point at which a small headless positioning library (e.g.
 * Floating UI) would be justified — recorded as a deferred option, not a need.
 *
 * Flat surface, single functional elevation shadow, no gradient/blur.
 */
export function Tooltip({ label, children, side = 'top' }: TooltipProps): ReactElement {
  const id = useId();
  const [open, setOpen] = useState(false);

  const show = useCallback(() => setOpen(true), []);
  const hide = useCallback(() => setOpen(false), []);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
  }, []);

  const trigger = cloneElement(children, {
    'aria-describedby': open ? id : undefined,
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
    onKeyDown,
  });

  return (
    <span className="relative inline-flex">
      {trigger}
      {open && (
        <span
          id={id}
          role="tooltip"
          className={cn(
            'pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap',
            'rounded bg-neutral-800 px-2 py-1 text-xs text-text-inverse shadow-elevated',
            side === 'top' ? 'bottom-full mb-1' : 'top-full mt-1',
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}
