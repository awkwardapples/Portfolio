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

/** @type {import('lint-staged').Configuration} */
export default {
  // TS/TSX inside the wizard: ESLint --fix from the wizard's working
  // directory, then Prettier from the repo root.
  //
  // `pnpm --filter @growth-ops/wizard exec` runs the inner command with
  // the wizard package as the CWD, which is what ESLint and tsconfig
  // resolution both expect.
  'apps/wizard/**/*.{ts,tsx}': (files) => {
    const wizardRelative = files.map(relativeToWizard).join(' ');
    return [
      `pnpm --filter @growth-ops/wizard exec eslint --fix --max-warnings=0 ${wizardRelative}`,
      `prettier --write ${files.join(' ')}`,
    ];
  },

  // Everything else: Prettier-only.
  '*.{js,jsx,json,md,yml,yaml,css}': 'prettier --write',
};
