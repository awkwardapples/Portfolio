/**
 * Where the SCB site is, and how it moves (portfolio spec J.3, ADR-0044).
 *
 * Two router modes, chosen at build time with VITE_ROUTER_MODE:
 *
 * - `history` (the default, the real SCB site): the address bar is the
 *   route; navigation uses history.pushState.
 * - `memory` (the demo framed by the portfolio): the route lives in this
 *   module, so the iframe's own URL never changes and no deep link is
 *   needed. Each navigation is posted to the parent page as
 *   `{ type: 'scb-demo:navigate', path }`, addressed to this origin only, so
 *   the portfolio's frame can show it in its address bar. A link opened in a
 *   new tab starts the demo at its page through `?path=`.
 *
 * Every navigation then dispatches NAVIGATE_EVENT, which SiteApp listens for.
 */
export type RouterMode = 'history' | 'memory';

export const NAVIGATE_EVENT = 'goqw:navigate';
export const DEMO_MESSAGE_TYPE = 'scb-demo:navigate';

export function resolveRouterMode(value: string | undefined): RouterMode {
  return value === 'memory' ? 'memory' : 'history';
}

export const ROUTER_MODE: RouterMode = resolveRouterMode(import.meta.env.VITE_ROUTER_MODE);

/** Splits "/quote?service=fencing#top" into its path and search. */
export function splitTarget(to: string): { path: string; search: string } {
  const withoutHash = to.split('#')[0] ?? '';
  const index = withoutHash.indexOf('?');
  const path = index === -1 ? withoutHash : withoutHash.slice(0, index);
  const search = index === -1 ? '' : withoutHash.slice(index);
  return { path: path === '' ? '/' : path, search };
}

/** The demo's own address for a page, for links opened in a new tab. */
export function memoryHref(base: string, to: string): string {
  const { path, search } = splitTarget(to);
  const params = new URLSearchParams(search);
  params.set('path', path);
  return `${base}?${params.toString()}`;
}

/** The page a memory-mode demo starts on: ?path= when given, else the home page. */
export function initialMemoryTarget(search: string): { path: string; search: string } {
  const params = new URLSearchParams(search);
  const path = params.get('path');
  params.delete('path');
  const rest = params.toString();
  return {
    path: path && path.startsWith('/') && !path.startsWith('//') ? path : '/',
    search: rest ? `?${rest}` : '',
  };
}

let memory =
  typeof window === 'undefined'
    ? { path: '/', search: '' }
    : initialMemoryTarget(window.location.search);

export function currentPath(): string {
  if (ROUTER_MODE === 'memory') return memory.path;
  return typeof window === 'undefined' ? '/' : window.location.pathname;
}

export function currentSearch(): string {
  if (ROUTER_MODE === 'memory') return memory.search;
  return typeof window === 'undefined' ? '' : window.location.search;
}

/** Tells the framing page where the demo is (memory mode only). */
export function notifyParent(path: string = currentPath()): void {
  if (ROUTER_MODE !== 'memory' || typeof window === 'undefined' || window.parent === window) return;
  window.parent.postMessage({ type: DEMO_MESSAGE_TYPE, path }, window.location.origin);
}

/** Goes to `to` ("/services", "/quote?service=fencing") in the current mode. */
export function navigate(to: string): void {
  const target = splitTarget(to);
  if (target.path === currentPath() && target.search === currentSearch()) return;
  if (ROUTER_MODE === 'memory') {
    memory = target;
  } else {
    window.history.pushState({}, '', to);
  }
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
  window.scrollTo(0, 0);
  notifyParent(target.path);
}
