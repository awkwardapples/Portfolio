import type { ReactElement } from 'react';

/**
 * Skip-to-main-content link. Visually hidden until focused (keyboard users).
 * The destination element must have id="main".
 */
export function SkipLink(): ReactElement {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-surface focus:p-3 focus:text-text focus:shadow-elevated"
    >
      Skip to main content
    </a>
  );
}
