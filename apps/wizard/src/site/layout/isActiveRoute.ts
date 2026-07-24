/**
 * Shared active-route check, used by both the desktop Nav and the mobile
 * menu so "is this the current page" is decided in exactly one place.
 */
export function isActiveRoute(routePath: string, currentPath: string): boolean {
  const normalized = currentPath === '/' ? '/' : currentPath.replace(/\/$/, '');
  return routePath === normalized;
}
