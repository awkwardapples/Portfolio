import { defineConfig } from 'vitest/config';

/**
 * Worker tests run in Node: the Worker's logic is written against the
 * standard Request/Response APIs, and bindings (ASSETS, DB) are passed in,
 * so tests supply small in-memory stand-ins instead of a workerd runtime.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    globals: false,
  },
});
