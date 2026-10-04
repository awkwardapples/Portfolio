/**
 * Vite configuration for the quote wizard.
 *
 * This file is deliberately verbose. Every option below has a reason; nothing
 * is left to Vite's defaults where the default has consequences for how the
 * WordPress plugin consumes the build output.
 *
 * Build contract (depended on by `scripts/build-plugin.sh` and the WP plugin's
 * `AssetLoader`):
 *
 *   1. Output goes to `apps/wizard/dist/`.
 *   2. A `manifest.json` is emitted at the root of `dist/`.
 *   3. The main JS entry is a single file (no code-split chunks at the top level).
 *   4. The CSS is emitted as a single file alongside the JS.
 *   5. Filenames are content-hashed for cache busting; the manifest resolves
 *      the current filenames so the WP plugin doesn't hard-code them.
 *   6. `base: './'` — any asset referenced via a JS import (images, fonts)
 *      resolves relative to the running script's own URL, not the site's
 *      domain root, since the bundle is deployed inside a WordPress plugin
 *      subdirectory (see the `base` option below for the full rationale).
 *
 * Anything that changes the above is a build-pipeline-breaking change and must
 * be accompanied by an update to the build script and the plugin's AssetLoader.
 *
 * `--mode demo` (portfolio ADR-0044) builds something else entirely: the SCB
 * site as a static page for the portfolio's /demo/scb-handyman/, from
 * demo/index.html into apps/site/public/demo/scb-handyman/, with routes in
 * memory (.env.demo) and no source maps. The production build is unchanged.
 */
import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const alias = {
  // Mirror of the tsconfig.json `paths` entry.
  '@': fileURLToPath(new URL('./src', import.meta.url)),
};

/** The SCB demo for the portfolio (portfolio spec J.3, ADR-0044). */
const demo: UserConfig = {
  plugins: [react()],
  root: fileURLToPath(new URL('./demo', import.meta.url)),
  // .env.demo sits beside this file, not in demo/.
  envDir: fileURLToPath(new URL('.', import.meta.url)),
  base: '/demo/scb-handyman/',
  publicDir: false,
  resolve: { alias },
  build: {
    outDir: fileURLToPath(new URL('../site/public/demo/scb-handyman', import.meta.url)),
    emptyOutDir: true,
    target: 'es2020',
    // The portfolio's CI refuses source maps in the published site.
    sourcemap: false,
    assetsInlineLimit: 0,
  },
};

const production: UserConfig = {
  plugins: [react()],

  // Relative base (Phase 11 finding): the JS/CSS bundle is deployed at
  // wp-content/plugins/quote-wizard/assets/dist/, never at the site's domain
  // root. With the default base ('/'), Vite bakes root-relative URLs
  // (`/assets/foo.hash.ext`) into any asset referenced via a JS import —
  // e.g. ServiceHero's photographs and the self-hosted Inter font — which
  // 404 against the real WordPress site root instead of the plugin's actual
  // path. A relative base makes Vite resolve those same asset references
  // against the executing script's own URL at runtime (`import.meta.url`),
  // which is correct regardless of which subdirectory WordPress serves the
  // plugin from. This does NOT affect wizard.js/wizard.css themselves —
  // those are already resolved dynamically and correctly by PHP via
  // ManifestReader::asset_url() + GOQW_PLUGIN_URL, independent of Vite's
  // base setting.
  base: './',

  resolve: {
    alias: {
      // Mirror of the tsconfig.json `paths` entry.
      // Keep these two in sync — see ADR-NNNN if/when this becomes painful.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  // ---------------------------------------------------------------------------
  // Dev server (only used when running `pnpm dev`)
  // ---------------------------------------------------------------------------
  server: {
    port: 5173,
    strictPort: true, // fail loudly if 5173 is taken rather than silently shifting
    open: false, // don't auto-open the browser; engineer chooses
  },

  // ---------------------------------------------------------------------------
  // Production build
  // ---------------------------------------------------------------------------
  build: {
    // Output location. The build-plugin script copies from here into the
    // WordPress plugin's assets/dist/.
    outDir: 'dist',
    emptyOutDir: true,

    // Browser target. ES2020 is the floor: iOS Safari 13+, Chrome 80+, etc.
    // Lower targets bloat output; higher (esnext) risks older mobile devices.
    target: 'es2020',

    // Manifest file for the plugin to resolve hashed filenames.
    // Vite 5 writes this to dist/.vite/manifest.json by default; we hoist it
    // to dist/manifest.json for simpler plugin consumption.
    manifest: 'manifest.json',

    // Source maps in production builds aid debugging in browser devtools.
    // They're small and don't ship to users unless devtools is open.
    sourcemap: true,

    // CSS code-splitting OFF — we want one CSS file, not one per dynamic import.
    cssCodeSplit: false,

    // Disable inlining tiny assets into the JS. Predictable output > marginal
    // request savings.
    assetsInlineLimit: 0,

    rollupOptions: {
      input: 'src/main.tsx',
      output: {
        // Single entry chunk — no top-level code splitting. Dynamic imports
        // (e.g. `import('browser-image-compression')` later) will still produce
        // separate chunks; that's fine because we control when they load.
        entryFileNames: 'wizard.[hash].js',
        chunkFileNames: 'wizard-[name].[hash].js',
        assetFileNames: (info) => {
          // Force the main CSS to a predictable prefix; other assets keep
          // Vite's default naming.
          if (info.name && info.name.endsWith('.css')) {
            return 'wizard.[hash].css';
          }
          return 'assets/[name].[hash][extname]';
        },
      },
    },

    // Don't minify in dev-mode builds; do minify production builds.
    // (Default behaviour, declared explicitly so it's auditable.)
    minify: 'esbuild',
  },
};

export default defineConfig(({ mode }) => (mode === 'demo' ? demo : production));
