import type { ClientDirective } from 'astro';

/**
 * `client:afterload` (ADR-0048): hydrate once the page has loaded, shown its
 * first content and gone idle. Astro's own `client:idle` can fire before the
 * first paint, so a large island's JavaScript would compete with the text
 * the visitor is waiting to see (and count against Largest Contentful Paint).
 * This waits for the `load` event, then for the browser's own
 * first-contentful-paint entry (or two animation frames where that is not
 * reported, and never more than three seconds), then for an idle moment.
 * The contact wizard uses it, behind a skeleton in its shape.
 */
const afterLoad: ClientDirective = (load) => {
  const hydrate = async () => {
    const run = await load();
    await run();
  };
  const whenIdle = () => {
    if (typeof window.requestIdleCallback === 'function')
      window.requestIdleCallback(hydrate, { timeout: 2000 });
    else window.setTimeout(hydrate, 200);
  };
  const afterFirstPaint = () => {
    let done = false;
    const next = () => {
      if (done) return;
      done = true;
      whenIdle();
    };
    if (performance.getEntriesByName('first-contentful-paint').length > 0) return next();
    if (!PerformanceObserver.supportedEntryTypes?.includes('paint')) {
      requestAnimationFrame(() => requestAnimationFrame(next));
      return;
    }
    const observer = new PerformanceObserver((list) => {
      if (list.getEntriesByName('first-contentful-paint').length === 0) return;
      observer.disconnect();
      next();
    });
    observer.observe({ type: 'paint', buffered: true });
    window.setTimeout(next, 3000);
  };
  if (document.readyState === 'complete') afterFirstPaint();
  else window.addEventListener('load', afterFirstPaint, { once: true });
};

export default afterLoad;
