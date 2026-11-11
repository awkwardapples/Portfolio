/**
 * Tells the framing page where the console is, so its address bar can
 * follow (Pass 11, E.3, E.5). Arbiter's console really runs at /console/, so
 * the address it reports is that path. The message goes only to this page's
 * own origin: the portfolio that frames it.
 */
export const NAVIGATE = 'arbiter-demo:navigate';

export function navigationMessage(pathname: string): { type: typeof NAVIGATE; path: string } {
  return { type: NAVIGATE, path: `/console${pathname}` };
}

export function reportNavigation(win: Window, pathname: string): void {
  if (win.parent === win) return;
  win.parent.postMessage(navigationMessage(pathname), win.location.origin);
}
