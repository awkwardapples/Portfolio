// @ts-check
/**
 * Astro configuration for Josh Lennon's portfolio (spec U.3, ADR-0039).
 *
 * Every page is pre-rendered (`output: 'static'`) and each page has exactly
 * one URL: no trailing slash, built as `page.html`, which the Worker's asset
 * handler serves at `/page` (`html_handling: "drop-trailing-slash"`).
 */
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

import { devRoutes } from './integrations/dev-routes.mjs';
import { placeholderGuard } from './integrations/placeholder-guard.mjs';
import { EARLY_SCRIPT } from './src/lib/early-script.ts';

// The canonical origin (spec U.8). CI and local builds use the same value so
// canonical URLs never point at a preview host.
const SITE_URL = process.env.SITE_URL ?? 'https://joshlennon.com';

/** @param {string} text @returns {`sha256-${string}`} */
const sha256 = (text) => `sha256-${createHash('sha256').update(text).digest('base64')}`;

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  integrations: [react(), mdx(), sitemap(), devRoutes(), placeholderGuard()],
  // Content Security Policy (spec Q.4, ADR-0048): Astro writes a <meta> policy
  // into each page with the hash of every script and style it rendered, so no
  // inline script runs unless the build put it there. The layout's is:inline
  // script is not hashed by Astro, so its hash is added here. frame-ancestors
  // cannot live in a meta policy; public/_headers sets it. Turnstile (on
  // /contact) and Cloudflare Web Analytics (once switched on, spec P.2) are
  // the only outside scripts; the facades' players are the only outside
  // frames, created when the visitor presses Play.
  security: {
    csp: {
      algorithm: 'SHA-256',
      scriptDirective: {
        resources: [
          "'self'",
          'https://challenges.cloudflare.com',
          'https://static.cloudflareinsights.com',
        ],
        hashes: [sha256(EARLY_SCRIPT)],
      },
      // Style elements are hashed; style attributes (sizes and positions set
      // by components) are allowed, since they cannot run code.
      styleDirective: {
        resources: ["'self'", { resource: "'unsafe-inline'", kind: 'attribute' }],
      },
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "media-src 'self'",
        "font-src 'self'",
        "connect-src 'self' https://cloudflareinsights.com",
        "frame-src 'self' https://challenges.cloudflare.com https://www.youtube-nocookie.com https://open.spotify.com",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ],
    },
  },
  // Thumbnails and avatars fetched at build time and served from this site
  // (spec K.2, M.1; ADR-0046): the browser never asks these hosts.
  image: {
    domains: ['i.ytimg.com', 'i.scdn.co', 'avatars.githubusercontent.com'],
    remotePatterns: [{ protocol: 'https', hostname: '**.spotifycdn.com' }],
  },
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
