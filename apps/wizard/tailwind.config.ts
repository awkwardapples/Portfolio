import type { Config } from 'tailwindcss';

import {
  neutral,
  state,
  accentCssExpression,
  surfaceDark,
  surfaceDarkRaised,
  surfaceDarkElevated,
  borderInverse,
  textInverseMuted,
  primaryInverseCssExpression,
  surfaceNavCssExpression,
  spacing,
  fontSize,
  fontWeight,
  fontFamily,
  borderRadius,
  boxShadow,
  motion,
} from './src/design/tokens';

/**
 * Tailwind configuration for the wizard.
 *
 * IMPORTANT: this REPLACES Tailwind's default theme rather than extending it.
 * That is the enforcement mechanism for ADR-0012's "closed palette" rule:
 * if a colour/spacing/size isn't defined here, the utility class does not
 * exist, so a developer cannot accidentally reach for bg-purple-500 or p-[13px].
 *
 * Deliberately ABSENT (so the utilities don't exist):
 *   - backgroundImage: gradients are impossible (no `bg-gradient-*`).
 *   - blur / backdropBlur: glassmorphism is impossible.
 *   - the full default colour palette: only neutral + accent + state exist.
 *   - the full default spacing scale: only our 4px scale exists.
 *
 * The accent is a runtime CSS variable (--goqw-primary) so the WordPress
 * plugin sets each client's brand colour without a rebuild (ADR-0009).
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],

  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      neutral,
      primary: accentCssExpression,
      danger: state.danger,
      'danger-surface': state.dangerSurface,
      success: state.success,
      'success-surface': state.successSurface,
      surface: neutral[0],
      'surface-sunken': neutral[50],
      border: neutral[200],
      'border-strong': neutral[300],
      text: neutral[900],
      'text-muted': neutral[500],
      'text-subtle': neutral[400],
      'text-inverse': neutral[0],
      'text-inverse-muted': textInverseMuted,
      'surface-dark': surfaceDark,
      'surface-dark-raised': surfaceDarkRaised,
      'surface-dark-elevated': surfaceDarkElevated,
      'border-inverse': borderInverse,
      'primary-inverse': primaryInverseCssExpression,
      'surface-nav': surfaceNavCssExpression,
    },

    spacing,
    fontFamily,
    fontSize,
    fontWeight,
    borderRadius,
    boxShadow,

    /**
     * The one animation language, sitewide (UI overhaul Phase 1 foundation).
     * `DEFAULT` duration/easing means the bare `transition` utility already
     * uses our base timing with no extra class needed; `duration-fast` /
     * `duration-slow` cover the other two tiers. There is no third easing
     * curve to reach for — `ease` is the only timing-function utility this
     * config generates.
     */
    transitionDuration: {
      DEFAULT: motion.durationBase,
      fast: motion.durationFast,
      slow: motion.durationSlow,
    },
    transitionTimingFunction: {
      DEFAULT: motion.easing,
    },
    /**
     * Closed stagger-delay scale (Phase 5 — Services Preview), for JS-driven
     * (IntersectionObserver `isVisible`-gated) staggered reveals — distinct
     * from Hero's animation-baked-in delays, since here a plain
     * `transition-delay` works because the class is toggled by state, not
     * self-triggered on mount. 60ms increments (design-bible.md §7's
     * "40-60ms, capped at 6 items"), never used past index 6. Replacing
     * Tailwind's default delay scale (not extending it) keeps this closed —
     * `delay-1000` and friends do not exist.
     */
    transitionDelay: {
      0: '0ms',
      1: '60ms',
      2: '120ms',
      3: '180ms',
      4: '240ms',
      5: '300ms',
      6: '360ms',
    },

    extend: {
      /**
       * FAQ accordion expand/collapse (Phase 9). The `grid-template-rows:
       * 0fr -> 1fr` technique is the documented, deliberate exception to
       * "never animate layout properties" (design-bible.md §9's original
       * FAQ direction anticipated exactly this) — it's the only way to
       * animate to a truly dynamic content height (answers vary in length)
       * without measuring pixels in JS or guessing a fixed max-height.
       * Scoped narrowly to the accordion only, not a general licence to
       * reach for `transition-all` elsewhere.
       */
      gridTemplateRows: {
        'accordion-collapsed': '0fr',
        'accordion-expanded': '1fr',
      },
      /**
       * ServiceHero (Phase 10). A named, narrow exception to "sections size
       * themselves via padding, not a fixed height" — the service-page hero
       * is deliberately NOT full-viewport (unlike the home page Hero):
       * approximately 600px on desktop keeps the CTA within the first
       * viewport and the image supporting, not overwhelming, the content.
       * Scoped to this one component only, not a general-purpose height key.
       */
      minHeight: {
        'service-hero': '37.5rem', // 600px
      },
      keyframes: {
        'goqw-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        /**
         * Hero entrance (Phase 3). `react/forbid-dom-props` bans the `style`
         * prop outright, so stagger delays can't be inline — they're baked
         * into each named `animation` entry below instead (the same
         * mechanism `goqw-pulse` already uses), never a per-element style
         * object.
         */
        'goqw-fade-up': {
          '0%': { opacity: '0', transform: 'translateY(0.5rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        /**
         * SVG stroke-drawing reveal (Hero's MeasuredDrawing visual anchor).
         * Paired with `pathLength={1}`/`strokeDasharray={1}` on each path,
         * so this is expressed in one normalised unit regardless of a
         * path's real geometry.
         */
        'goqw-draw': {
          '0%': { 'stroke-dashoffset': '1' },
          '100%': { 'stroke-dashoffset': '0' },
        },
      },
      animation: {
        'goqw-pulse': 'goqw-pulse 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        // Hero heading / subheading / CTA row — durations and easing from
        // the shared motion tokens; only the stagger delay is bespoke to
        // this one choreographed sequence (design-bible.md §7/§9, the
        // brief's specified Hero timings: heading 400ms, subheading 400ms
        // staggered, CTA 250ms).
        //
        // Phase 15: the heading's own duration is now a bespoke 600ms, not
        // `motion.durationSlow` (400ms) — a deliberate, narrow exception so
        // the homepage's one focal headline animates in noticeably slower
        // than the subheading/CTA (unchanged, still 400ms/250ms via the
        // shared tokens below). Scoped to this single named entry; the
        // sitewide closed 150/250/400ms scale itself is untouched.
        'goqw-hero-heading': `goqw-fade-up 600ms ${motion.easing} both`,
        'goqw-hero-subheading': `goqw-fade-up ${motion.durationSlow} ${motion.easing} 80ms both`,
        'goqw-hero-cta': `goqw-fade-up ${motion.durationBase} ${motion.easing} 160ms both`,
        'goqw-hero-visual': `goqw-fade-up ${motion.durationSlow} ${motion.easing} 80ms both`,
        // MeasuredDrawing's four construction stages, drawn in sequence
        // (frame -> ground -> structure -> dimension annotation).
        'goqw-hero-draw-1': `goqw-draw ${motion.durationSlow} ${motion.easing} both`,
        'goqw-hero-draw-2': `goqw-draw ${motion.durationSlow} ${motion.easing} 150ms both`,
        'goqw-hero-draw-3': `goqw-draw ${motion.durationSlow} ${motion.easing} 300ms both`,
        'goqw-hero-draw-4': `goqw-draw ${motion.durationSlow} ${motion.easing} 450ms both`,
      },
    },
  },

  plugins: [],
} satisfies Config;
