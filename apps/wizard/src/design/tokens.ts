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
 * (set per-client by the WordPress plugin). The fallback triplet is the
 * project default navy (#0F4C81 = 15 76 129) used when no client value is set.
 *
 * The value is an rgb() expression with an <alpha-value> placeholder so
 * Tailwind can generate opacity variants (bg-primary/10, etc.).
 */
export const accentCssExpression = 'rgb(var(--goqw-primary, 15 76 129) / <alpha-value>)';

/**
 * Spacing scale — 4px base. These are the ONLY spacing values the system
 * knows. Tailwind's default spacing is replaced (not extended) with this set,
 * so arbitrary values cannot be reached without an arbitrary-value class,
 * which is lint-banned.
 *
 * Keys are unitless multiples; values are rem strings (1rem = 16px).
 */
export const spacing = {
  0: '0px',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  12: '3rem', // 48px
  16: '4rem', // 64px
} as const;

/**
 * Type scale — fixed modular steps. No other sizes exist in the system.
 * Each entry pairs a font-size with a line-height that keeps body text
 * within the 1.5–1.6 rhythm required by ADR-0012.
 */
export const fontSize = {
  xs: ['0.75rem', { lineHeight: '1.5' }], // 12px
  sm: ['0.875rem', { lineHeight: '1.55' }], // 14px
  base: ['1rem', { lineHeight: '1.55' }], // 16px — body default
  lg: ['1.25rem', { lineHeight: '1.5' }], // 20px
  xl: ['1.5rem', { lineHeight: '1.4' }], // 24px — step headings
  '2xl': ['1.875rem', { lineHeight: '1.3' }], // 30px — rare, top-level
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
 * Shadows — functional only. Exactly one elevation, for surfaces that sit
 * above the page (e.g. a tooltip or, later, a modal). No decorative shadows.
 */
export const boxShadow = {
  none: 'none',
  // Functional elevation: subtle, for layered surfaces only.
  elevated: '0 1px 2px 0 rgb(20 23 26 / 0.06), 0 2px 8px -2px rgb(20 23 26 / 0.08)',
} as const;

/**
 * Motion. Minimal and restrained. Used for the skeleton opacity pulse and
 * small state transitions only. All motion respects prefers-reduced-motion
 * at the CSS layer.
 */
export const motion = {
  durationFast: '120ms',
  durationBase: '180ms',
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;
