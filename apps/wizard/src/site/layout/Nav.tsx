import type { ReactElement } from 'react';
import { Link } from '@/site/routing/Link';
import { ROUTES } from '@/site/routing/routes';

interface NavProps {
  readonly currentPath: string;
}

/**
 * Primary site navigation. Renders every route from the static table except
 * those explicitly opted out via `showInNav: false` (e.g. /privacy, reachable
 * from the footer instead — Step 5.14).
 *
 * Active route gets aria-current="page" and a visible underline. Mobile
 * (narrow viewports): horizontal scroll on overflow (ADR-0016).
 */
export function Nav({ currentPath }: NavProps): ReactElement {
  const navRoutes = ROUTES.filter((route) => route.showInNav !== false);
  return (
    <nav aria-label="Primary">
      <ul className="flex gap-6 overflow-x-auto whitespace-nowrap" role="list">
        {navRoutes.map((route) => {
          const isActive = isActiveRoute(route.path, currentPath);
          return (
            <li key={route.path}>
              <Link
                to={route.path}
                aria-current={isActive ? 'page' : undefined}
                className={
                  isActive
                    ? 'inline-block border-b-2 border-primary py-2 text-text'
                    : 'inline-block border-b-2 border-transparent py-2 text-text-muted hover:text-text'
                }
              >
                {route.navLabel}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function isActiveRoute(routePath: string, currentPath: string): boolean {
  const normalized = currentPath === '/' ? '/' : currentPath.replace(/\/$/, '');
  return routePath === normalized;
}
