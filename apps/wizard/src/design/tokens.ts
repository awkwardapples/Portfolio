/**
 * Design tokens — the single source of truth for the wizard's visual system.
 *
 * Everything visual derives from this file: the Tailwind config reads these
 * values, and the rare component that needs a token in JS imports it here.
 * No component should contain a magic colour, spacing value, or font size.
 *
 * Constraints enforced by this token set (see ADR-0012):
 *   - One neutral scale + one accent. No second accent exists.
 *   - The accent is a runtime CSS variable (--goqw-primary) so each client's
 *     brand colour flows through without a rebuild (see ADR-0009).
 *   - No gradient, blur, or decorative tokens exist to reach for.
 *   - Shadows are functional-only (one elevation for layered surfaces).
 *   - Spacing is a single 4px-based scale.
 *   - Type scale is a fixed modular set; no arbitrary sizes.
 */

/**
 * Neutral scale. Cool grey, calm and operational. 0 = page surface, 900 = ink.
 * Contrast ratios against neutral-0 (background) are verified in the 4.0
 * verification step to meet WCAG AA for text usages.
 */
export const neutral = {
  0: '#ffffff',
  50: '#f7f8f9',
  100: '#eceef0',
  200: '#dde0e4',
  300: '#c3c8ce',
  400: '#868d96',
  500: '#6b7280',
  600: '#4b5159',
  700: '#363b42',
  800: '#23272c',
  900: '#14171a',
} as const;

/**
 * Semantic state colours. Flat, muted, used sparingly for validation and
 * result feedback only — never decoratively.
 */
export const state = {
  danger: '#b42318',
  dangerSurface: '#fdf3f2',
  success: '#1f7a4d',
  successSurface: '#f1f8f4',
} as const;

/**
 * The single accent. Resolved at runtime from the --goqw-primary CSS variable
 * (set per-client by the WordPress plugin). The fallback triplet is SCB
 * Handyman's brand accent — Pine (#1C4A3D = 28 74 61), approved during the
 * Design Bible sign-off (docs/design-bible.md §2, §15). A deep, desaturated
 * forest green: differentiated from the blue/orange that dominate the local
 * trades category, and a quiet nod to the business's landscape-gardening
 * heritage. Verified >10:1 contrast against neutral-0 (white) — comfortably
 * exceeds WCAG AAA (7:1), let alone the AA (4.5:1) minimum.
 *
 * The value is an rgb() expression with an <alpha-value> placeholder so
 * Tailwind can generate opacity variants (bg-primary/10, etc.).
 */
export const accentCssExpression = 'rgb(var(--goqw-primary, 28 74 61) / <alpha-value>)';

/**
 * Dark-surface system (Phase 12 — Dark Premium Theme Refinement). Extends
 * the SAME one neutral scale above — no second palette, no new hues. Gives
 * the homepage/service-page section sequence a distinct-but-harmonious dark
 * tonal rhythm instead of every section sitting on `surface`/`surface-sunken`.
 *
 * Three steps, each with a clear structural role:
 *   - `surfaceDark` (neutral.900): the primary dark section tone.
 *   - `surfaceDarkRaised` (neutral.800): the alternating tone — one step
 *     lighter, for the next section in sequence, never used adjacent to
 *     itself.
 *   - `surfaceDarkElevated` (neutral.700): reserved for a card/panel that
 *     needs to read as raised *within* a dark section (one step lighter
 *     again than either section tone, following the same "elevation lifts
 *     lightness" convention dark-mode systems generally use) — e.g. Services
 *     Preview's tiles sitting on `surfaceDarkRaised`.
 *   - `borderInverse` (neutral.600): the one hairline-border colour for use
 *     against any of the three dark surfaces above; deliberately lighter
 *     than all three so it stays visible against whichever one it borders.
 *
 * `text-inverse` (neutral.0, already existed for ServiceHero's scrim text)
 * is reused as-is for headings on these surfaces. `textInverseMuted`
 * (neutral.300) is new: `text-muted` (neutral.500) only reaches ~4.4:1
 * against neutral.900 — workable for large text but not a safe default —
 * so muted/secondary text on a dark surface uses this instead (verified
 * ~10.7:1 against neutral.900, ~8.9:1 against neutral.800).
 */
