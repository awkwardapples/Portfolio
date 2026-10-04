/**
 * Pure helpers for the GrowTrades browser frame (spec J.4, ADR-0044), so the
 * parts that guard against other pages and do geometry are unit-tested.
 */

export const DEMO_MESSAGE_TYPE = 'scb-demo:navigate';

/**
 * The path a navigation message reports, or null when the message is not
 * from our demo: it must come from this origin, from the demo's own frame,
 * and carry a local path.
 */
export function readNavigateMessage(
  event: { origin: string; source: unknown; data: unknown },
  expected: { origin: string; source: unknown },
): string | null {
  if (event.origin !== expected.origin || event.source !== expected.source || !expected.source) {
    return null;
  }
  const data = event.data as { type?: unknown; path?: unknown } | null;
  if (!data || data.type !== DEMO_MESSAGE_TYPE || typeof data.path !== 'string') return null;
  const path = data.path;
  if (!path.startsWith('/') || path.startsWith('//') || path.length > 200) return null;
  return path;
}

/** How the frame shows a viewport of `viewportWidth` CSS pixels in a box `boxWidth` wide. */
export function frameScale(boxWidth: number, viewportWidth: number): number {
  if (boxWidth <= 0 || viewportWidth <= 0) return 1;
  return Math.min(1, boxWidth / viewportWidth);
}

/** The address bar's text: the client's domain and the demo's current path. */
export function addressFor(domain: string, path: string): string {
  return path === '/' ? domain : `${domain}${path}`;
}
