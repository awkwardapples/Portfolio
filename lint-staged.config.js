/**
 * lint-staged configuration.
 *
 * Why this is a JS file rather than a `lint-staged` key in package.json:
 * we need to control ESLint's working directory. ESLint v9's flat config
 * and the type-aware typescript-eslint rules both behave correctly only
 * when ESLint runs from `apps/wizard/` — running it from the repo root
 * with `--config apps/wizard/eslint.config.js` resolves the config but
 * not the relative tsconfig project paths.
 *
 * The function form below converts absolute paths back to wizard-relative
 * paths and invokes ESLint via pnpm filter, which runs in the wizard's
 * own working directory.
 *
 * This file is plain JS (not TS) because lint-staged loads it via Node
 * without a transpilation step.
 */
import path from 'node:path';

const wizardDir = 'apps/wizard';

/** Strip the repo-root prefix from an absolute path to get a wizard-relative path. */
function relativeToWizard(absPath) {
  const repoRoot = process.cwd();
  return path.relative(path.join(repoRoot, wizardDir), absPath);
}

/**
 * A file is skipped here if `apps/wizard/eslint.config.js`'s own `ignores`
 * array would ignore it anyway (`*.config.ts` / `*.config.js`, plus the one
 * exact non-`*.config.*` entry, `tailwind.config.ts` — already covered by
 * the `*.config.ts` glob, kept here too only for clarity). This used to be
 * a hand-maintained exact-filename list (`['tailwind.config.ts',
 * 'vitest.config.ts', 'eslint.config.js']`) that had to be kept in sync
 * with eslint.config.js's `ignores` by hand — and wasn't: `vite.config.ts`
 * was never added, so when it was staged, ESLint received it as an
 * explicit CLI argument, emitted "File ignored because of a matching
 * ignore pattern" as a WARNING (not an error), and `--max-warnings=0`
 * failed the entire commit over a file ESLint was correctly never meant to
 * lint. Matching the same glob pattern here instead of a filename list
 * means any current or future `*.config.ts`/`*.config.js` file is excluded
 * automatically — this can't drift out of sync with eslint.config.js again
 * the way the hand-written list did.
 */
function isEslintIgnoredConfigFile(filename) {
  return /\.config\.(ts|js)$/.test(filename);
}

/** @type {import('lint-staged').Configuration} */
export default {
  // TS/TSX inside the wizard: ESLint --fix from the wizard's working
  // directory, then Prettier from the repo root.
  //
  // We now filter out config files that are ignored by ESLint to prevent
  // "File ignored because of a matching ignore pattern" warnings.
  'apps/wizard/**/*.{ts,tsx}': (files) => {
    // Filter out files that ESLint should ignore
    const filesToLint = files.filter((file) => {
      const filename = path.basename(file);
      return !isEslintIgnoredConfigFile(filename);
    });

    if (filesToLint.length === 0) {
      return []; // Nothing to lint
    }

    const wizardRelative = filesToLint.map(relativeToWizard).join(' ');

    return [
      `pnpm --filter @growth-ops/wizard exec eslint --fix --max-warnings=0 ${wizardRelative}`,
      `prettier --write ${files.join(' ')}`,
    ];
  },

  // Everything else: Prettier-only.
  '*.{js,jsx,json,md,yml,yaml,css}': 'prettier --write',
};