export const surfaceDark = neutral[900];
export const surfaceDarkRaised = neutral[800];
export const surfaceDarkElevated = neutral[700];
export const borderInverse = neutral[600];
export const textInverseMuted = neutral[300];

/**
 * Pine, lightened for use as TEXT/icon/border colour specifically on the
 * dark surfaces above — never as a fill. Pine itself (`accentCssExpression`)
 * stays the one accent *background* everywhere (Button's primary fill,
 * unaffected by this token); but Pine's own text-on-dark contrast is only
 * ~1.8:1 against neutral.900 — nowhere near legible. This is the same hue
 * and saturation (163°, 45%) lightened from L 20% to L 58%, verified
 * ~8.6:1 against neutral.900 and ~7.1:1 against neutral.800 — comfortably
 * past WCAG AA (4.5:1) in both cases.
 *
 * Static for now, not wired to the runtime `--goqw-primary` CSS variable
 * like the base accent is — deriving a contrast-safe tint automatically
 * from an arbitrary per-client brand colour is a real architecture question
 * or a future phase, not a small addition to make here. Known limitation:
 * if a future client changes `goqw_primary_color`, this token will not
 * follow it and must be re-derived by hand.
 */
export const primaryInverseCssExpression = '#64C4A9';

/**
 * Navbar surface (Phase 14). A dark, Pine-tinted tone for the persistent
 * header/mobile-menu chrome specifically — deliberately distinct from
 * `surfaceDark`/`surfaceDarkRaised` (a 70/30 blend of `neutral.800` and
 * Pine, `#213231`, vs. those two being plain, untinted neutral steps).
 * Two things the section backgrounds don't need to solve at once: reading
 * as "premium tinted surface" (brand identity, per the explicit "still
 * belongs to the Pine palette" direction) while staying subtle enough not
 * to compete with the section-tone hierarchy below it, which is why it
 * isn't simply `surfaceDarkRaised` with the logo recoloured. Verified
 * ~13.4:1 for `text-inverse` against it (nav links) — safely legible.
 *
 * Phase 14/15 accepted a known contrast limitation here: the then-current
 * logo asset's darkest strokes were a dark navy, reaching only ~1.2:1
 * against this surface. Phase 16 resolved it at the source — a white/
 * light-toned export of the same logo replaced the navy one specifically
 * to fix this, rather than lightening the surface further (which would
 * have contradicted "subtle... not visually dominant... do NOT return to
 * white"). This token itself is unchanged by that; noted here since the
 * limitation this token's own comment used to describe no longer applies.
 * Static, not runtime-configurable, for the same reason
 * `primaryInverseCssExpression` isn't — both are hand-derived from this
 * deployment's specific Pine value.
 */
export const surfaceNavCssExpression = '#213231';

/**
 * Spacing scale — 4px base. These are the ONLY spacing values the system
 * knows. Tailwind's default spacing is replaced (not extended) with this set,
 * so arbitrary values cannot be reached without an arbitrary-value class,
 * which is lint-banned.
 *
 * Keys are unitless multiples; values are rem strings (1rem = 16px).
 *
 * `11` (44px) and `20`/`24` (80px/96px) were added during the UI overhaul
 * (docs/ui-overhaul-plan.md, Design Bible §4/§12 sign-off items): `11` exists
 * solely so Button's `lg` size can hit the 44px WCAG touch-target minimum via
 * `h-11`, not as a general-purpose spacing step; `20`/`24` are the macro
 * section-level vertical rhythm steps (mobile/desktop), never used for
 * component-internal spacing.
 *
 * `10` (40px) was added during Phase 6 (Process): discovered that `Button`'s
 * `md` size and `Input`'s height have referenced `h-10`/`w-10` since before
 * this overhaul began, but `10` was never actually in this scale — those
 * classes have silently resolved to nothing (no height at all) the entire
 * time. This restores the value the key was always meant to hold (10 × 4px,
 * consistent with every other key in this scale), fixing both primitives
 * without changing a single line in either component file.
 */
