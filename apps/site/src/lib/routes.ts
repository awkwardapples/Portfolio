/**
 * The site's routes as navigation sees them (spec F.1, F.2).
 *
 * A page is linked from the navigation and footer only once it exists
 * (`ready`), so a production build never links to a 404 while the
 * transformation is under way. `astro dev` links everything, so the full
 * navigation can be reviewed early. Each pass that builds a page sets its
 * route ready.
 */
export interface SiteRoute {
  readonly path: string;
  readonly label: string;
  readonly ready: boolean;
}

export const ROUTES = {
  work: { path: '/work', label: 'Work', ready: true },
  research: { path: '/research', label: 'Research', ready: true },
  music: { path: '/music', label: 'Music', ready: false }, // Pass 8
  about: { path: '/about', label: 'About', ready: true },
  // Built once the first post exists; the footer checks (Footer.astro).
  log: { path: '/log', label: 'Log', ready: true },
  contact: { path: '/contact', label: 'Start a conversation', ready: true },
  privacy: { path: '/privacy', label: 'Privacy', ready: true },
  rss: { path: '/rss.xml', label: 'RSS', ready: true },
} as const satisfies Record<string, SiteRoute>;

/** Main navigation, in order (spec F.2). */
export const MAIN_NAV: readonly SiteRoute[] = [
  ROUTES.work,
  ROUTES.research,
  ROUTES.music,
  ROUTES.about,
];

/** Footer links beyond the main navigation (spec F.2). */
export const FOOTER_NAV: readonly SiteRoute[] = [ROUTES.log, ROUTES.privacy, ROUTES.rss];

export function isLinkable(route: SiteRoute): boolean {
  return route.ready || import.meta.env.DEV;
}

/** True when `currentPath` is the route or a page beneath it (`/work/x` is under Work). */
export function isCurrent(routePath: string, currentPath: string): boolean {
  return currentPath === routePath || currentPath.startsWith(`${routePath}/`);
}
