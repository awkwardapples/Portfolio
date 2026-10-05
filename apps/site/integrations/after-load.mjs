/**
 * Registers `client:afterload` (src/directives/after-load.ts, ADR-0048):
 * hydrate after the page's `load` event, when the browser is idle. It also
 * declares the attribute for TypeScript and `astro check`.
 */
import { fileURLToPath } from 'node:url';

export function afterLoad() {
  return {
    name: 'jl-after-load',
    hooks: {
      'astro:config:setup': ({ addClientDirective }) => {
        addClientDirective({
          name: 'afterload',
          // A path, not a file: URL, which the bundler cannot resolve on Windows.
          entrypoint: fileURLToPath(new URL('../src/directives/after-load.ts', import.meta.url)),
        });
      },
      'astro:config:done': ({ injectTypes }) => {
        injectTypes({
          filename: 'after-load.d.ts',
          content: `declare module 'astro' {
  interface AstroClientDirectives {
    'client:afterload'?: boolean;
  }
}
export {};
`,
        });
      },
    },
  };
}
