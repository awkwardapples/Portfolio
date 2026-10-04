// Tailwind 3 runs through PostCSS directly; no Astro Tailwind integration
// is needed (spec U.3, ADR-0003).
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
