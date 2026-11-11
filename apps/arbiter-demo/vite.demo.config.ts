/// <reference types="vitest/config" />
/**
 * Builds Arbiter's console as the portfolio's demo (Pass 11, E.3; ADR-0050):
 * base /demo/arbiter/, entry demo.html (written out as index.html), into the
 * site's public/demo/arbiter/ with the snapshot from public/data. Unlike
 * upstream's vite.config.ts there is no dev-server proxy: the demo never
 * talks to an API. Also runs the demo adapter's own tests.
 */
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { existsSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

const outDir = fileURLToPath(new URL('../site/public/demo/arbiter', import.meta.url));

/** Serves demo.html as the folder's index.html (Vite writes the page after other plugins). */
function indexHtml(): Plugin {
  return {
    name: 'arbiter-demo-index',
    apply: 'build',
    closeBundle() {
      const page = join(outDir, 'demo.html');
      if (existsSync(page)) renameSync(page, join(outDir, 'index.html'));
    },
  };
}

export default defineConfig({
  base: '/demo/arbiter/',
  plugins: [react(), tailwindcss(), indexHtml()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: { input: fileURLToPath(new URL('./demo.html', import.meta.url)) },
    chunkSizeWarningLimit: 1500,
  },
  test: {
    environment: 'jsdom',
    include: ['src/demo/**/*.test.ts'],
    css: false,
  },
});
