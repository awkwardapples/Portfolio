import type { ReactNode } from 'react';

import { cn } from '@/design/cn';
import { SectionLink } from '@/site/routing/SectionLink';

interface UnderlineLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/**
 * Text link with an animated (scaleX, `origin-left`) underline — the shared
 * pattern for section-level CTAs like "View all services" (Phase 5) or
 * "View more of our work," extracted so it isn't hand-duplicated per
 * section. The underline needs its own element (it animates independently
 * of the text), so — unlike `buttonClassName` — this is a small component,
 * not a bare class-name function; a single className string can't express
 * the two-node structure.
 *
 * The Navbar (Phase 2) still hand-rolls a near-identical pattern for its own
 * links, because it additionally needs `aria-current`-driven "permanently
 * underlined while active" behaviour that this simpler, hover/focus-only
 * version doesn't handle. Consolidating the two is a reasonable follow-up,
 * not done here to keep this change scoped to Services Preview.
 *
 * Colour uses `primary-inverse` (Phase 12), not `primary` — every current
 * call site sits on one of the new dark section surfaces, and Pine itself
 * (`text-primary`) only reaches ~1.8:1 contrast against them, far below
 * legible. `primary-inverse` is the same accent hue lightened specifically
 * for this — see tokens.ts. If a future light-surfaced section needs this
 * component again, it'll need a light/dark variant added at that time; none
 * exists today because none is currently needed.
 */
export function UnderlineLink({ href, children, className }: UnderlineLinkProps) {
  return (
    <SectionLink
      href={href}
      className={cn(
        'group relative inline-block text-sm font-medium text-primary-inverse',
        className,
      )}
    >
      {children}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 -bottom-px h-0.5 origin-left scale-x-0 bg-primary-inverse transition-transform duration-base group-hover:scale-x-100 group-focus-visible:scale-x-100"
      />
    </SectionLink>
  );
}
