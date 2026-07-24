import { useRef, useState, type ReactElement } from 'react';
import { Link } from '@/site/routing/Link';
import { ROUTES } from '@/site/routing/routes';
import { cn } from '@/design/cn';
import { buttonClassName } from '@/components/primitives/Button';
import { IconButton } from '@/components/primitives/IconButton';
import { isActiveRoute } from '@/site/layout/isActiveRoute';
import { MobileMenu } from '@/site/layout/MobileMenu';

interface NavProps {
  readonly currentPath: string;
  /**
   * True while the current page's Hero is still in view — see
   * useHeaderScrollState. Drives the quote CTA's variant: outline while the
   * Hero (which already carries its own primary CTA) is visible, filled
   * once it's scrolled past, per design-bible.md §10's "never two filled
   * primary buttons in one viewport" rule applied to an always-visible
   * sticky nav.
   */
  readonly heroInView: boolean;
}

/**
 * Primary site navigation (UI overhaul Phase 2). Renders every route from
 * the static table except those explicitly opted out via `showInNav: false`
 * (e.g. /privacy, reachable from the footer instead — Step 5.14).
 *
 * The quote route renders separately from the other links, styled as a CTA
 * (not a plain nav link) — see `buttonClassName`. All other routes keep the
 * original link treatment, now with an animated (scaleX) underline instead
 * of a static border, per design-bible.md §11's "animated underline" rule.
 *
 * Mobile (below `md`): the link list and CTA are hidden; a hamburger
 * trigger opens `MobileMenu` instead. Desktop nav is unaffected by the
 * mobile menu's open/close state.
 */
export function Nav({ currentPath, heroInView }: NavProps): ReactElement {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  const navRoutes = ROUTES.filter((route) => route.showInNav !== false);
  const linkRoutes = navRoutes.filter((route) => route.path !== '/quote');
  const quoteRoute = navRoutes.find((route) => route.path === '/quote');

  return (
    <>
      {/* Desktop */}
      <nav aria-label="Primary" className="hidden md:block">
        <ul className="flex items-center gap-6" role="list">
          {linkRoutes.map((route) => {
            const active = isActiveRoute(route.path, currentPath);
            return (
              <li key={route.path}>
                <Link
                  to={route.path}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group relative inline-block py-2 text-sm transition-colors duration-fast',
                    active
                      ? 'text-text-inverse'
                      : 'text-text-inverse-muted hover:text-text-inverse',
                  )}
                >
                  {route.navLabel}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-x-0 -bottom-px h-0.5 origin-left bg-primary-inverse transition-transform duration-base',
                      active
                        ? 'scale-x-100'
                        : 'scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100',
                    )}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {quoteRoute && (
        <Link
          to={quoteRoute.path}
          className={cn(
            'hidden md:inline-flex',
            buttonClassName(heroInView ? 'secondary' : 'primary', 'md'),
          )}
        >
          {quoteRoute.navLabel}
        </Link>
      )}

      {/* Mobile trigger */}
      <div className="md:hidden">
        <IconButton
          ref={menuTriggerRef}
          label={isMenuOpen ? 'Close menu' : 'Open menu'}
          size="lg"
          surface="dark"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav-menu"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <MenuIcon />
        </IconButton>
      </div>

      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        routes={linkRoutes}
        quoteRoute={quoteRoute}
        currentPath={currentPath}
        triggerRef={menuTriggerRef}
      />
    </>
  );
}

function MenuIcon(): ReactElement {
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
        d="M3 5H17M3 10H17M3 15H17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
