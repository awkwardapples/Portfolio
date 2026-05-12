/**
 * Wizard entry point.
 *
 * Contract:
 *   - Looks for a DOM element with id="qw-root".
 *   - Mounts the React app into it.
 *   - If the element is absent, logs a clear error and exits without throwing
 *     (we don't want to break the WordPress page if the shortcode wasn't used).
 *
 * This is the same code path in dev (mounting into index.html) and production
 * (mounting into the WordPress shortcode output). Keeping the contract identical
 * means we don't get "works in dev, broken in WP" surprises.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/App';
import '@/styles/index.css';

const MOUNT_ID = 'qw-root';

function mount(): void {
  const container = document.getElementById(MOUNT_ID);

  if (!container) {
    // Non-fatal: the page may not contain the wizard shortcode. Log so
    // engineers spot misconfigurations, but do nothing further.
    console.warn(
      `[quote-wizard] no element with id="${MOUNT_ID}" found on this page; wizard will not mount.`,
    );
    return;
  }

  const root = createRoot(container);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// Mount as soon as the DOM is parsed. The bundle is enqueued in the page
// footer by WordPress in production, so the DOM is already ready by the
// time this runs. In dev, the script is at end-of-body too.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}
