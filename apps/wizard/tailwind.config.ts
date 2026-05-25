import type { Config } from 'tailwindcss';

import {
  neutral,
  state,
  accentCssExpression,
  spacing,
  fontSize,
  fontWeight,
  fontFamily,
  borderRadius,
  boxShadow,
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
    },

    spacing,
    fontFamily,
    fontSize,
    fontWeight,
    borderRadius,
    boxShadow,

    extend: {
      keyframes: {
        'goqw-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        'goqw-pulse': 'goqw-pulse 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite',
      },
    },
  },

  plugins: [],
} satisfies Config;
