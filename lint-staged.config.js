/**
 * lint-staged configuration.
 *
 * Why this is a JS file rather than a `lint-staged` key in package.json:
 * we need to control ESLint's working directory. ESLint v9's flat config
 * and the type-aware typescript-eslint rules both behave correctly only
 * when ESLint runs from the package's own directory — running it from the
 * repo root with `--config apps/<pkg>/eslint.config.js` resolves the config
 * but not the relative tsconfig project paths.
 *
 * The function form below converts absolute paths back to package-relative
 * paths and invokes ESLint via pnpm filter, which runs in the package's own
 * working directory.
 *
 * This file is plain JS (not TS) because lint-staged loads it via Node
 * without a transpilation step.
 */
import path from 'node:path';

/**
 * A wizard file is skipped here if `apps/wizard/eslint.config.js`'s own
 * `ignores` array would ignore it anyway (`*.config.ts` / `*.config.js`).
 * This used to be a hand-maintained exact-filename list that had to be kept
 * in sync with eslint.config.js's `ignores` by hand — and wasn't:
 * `vite.config.ts` was never added, so when it was staged, ESLint received
 * it as an explicit CLI argument, emitted "File ignored because of a
 * matching ignore pattern" as a WARNING (not an error), and
 * `--max-warnings=0` failed the entire commit over a file ESLint was
 * correctly never meant to lint. Matching the same glob pattern here means
 * any current or future `*.config.ts`/`*.config.js` file is excluded
 * automatically. The site and Worker configs lint their config files, so
 * nothing is skipped for them.
 */
function isWizardEslintIgnoredConfigFile(filename) {
  return /\.config\.(ts|js)$/.test(filename);
}

/** Packages whose TypeScript is linted from the package's own directory. */
const PACKAGES = [
  { dir: 'apps/wizard', filter: '@growth-ops/wizard', skip: isWizardEslintIgnoredConfigFile },
  { dir: 'apps/site', filter: '@jl/site', skip: () => false },
  { dir: 'apps/edge', filter: '@jl/edge', skip: () => false },
];

const quote = (file) => JSON.stringify(file);

/** ESLint --fix from the package's directory, then Prettier from the repo root. */
function lintTask({ dir, filter, skip }) {
  return (files) => {
    const packageRoot = path.join(process.cwd(), dir);
    const filesToLint = files.filter((file) => !skip(path.basename(file)));
    const tasks = [];
    if (filesToLint.length > 0) {
      const relative = filesToLint.map((file) => quote(path.relative(packageRoot, file)));
      tasks.push(
        `pnpm --filter ${filter} exec eslint --fix --max-warnings=0 ${relative.join(' ')}`,
      );
    }
    tasks.push(`prettier --write ${files.map(quote).join(' ')}`);
    return tasks;
  };
}

/** @type {import('lint-staged').Configuration} */
export default {
  ...Object.fromEntries(PACKAGES.map((pkg) => [`${pkg.dir}/**/*.{ts,tsx}`, lintTask(pkg)])),

  // Everything else: Prettier-only.
  '*.{js,jsx,mjs,cjs,json,md,yml,yaml,css}': 'prettier --write',
};
