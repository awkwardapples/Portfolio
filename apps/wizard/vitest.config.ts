import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for the wizard's pure domain tests.
 *
 * The domain layer (src/domain/**) is framework-agnostic, so tests run in the
 * plain `node` environment — no jsdom, no DOM, no React. This is itself part of
 * the domain-purity proof: if a domain module accidentally depended on the DOM
 * or React, these node-environment tests would fail to run.
 *
 * The `@/` alias mirrors vite.config.ts and tsconfig.json so tests import the
 * same way the app does.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Domain tests must not pull in a browser environment. Fail fast if one
    // is somehow required.
    globals: false,
  },
});
