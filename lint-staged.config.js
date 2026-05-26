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

/** Files that should be skipped by ESLint (config files that are intentionally ignored) */
const eslintIgnoredFiles = ['tailwind.config.ts', 'vitest.config.ts', 'eslint.config.js'];

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
      return !eslintIgnoredFiles.includes(filename);
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
