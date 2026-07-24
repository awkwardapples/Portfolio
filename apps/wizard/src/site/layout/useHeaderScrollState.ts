import { useEffect, useState } from 'react';

interface HeaderScrollState {
  /** True once the page has scrolled past a small threshold. Drives the header's border. */
  isScrolled: boolean;
  /**
   * True while the current page's Hero section is still substantially in
   * view near the top of the viewport. False on pages with no Hero at all
   * (Services, Our Work, Contact, Privacy, Quote) — those always report
   * false, so nav CTAs on those pages default to the filled/primary state.
   */
  heroInView: boolean;
}

const SCROLL_THRESHOLD_PX = 8;

/**
 * Drives the Navbar's two scroll-aware behaviours (UI overhaul Phase 2):
 * the border-on-scroll treatment, and the Hero-vs-scrolled CTA variant.
 *
 * Hero detection works via `document.getElementById('hero')` rather than a
 * React prop/context — every Hero section already renders its `id` (the
 * SectionConfig id, always `'hero'` in every content file) onto its root
 * DOM node (Hero/Layout.tsx's `sectionId` prop), so this needs no change to
 * Hero's own files and no cross-component prop drilling. Re-runs on every
 * client-side navigation (`currentPath` dependency) since the DOM node
 * being observed changes or disappears entirely between routes.
 */
export function useHeaderScrollState(currentPath: string): HeaderScrollState {
  const [isScrolled, setIsScrolled] = useState(false);
  const [heroInView, setHeroInView] = useState(false);

  useEffect(() => {
    function handleScroll(): void {
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD_PX);
    }
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentPath]);

  useEffect(() => {
    const heroElement = document.getElementById('hero');
    if (heroElement === null || typeof IntersectionObserver === 'undefined') {
      setHeroInView(false);
      return;
    }

    // rootMargin shrinks the effective viewport top by roughly the sticky
    // header's own height, so the CTA flips to filled right as the Hero
    // passes under the header, not only once it's fully off-screen. Updated
    // (Phase 15) from -72px to -96px: the header's content row grew from
    // ~40px to 64px when the logo was enlarged (h-10 -> h-16), so its total
    // height (16px padding + content + 16px padding) is now ~96px.
    const observer = new IntersectionObserver(
      (entries) => setHeroInView(entries[0]?.isIntersecting ?? false),
      { rootMargin: '-96px 0px 0px 0px', threshold: 0 },
    );
    observer.observe(heroElement);
    return () => observer.disconnect();
  }, [currentPath]);

  return { isScrolled, heroInView };
}
