import type { ReactElement } from 'react';

/**
 * Small, shared decorative icons used across the section library — the
 * technical-line-art vocabulary established by Hero's `MeasuredDrawing`
 * (thin single-colour strokes/fills, never illustrative). Extracted here
 * once a shape is used by a second section (Phase 8: `QuoteIcon` was
 * first built locally in Intro, then needed again by Why Choose Us's
 * testimonials — exactly the "duplicated twice, extract it" rule).
 */
export function QuoteIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg
      width="32"
      height="24"
      viewBox="0 0 32 24"
      fill="none"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 24V14.4C0 6.4 4.8 1.2 12 0L13.2 3.6C8.4 4.8 6 7.6 6 11.6H12V24H0ZM18 24V14.4C18 6.4 22.8 1.2 30 0L31.2 3.6C26.4 4.8 24 7.6 24 11.6H30V24H18Z"
        fill="currentColor"
      />
    </svg>
  );
}
