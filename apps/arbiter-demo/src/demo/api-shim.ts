/**
 * Installs the demo's API stand-in (shim.ts) before the console loads:
 * fetch and EventSource answer the console's API paths from the snapshot,
 * and everything else goes to the browser's own. Imported first by main.tsx.
 */
import { createShim } from './shim';

const shim = createShim({
  data: `${import.meta.env.BASE_URL}data/`,
  origin: window.location.origin,
  realFetch: window.fetch.bind(window),
});
const RealEventSource = window.EventSource;

window.fetch = shim.fetch;
window.EventSource = Object.assign(
  function EventSource(url: string | URL, init?: EventSourceInit) {
    const href = String(url);
    return shim.apiPath(href) ? new shim.EventSource(href) : new RealEventSource(href, init);
  },
  { CONNECTING: 0, OPEN: 1, CLOSED: 2 },
) as unknown as typeof window.EventSource;
document.addEventListener('click', shim.onClick, true);
