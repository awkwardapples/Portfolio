/**
 * Replaced (Phase 17): the original glyph's brush head/handle read
 * ambiguously at small size. Redesigned as a clearer paintbrush — a
 * diagonal handle/ferrule wedge meeting a flared, rounded bristle tip
 * touching down with a short stroke mark — matching the exact style
 * signature every other icon in this set already uses (viewBox 0 0 24 24,
 * stroke-only, strokeWidth 1.5, round caps/joins). Verified by rendering to
 * PNG at both a large preview size and the icon's actual small render size
 * (~20px, matching `h-5 w-5` in ServicesPreview/Layout.tsx) before
 * finalising.
 */
export function PaintingIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M17 3l4 4-8 8-4-4z" />
      <path d="M9 11l4 4-3 3c-1.5 1.5-4 1.5-5.5 0s-1.5-4 0-5.5z" />
      <line x1="3" y1="21" x2="5" y2="19" />
    </svg>
  );
}
