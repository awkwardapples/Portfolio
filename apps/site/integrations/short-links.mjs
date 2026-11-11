import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Short links (Pass 11, D.1; ADR-0051), from one registry
 * (src/lib/short-links.ts, passed in by astro.config.mjs):
 *
 *   - `astro dev`: Astro's own `redirects`, so `pnpm dev` behaves the same.
 *     Only in development: in a static build Astro would write a
 *     meta-refresh page at each path, and the edge's 301 should answer.
 *   - `astro build`: dist/_redirects, which Cloudflare's static assets
 *     answer with a 301 before serving any file. The build fails if a
 *     target page or its fragment is missing, or a short path would shadow
 *     a real page.
 *
 * @template {{ path: string; to: string }} L
 * @param {{
 *   links: readonly L[];
 *   redirectsFile: (links: readonly L[]) => string;
 *   devRedirects: (links: readonly L[]) => Record<string, unknown>;
 *   shortLinkProblems: (
 *     links: readonly L[],
 *     site: { page: (path: string) => string | undefined; file: (path: string) => boolean },
 *   ) => string[];
 * }} registry
 */
export function shortLinks({ links, redirectsFile, devRedirects, shortLinkProblems }) {
  return {
    name: 'jl-short-links',
    hooks: {
      'astro:config:setup': ({ command, updateConfig }) => {
        if (command === 'dev') updateConfig({ redirects: devRedirects(links) });
      },
      'astro:build:done': ({ dir, logger }) => {
        const dist = fileURLToPath(dir);
        const at = (path) => `${dist}${path.replace(/^\//, '')}`;
        const isFile = (path) => existsSync(at(path)) && statSync(at(path)).isFile();
        const site = {
          page: (path) => {
            const file = path === '/' ? at('/index.html') : at(`${path}.html`);
            return existsSync(file) ? readFileSync(file, 'utf8') : undefined;
          },
          file: (path) => path !== '/' && isFile(path),
        };
        const problems = shortLinkProblems(links, site);
        if (problems.length > 0) {
          throw new Error(`Short links (src/lib/short-links.ts):\n  ${problems.join('\n  ')}`);
        }
        writeFileSync(at('/_redirects'), redirectsFile(links));
        logger.info(`${links.length} short links written to _redirects.`);
      },
    },
  };
}
