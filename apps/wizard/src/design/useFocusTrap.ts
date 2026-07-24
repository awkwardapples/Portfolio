import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Shared focus-trap utility (UI overhaul Phase 2 — the mobile nav drawer's
 * first consumer). While `active`, Tab/Shift+Tab cycle only within the
 * elements inside `containerRef` — focus can never escape to the page
 * behind an open drawer/dialog.
 *
 * Deliberately hand-built rather than a dependency (`@radix-ui/react-dialog`
 * etc.): the existing Tooltip primitive already establishes this codebase's
 * preference for small, owned accessibility primitives over new
 * dependencies wherever the surface area is bounded and known, and a
 * single-purpose trap over a fixed, simple set of nav links + one button is
 * well within that bound.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement>, active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (container === null) return;

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key !== 'Tab' || container === null) return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, active]);
}
