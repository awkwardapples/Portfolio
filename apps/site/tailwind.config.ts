import type { Config } from 'tailwindcss';

/**
 * Tailwind configuration for the portfolio site.
 *
 * Like the wizard's config (ADR-0003, ADR-0012), this replaces Tailwind's
 * default colour palette instead of extending it, so a class such as
 * `bg-neutral-800` or `bg-gradient-to-r` produces no CSS at all.
 *
 * Pass 1 carries only the palette from spec E.2. Pass 3 replaces this file
 * with the full token set (type scale, spacing rhythm, radii, motion) and
 * types it against the wizard's theme contract (spec U.4).
 */
export default {
  content: ['./src/**/*.{astro,html,md,mdx,ts,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      paper: '#F3F4F2',
      ink: '#000000',
      graphite: '#565B61',
      rule: '#CDD0CB',
      'line-strong': '#7C8187',
      stage: '#000000',
      fog: '#A3A8AE',
      tungsten: '#FFB000',
      'tungsten-deep': '#8A5A00',
    },
  },
  plugins: [],
} satisfies Config;
