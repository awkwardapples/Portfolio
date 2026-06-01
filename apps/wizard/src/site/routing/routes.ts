/**
 * Static route table. The single source of truth for which routes exist.
 *
 * Each entry declares a path, document title, nav label, and an element
 * factory. Populated in Step 5.0 Commit 5 (after pages exist).
 * Adding a route = adding one entry here + one page component.
 */

import type { ReactElement } from 'react';

export interface RouteEntry {
  readonly path: string;
  readonly title: string;
  readonly navLabel: string;
  readonly element: () => ReactElement;
}

// Populated with real page imports in Commit 5 (feat(site): populated route table).
export const ROUTES: readonly RouteEntry[] = [];

export const DEFAULT_ROUTE: RouteEntry = {
  path: '/',
  title: 'Home',
  navLabel: 'Home',
  element: () => null as unknown as ReactElement,
};

/**
 * Pure matcher: given a pathname, return the matching route or DEFAULT_ROUTE.
 * Exact match only — no wildcards, no params, no regex.
 * Normalises trailing slash (except root).
 */
export function matchRoute(pathname: string): RouteEntry {
  const normalized = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
  return ROUTES.find((r) => r.path === normalized) ?? DEFAULT_ROUTE;
}
