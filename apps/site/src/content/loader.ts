import { existsSync, readFileSync } from 'node:fs';

import { glob, type Loader, type LoaderContext } from 'astro/loaders';

import { formatProblems, type DocumentStore, type EntryLike, type Problem } from './checks';

type GlobOptions = Parameters<typeof glob>[0];
type Check = (entries: EntryLike[], context: LoaderContext) => Problem[];

/**
 * Astro's glob loader, followed by the content checks in checks.ts. A
 * production build stops with every problem listed by file and field; in
 * `astro dev` the problems are printed as warnings, and re-checked whenever a
 * content file changes, so a half-written entry never takes the site down.
 */
export function checkedGlob(options: GlobOptions, check: Check): Loader {
  const inner = glob(options);
  return {
    name: 'checked-glob',
    load: async (context) => {
      await inner.load(context);
      const run = () => {
        const problems = check(context.store.values() as EntryLike[], context);
        if (problems.length === 0) return;
        const message = formatProblems(context.collection, problems);
        if (import.meta.env.DEV) context.logger.warn(message);
        else throw new Error(message);
      };
      run();
      if (import.meta.env.DEV && context.watcher) {
        let timer: ReturnType<typeof setTimeout> | undefined;
        context.watcher.on('all', () => {
          clearTimeout(timer);
          timer = setTimeout(run, 200);
        });
      }
    },
  };
}

/** The documents on disk and the metadata `pnpm media:pdf` recorded for them. */
export function documentStore(root: URL): DocumentStore {
  const manifestUrl = new URL('src/data/documents.json', root);
  const manifest: Record<string, unknown> = existsSync(manifestUrl)
    ? (JSON.parse(readFileSync(manifestUrl, 'utf8')) as Record<string, unknown>)
    : {};
  return {
    exists: (file) => existsSync(new URL(`public/documents/${file}`, root)),
    recorded: (file) => file in manifest,
  };
}
