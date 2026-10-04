import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

/**
 * Unit tests for the site's pure modules (URL helpers, content selection,
 * citations). Pages and islands are covered by Playwright from Pass 4.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../wizard/src', import.meta.url)),
      '~': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: false,
  },
});
