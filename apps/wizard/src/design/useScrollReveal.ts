import { useEffect, useRef, useState } from 'react';

import { cn } from '@/design/cn';

interface UseScrollRevealResult<T extends HTMLElement> {
  /** Attach to the element that should reveal on scroll. */
  ref: React.RefObject<T>;
  /** True once the element has entered the viewport. Never reverts to false. */
  isVisible: boolean;
}

/**
 * Shared scroll-reveal utility (UI overhaul Phase 1 foundation).
 *
 * Fires once per element, the first time it enters the viewport, then
 * disconnects — per design-bible.md §7's "scroll-reveal fires once" rule.
 * Environments without IntersectionObserver (none expected in this
 * product's supported browsers, but checked defensively) reveal immediately
 * rather than staying hidden forever.
 *
 * This hook only tracks *whether* to reveal — it does not itself apply
 * reduced-motion logic. The actual transition is a plain CSS `transition`
 * utility (see `scrollRevealClassName`), and the global
 * `prefers-reduced-motion` media query in index.css already zeroes out all
 * transition durations, so the reveal becomes instant rather than animated
 * for those users — no extra branching needed here.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.15,
): UseScrollRevealResult<T> {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (node === null) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

/** The only valid stagger positions — see `scrollRevealClassName`'s `staggerIndex`. */
const MAX_STAGGER_INDEX = 6;
type StaggerIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const staggerDelayClassName: Record<StaggerIndex, string> = {
  0: 'delay-0',
  1: 'delay-1',
  2: 'delay-2',
  3: 'delay-3',
  4: 'delay-4',
  5: 'delay-5',
  6: 'delay-6',
};

/**
 * Class-name pair for a scroll-revealed element: hidden+offset at rest,
 * fading and lifting into place once `isVisible` is true. 8px translate
 * (design-bible.md §7's "8-12px, never more"), the shared slow duration,
 * the one easing curve (both via the bare `transition` utility, which
 * already covers opacity and transform).
 *
 * `staggerIndex` (1-6, added Phase 5) staggers a group of items revealed by
 * one shared `isVisible` boolean — e.g. a card grid, where calling
 * `useScrollReveal` once per card would violate the rules of hooks. Capped
 * at 6 (design-bible.md §7: "capped at roughly 6 items"); indices beyond 6
 * clamp to 6 rather than growing an unbounded delay. `prefers-reduced-motion`
 * needs no branch here — the global CSS override (index.css) zeroes
 * `transition-delay` as well as `transition-duration`, so a reduced-motion
 * user sees every staggered item appear together, instantly, not
 * sequentially.
 */
export function scrollRevealClassName(isVisible: boolean, staggerIndex?: number): string {
  const clampedIndex = (
    staggerIndex === undefined ? 0 : Math.max(0, Math.min(MAX_STAGGER_INDEX, staggerIndex))
  ) as StaggerIndex;

  return cn(
    'transition duration-slow',
    staggerDelayClassName[clampedIndex],
    isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
  );
}
