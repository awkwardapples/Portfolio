import type { ReactElement } from 'react';
import { Link } from '@/site/routing/Link';
import { Nav } from '@/site/layout/Nav';
import { siteContent } from '@/site/content/site-content';
import { cn } from '@/design/cn';
import { useHeaderScrollState } from '@/site/layout/useHeaderScrollState';
import logo from '@/assets/images/logo-scb-handyman-white.png';

interface HeaderProps {
  readonly currentPath: string;
}

/**
 * Site header (UI overhaul Phase 2; logo Phase 12; dark theme Phase 13;
 * navbar surface + logo chip removal Phase 14; logo size Phase 15; white
 * logo asset Phase 16). Sticky, so it stays reachable while scrolling; the
 * hairline border still only appears once scrolled, now
 * `border-border-inverse` to stay visible against the dark background.
 *
 * Logo asset (Phase 16): replaced the dark-navy-wordmark export with a
 * white/light-toned export of the same mark, supplied specifically to
 * resolve the contrast limitation Phases 14–15 had documented and accepted
 * (the navy version's darkest strokes only reached ~1.2:1 against
 * `surface-nav`). No chip, no blend mode, no filter — the asset itself is
 * the fix, per the explicit brief ("the supplied asset is intended to
 * solve the contrast issue"). Confirmed genuinely transparent (PNG colour
 * type 6/RGBA) before wiring it in, same check used for every previous
 * logo asset. Same near-identical aspect ratio as the prior asset (~1.91:1
 * vs. ~1.90:1), so the existing `h-16` sizing (Phase 15) carries over
 * unchanged rather than needing readjustment.
 *
 * `bg-surface-nav` (Phase 14): a Pine-tinted, deliberately lighter-but-
 * still-dark token (see tokens.ts) — "a premium tinted surface, not a
 * coloured bar." Not simply `surface-dark-raised`: that step is already
 * claimed by the section-tone hierarchy (Services Preview, Projects, FAQ).
 *
 * `id="site-header"` is a plain lookup hook for one CSS rule in
 * `styles/index.css` (the `body.admin-bar` sticky-offset fix) — not styled
 * by it, just addressed by it.
 */
export function Header({ currentPath }: HeaderProps): ReactElement {
  const { isScrolled, heroInView } = useHeaderScrollState(currentPath);

  return (
    <header
      id="site-header"
      className={cn(
        'sticky top-0 z-30 border-b bg-surface-nav transition-colors duration-base',
        isScrolled ? 'border-border-inverse' : 'border-transparent',
      )}
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 p-4">
        <Link to="/" className="inline-flex items-center">
          <img src={logo} alt={siteContent.businessName} className="h-16 w-auto" />
        </Link>
        <Nav currentPath={currentPath} heroInView={heroInView} />
      </div>
    </header>
  );
}
