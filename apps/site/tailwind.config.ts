import type { Config } from 'tailwindcss';

import type { ThemeContract } from '../wizard/src/design/theme-contract';

import {
  borderRadius,
  boxShadow,
  fontFamily,
  fontSize,
  fontWeight,
  maxWidth,
  motion,
  palette,
  spacing,
  wizardColors,
} from './src/design/tokens';

/**
 * Tailwind configuration for the portfolio (spec E, U.3, U.4; ADR-0045).
 *
 * Like the wizard's config (ADR-0003, ADR-0012), this replaces Tailwind's
 * default theme instead of extending it: only the tokens in
 * src/design/tokens.ts exist, so `bg-neutral-800`, `bg-gradient-to-r`,
 * `backdrop-blur` or `animate-spin` produce no CSS at all.
 *
 * It implements the wizard's theme contract, so the reused wizard components
 * (whose classes are scanned below) render in the portfolio's identity
 * without a class name changing. theme-contract.test.ts proves every class
 * those components use still produces CSS here.
 */
const theme = {
  colors: {
    transparent: 'transparent',
    current: 'currentColor',
    ...palette,
    ...wizardColors,
  },
  // Tailwind's breakpoints with one more step: 360 px, where the compact
  // "Start a conversation" button fits beside the name (spec O).
  screens: {
    xs: '360px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  spacing,
  fontFamily,
  fontSize,
  fontWeight,
  borderRadius,
  boxShadow,
  transitionDuration: {
    DEFAULT: motion.durationBase,
    fast: motion.durationFast,
    slow: motion.durationSlow,
    'house-lights': motion.durationHouseLights,
  },
  transitionTimingFunction: {
    DEFAULT: motion.easing,
  },
  // Replaces Tailwind's animations: the Skeleton's opacity pulse is the only one.
  keyframes: {
    'goqw-pulse': {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.55' },
    },
  },
  animation: {
    'goqw-pulse': `goqw-pulse 1.6s ${motion.easing} infinite`,
  },
  extend: {
    maxWidth,
  },
} satisfies ThemeContract & Record<string, unknown>;

export default {
  content: {
    relative: true,
    files: [
      './src/**/*.{astro,html,md,mdx,ts,tsx}',
      // The wizard's reusable components; never its SCB site layer (src/site).
      '../wizard/src/components/**/*.{ts,tsx}',
    ],
  },
  theme: theme as unknown as Config['theme'],
  plugins: [],
} satisfies Config;
