/**
 * Replaced (Phase 17): the original glyph (a rounded rectangle with a few
 * diagonal lines) didn't read as pressure washing — genuinely ambiguous,
 * not just a style mismatch. Redesigned as a wand/lance with two water
 * droplets, matching the exact style signature every other icon in this
 * set already uses (viewBox 0 0 24 24, stroke-only, strokeWidth 1.5, round
 * caps/joins). Verified by rendering to PNG at both a large preview size
 * and the icon's actual small render size (~20px, matching `h-5 w-5` in
 * ServicesPreview/Layout.tsx) before finalising — an earlier attempt using
 * a coiled hose shape and a 3-line "spray fan" from one point read as an
 * abstract squiggle and a sparkle/arrow respectively when actually
 * rendered, not as water; droplet outlines read unambiguously at both
 * sizes.
 */
export function JetwashIcon({ className }: { className?: string }) {
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
      <line x1="2" y1="22" x2="11" y2="13" />
      <path d="M11 13l2-2" />
      <path d="M17.5 3c0 2.2-2.1 2.8-2.1 4.9a2.1 2.1 0 1 0 4.2 0c0-2.1-2.1-2.7-2.1-4.9z" />
      <path d="M22 10c0 1.6-1.5 2-1.5 3.5a1.5 1.5 0 1 0 3 0c0-1.5-1.5-1.9-1.5-3.5z" />
    </svg>
  );
}
