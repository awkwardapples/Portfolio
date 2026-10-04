// @ts-check
/**
 * Astro configuration for Josh Lennon's portfolio (spec U.3, ADR-0039).
 *
 * Every page is pre-rendered (`output: 'static'`) and each page has exactly
 * one URL: no trailing slash, built as `page.html`, which the Worker's asset
 * handler serves at `/page` (`html_handling: "drop-trailing-slash"`).
 */
import { fileURLToPath } from 'node:url';

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

import { devRoutes } from './integrations/dev-routes.mjs';
import { placeholderGuard } from './integrations/placeholder-guard.mjs';

// The canonical origin (spec U.8). CI and local builds use the same value so
// canonical URLs never point at a preview host.
const SITE_URL = process.env.SITE_URL ?? 'https://joshlennon.com';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  integrations: [react(), mdx(), sitemap(), devRoutes(), placeholderGuard()],
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  vite: {
    resolve: {
      alias: {
        // The wizard engine's own files import each other through `@/`, so
        // `@` must keep meaning apps/wizard/src. The site's code uses `~`.
        '@': fileURLToPath(new URL('../wizard/src', import.meta.url)),
        '~': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  },
});
