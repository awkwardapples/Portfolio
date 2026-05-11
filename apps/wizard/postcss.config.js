/**
 * PostCSS pipeline.
 *
 * Two plugins, no surprises:
 *   - tailwindcss: processes Tailwind directives in src/styles/index.css.
 *   - autoprefixer: adds vendor prefixes based on our browserslist
 *     (defaulted to "> 0.5%, last 2 versions, not dead" which aligns with
 *     our ES2020 target).
 *
 * Using .js (not .ts) here because PostCSS's loader expects CommonJS or
 * ESM JS in this file specifically. Not worth fighting.
 */
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