export const spacing = {
  0: '0px',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px — Button md height, Input height (pre-existing, now fixed)
  11: '2.75rem', // 44px — WCAG touch-target minimum (Button lg only)
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px — section vertical padding, mobile/tablet
  24: '6rem', // 96px — section vertical padding, desktop
} as const;

/**
 * Type scale — fixed modular steps. No other sizes exist in the system.
 * Each entry pairs a font-size with a line-height that keeps body text
 * within the 1.5–1.6 rhythm required by ADR-0012.
 *
 * `3xl` (Phase 15): a genuine new step, not a one-off arbitrary value — the
 * homepage Hero headline needed to become the page's clear focal point
 * ("noticeably larger... first thing a visitor's eye is drawn to"), and
 * `2xl` (30px) was already the largest existing step, used generally for
 * "rare, top-level" headings. A dedicated, larger display step, reused
 * anywhere a future section needs the same "this is the one focal
 * headline" treatment — not scoped to Hero specifically. Tight line-height
 * (1.15) matches the tighter-tracking "typographic confidence" already
 * named as a deliberate reference point in design-bible.md §1 (Vercel).
 */
export const fontSize = {
  xs: ['0.75rem', { lineHeight: '1.5' }], // 12px
  sm: ['0.875rem', { lineHeight: '1.55' }], // 14px
  base: ['1rem', { lineHeight: '1.55' }], // 16px — body default
  lg: ['1.25rem', { lineHeight: '1.5' }], // 20px
  xl: ['1.5rem', { lineHeight: '1.4' }], // 24px — step headings
  '2xl': ['1.875rem', { lineHeight: '1.3' }], // 30px — rare, top-level
  '3xl': ['2.5rem', { lineHeight: '1.15' }], // 40px — the one focal headline size
} as const;

/**
 * Font weights. Three only — avoids decorative weight sprawl.
 */
export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
} as const;

/**
 * Font family. One self-hosted variable face (Inter), with a system fallback
 * stack used only while the woff2 loads (font-display: swap).
 */
export const fontFamily = {
  sans: [
    'Inter',
    'system-ui',
    '-apple-system',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
} as const;

/**
 * Border radii. A single small radius used consistently — no mixed corner
 * sizes ("inconsistent corner radii" is an explicitly banned pattern).
 */
export const borderRadius = {
  none: '0px',
  DEFAULT: '0.375rem', // 6px — the one radius
  full: '9999px', // pills / circular icon buttons only
} as const;

/**
 * Shadows — functional only. Exactly two elevations, both communicating
 * stacking order, never decoration (ADR-0012). No shadow appears on static
 * content (cards, buttons, inputs at rest) — see design-bible.md §5.
 */
export const boxShadow = {
  none: 'none',
  // Functional elevation: subtle, for a single floating layer (tooltip, dropdown).
  elevated: '0 1px 2px 0 rgb(20 23 26 / 0.06), 0 2px 8px -2px rgb(20 23 26 / 0.08)',
  // Functional elevation: a layer above a page-dimming scrim (mobile nav
  // drawer, modal). Added during the UI overhaul (Phase 1 foundation) for
  // the mobile navigation menu — design-bible.md §5's "only if a modal/
  // drawer is actually planned" condition is now met.
  overlay: '0 4px 6px -1px rgb(20 23 26 / 0.1), 0 10px 24px -4px rgb(20 23 26 / 0.12)',
} as const;

/**
 * Motion. Minimal and restrained — one animation language sitewide (opacity
 * and transform only; see design-bible.md §7/§11). Three durations, one
 * easing curve, no exceptions. Values amended during the UI overhaul
 * (docs/ui-overhaul-plan.md §3 Amendment 1): 150/250/400ms replaces the
 * original 120/180ms pair and adds a named slow tier for scroll-reveal.
 * All motion respects prefers-reduced-motion at the CSS layer (index.css).
 */
export const motion = {
  durationFast: '150ms', // hover, focus, button press feedback
  durationBase: '250ms', // accordion, nav state changes, card hover
  durationSlow: '400ms', // section entrance, scroll-reveal, hero load
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;
