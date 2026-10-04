/**
 * The last line of the placeholder guard (spec T.4): after a production build,
 * fail if a `TODO(josh)` placeholder reached any file in dist. The content
 * checks stop drafts' placeholders long before this; this catches anything
 * that slips past them, such as a placeholder in a template.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const MARK = 'TODO' + '(josh)';
const TEXT_FILES = new Set([
  '.html',
  '.xml',
  '.txt',
  '.json',
  '.js',
  '.mjs',
  '.css',
  '.svg',
  '.webmanifest',
]);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

export function placeholderGuard() {
  return {
    name: 'jl-placeholder-guard',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const hits = walk(root).filter(
          (file) => TEXT_FILES.has(extname(file)) && readFileSync(file, 'utf8').includes(MARK),
        );
        if (hits.length > 0) {
          throw new Error(
            `A ${MARK} placeholder reached the built site:\n${hits
              .map((file) => `  ${relative(root, file)}`)
              .join('\n')}\nFill it in, or mark the content draft: true.`,
          );
        }
        logger.info(`No ${MARK} placeholders in the built site.`);
      },
    },
  };
}
