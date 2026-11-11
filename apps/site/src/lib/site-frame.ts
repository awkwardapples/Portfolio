/**
 * Pure helpers for the browser frame around the demos (spec J.4, ADR-0044;
 * Pass 11, E.5), so the parts that guard against other pages and do
 * geometry are unit-tested.
 */

/** The SCB demo's message type; each demo names its own (src/lib/demos.ts). */
export const DEMO_MESSAGE_TYPE = 'scb-demo:navigate';

/**
 * The path a navigation message reports, or null when the message is not
 * from our demo: it must come from this origin, from the demo's own frame,
 * carry the demo's message type, and carry a local path.
 */
export function readNavigateMessage(
  event: { origin: string; source: unknown; data: unknown },
  expected: { origin: string; source: unknown },
  messageType: string = DEMO_MESSAGE_TYPE,
): string | null {
  if (event.origin !== expected.origin || event.source !== expected.source || !expected.source) {
    return null;
  }
  const data = event.data as { type?: unknown; path?: unknown } | null;
  if (!data || data.type !== messageType || typeof data.path !== 'string') return null;
  const path = data.path;
  if (!path.startsWith('/') || path.startsWith('//') || path.length > 200) return null;
  return path;
}

/** How the frame shows a viewport of `viewportWidth` CSS pixels in a box `boxWidth` wide. */
export function frameScale(boxWidth: number, viewportWidth: number): number {
  if (boxWidth <= 0 || viewportWidth <= 0) return 1;
  return Math.min(1, boxWidth / viewportWidth);
}

/**
 * The full-screen phone dialog for a demo that needs a wider viewport
 * (Arbiter's console needs 844 px): on a narrower screen the demo runs at
 * that width, scaled to fit, as tall as the scaled box allows. Without a
 * minimum width, or on a wide enough screen, it fills the box natively.
 */
export function phoneFrame(
  box: { width: number; height: number },
  minWidth: number | undefined,
): { width: number; height: number; scale: number } {
  if (!minWidth || box.width >= minWidth || box.width <= 0) {
    return { width: box.width, height: box.height, scale: 1 };
  }
  const scale = box.width / minWidth;
  return { width: minWidth, height: Math.round(box.height / scale), scale };
}

/** The address bar's text: the demo's domain and its current path. */
export function addressFor(domain: string, path: string): string {
  return path === '/' ? domain : `${domain}${path}`;
}
