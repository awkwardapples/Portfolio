import { useEffect, useRef, type ReactElement, type RefObject } from 'react';

import { cn } from '@/design/cn';
import { useFocusTrap } from '@/design/useFocusTrap';
import { buttonClassName } from '@/components/primitives/Button';
import { IconButton } from '@/components/primitives/IconButton';
import { Link } from '@/site/routing/Link';
import type { RouteEntry } from '@/site/routing/routes';
import { isActiveRoute } from '@/site/layout/isActiveRoute';

interface MobileMenuProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  /** Nav routes excluding the quote CTA, which renders separately below them. */
  readonly routes: readonly RouteEntry[];
  readonly quoteRoute: RouteEntry | undefined;
  readonly currentPath: string;
  /** The hamburger trigger, so focus can return to it on close. */
  readonly triggerRef: RefObject<HTMLButtonElement>;
}

/**
 * Slide-in mobile navigation drawer (UI overhaul Phase 2).
 *
 * Always mounted (never conditionally rendered) — visibility is purely a
 * transform/opacity toggle, which avoids any mount/unmount timing dance for
 * the exit animation. This is the reconsidered version of the Phase 1
 * component-registry note that assumed a `motion`-library exit animation
 * would be needed: it isn't, for a transform-only slide, and this keeps the
 * bundle free of a new dependency for something CSS already does correctly.
 *
 * Accessible dialog behaviour is hand-built (focus trap via the shared
 * `useFocusTrap`, Escape to close, focus returns to the trigger, a
 * `role="dialog"`/`aria-modal` panel) rather than a Radix/shadcn dependency
 * — consistent with this codebase's existing Tooltip primitive, which
 * already established "small, owned accessibility primitive over a new
 * dependency" for a single, well-bounded interaction surface.
 */
export function MobileMenu({
  isOpen,
  onClose,
  routes,
  quoteRoute,
  currentPath,
  triggerRef,
}: MobileMenuProps): ReactElement {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        onClose();
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, triggerRef]);

  function handleLinkClick(): void {
    onClose();
  }

  function handleBackdropDismiss(): void {
    onClose();
    triggerRef.current?.focus();
  }

  return (
    <>
      {/* Scrim: flat, semi-transparent neutral — never blurred. Mouse/touch
          convenience only; Escape and the visible close button are the
          accessible dismissal paths, so this is a real <button> (not a div
          with a click handler) but excluded from the tab order and hidden
          from assistive tech. */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={handleBackdropDismiss}
        className={cn(
          'fixed inset-0 z-40 bg-neutral-900/50 transition-opacity duration-base md:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <div
        id="mobile-nav-menu"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        tabIndex={-1}
        className={cn(
          'fixed inset-y-0 right-0 z-40 flex w-full max-w-xs flex-col bg-surface-nav p-6',
          'shadow-overlay transition-transform duration-base md:hidden',
          isOpen ? 'translate-x-0' : 'pointer-events-none translate-x-full',
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-inverse-muted">Menu</span>
          <IconButton
            label="Close menu"
            size="lg"
            surface="dark"
            onClick={() => {
              onClose();
              triggerRef.current?.focus();
            }}
          >
            <CloseIcon />
          </IconButton>
        </div>

        <ul className="mt-6 flex flex-col gap-1" role="list">
          {routes.map((route) => {
            const active = isActiveRoute(route.path, currentPath);
            return (
              <li key={route.path}>
                <Link
                  to={route.path}
                  onClick={handleLinkClick}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'block rounded px-3 py-3 text-base transition-colors duration-fast',
                    active
                      ? 'bg-surface-dark-elevated font-medium text-text-inverse'
                      : 'text-text-inverse-muted hover:bg-surface-dark-elevated hover:text-text-inverse',
                  )}
                >
                  {route.navLabel}
                </Link>
              </li>
            );
          })}
        </ul>

        {quoteRoute && (
          <Link
            to={quoteRoute.path}
            onClick={handleLinkClick}
            className={cn(buttonClassName('primary', 'lg'), 'mt-6 w-full')}
          >
            {quoteRoute.navLabel}
          </Link>
        )}
      </div>
    </>
  );
}

function CloseIcon(): ReactElement {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 5L15 15M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
