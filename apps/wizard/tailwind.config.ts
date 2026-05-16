import type { Config } from 'tailwindcss';

/**
 * Tailwind configuration for the wizard.
 *
 * Design decisions captured here:
 *
 * 1. `content` scans only files inside src/. Tailwind 3 purges unused classes
 *    at build time based on this glob. Forgetting to include a new file type
 *    here is the #1 cause of "my Tailwind class isn't working" — keep this
 *    list audited.
 *
 * 2. The primary brand colour is defined via CSS variable, not as a literal
 *    hex. This is the seam that lets the WordPress plugin override the colour
 *    per-client without rebuilding the bundle. The variable is set by the
 *    plugin in a small inline style block (step 3E / Phase 5).
 *
 * 3. No plugins yet. We'll add @tailwindcss/forms in Phase 4 when we have
 *    real form inputs to style. Empty `plugins: []` is intentional.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],

  theme: {
    extend: {
      colors: {
        // CSS variable with a sensible fallback. The WordPress plugin emits
        // a <style> block setting --goqw-primary on :root. Tailwind utility:
        // `bg-primary`, `text-primary`, etc.
        primary: 'rgb(var(--goqw-primary, 15 76 129) / <alpha-value>)',
      },

      // Typography scale — modest, mobile-first.
      // We extend rather than replace so the standard scale is still available.
      fontSize: {
        // Defaults stay; nothing extended in step 3B.
      },

      // Spacing extensions can be added later as design needs emerge.
      // Avoiding speculative additions per the implementation discipline.
    },
  },

  plugins: [],
} satisfies Config;
