/**
 * ESLint flat config for the wizard.
 *
 * Philosophy: enable rules that catch real bugs (async correctness,
 * React rules of hooks, type misuse, accessibility). Skip rules that
 * produce churn for marginal signal (naming conventions, complexity
 * limits, import ordering, stylistic preferences already handled by
 * Prettier).
 *
 * See docs/decisions/0006-eslint-flat-config.md for the full rationale
 * behind every non-default rule below.
 */

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default tseslint.config(
  // ---------------------------------------------------------------------------
  // Files to ignore entirely.
  //
  // Config files (vite.config.ts, tailwind.config.ts, postcss.config.js,
  // eslint.config.js itself) are deliberately excluded. They aren't part
  // of the runtime bundle and aren't safety-critical; running type-aware
  // lint rules on them would require pulling them into tsconfig.json,
  // which we don't want for unrelated reasons (separate Node-targeted
  // config). TypeScript still type-checks the wizard source via `tsc
  // --noEmit`; broken config files surface immediately via build failure.
  // ---------------------------------------------------------------------------
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '*.config.js',
      '*.config.ts',
      'eslint.config.js',
    ],
  },

  // ---------------------------------------------------------------------------
  // Base JS rules (recommended) — applies to all JS/TS files
  // ---------------------------------------------------------------------------
  js.configs.recommended,

  // ---------------------------------------------------------------------------
  // TypeScript rules — including type-checked rules that require type info.
  // Type-checked rules are slower but catch the highest-value bugs in this
  // codebase (no-floating-promises, no-misused-promises).
  // ---------------------------------------------------------------------------
  ...tseslint.configs.recommendedTypeChecked,

  // ---------------------------------------------------------------------------
  // Project-wide config for TS/TSX files
  // ---------------------------------------------------------------------------
  {
    files: ['src/**/*.{ts,tsx}'],

    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        // Required for type-aware rules. Points ESLint at our tsconfig
        // so it can resolve types.
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },

    settings: {
      react: { version: 'detect' },
    },

    rules: {
      // -----------------------------------------------------------------------
      // React: hooks
      // -----------------------------------------------------------------------
      // Hooks rules are correctness, not style. Calling hooks conditionally
      // produces real runtime bugs.
      'react-hooks/rules-of-hooks': 'error',
      // Missing useEffect deps are the #1 source of React bugs. Warn (not
      // error) because there are legitimate cases handled by inline disable
      // with explanation.
      'react-hooks/exhaustive-deps': 'warn',

      // -----------------------------------------------------------------------
      // React: JSX correctness
      // -----------------------------------------------------------------------
      'react/jsx-key': 'error',
      'react/jsx-no-target-blank': 'error',

      // Disabled — modern JSX transform doesn't need React in scope.
      'react/react-in-jsx-scope': 'off',
      // Disabled — we use TypeScript for prop types.
      'react/prop-types': 'off',
      // Disabled — false-positive-prone and adds noise for apostrophes etc.
      'react/no-unescaped-entities': 'off',

      // -----------------------------------------------------------------------
      // Accessibility
      // -----------------------------------------------------------------------
      ...jsxA11yPlugin.configs.recommended.rules,
      // Relaxed: the autodetector sometimes misfires on form library wrappers.
      'jsx-a11y/label-has-associated-control': 'warn',

      // -----------------------------------------------------------------------
      // TypeScript — adjustments from the type-checked preset
      // -----------------------------------------------------------------------
      // Sometimes `any` is genuinely the right answer (interop with untyped
      // libs, narrow escape hatches). Warn forces a justification without
      // blocking work.
      '@typescript-eslint/no-explicit-any': 'warn',

      // Allow underscore-prefixed unused vars (intentional for ignored args).
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Disabled — `!` is sometimes the cleanest expression of "I just
      // checked this is non-null". Use sparingly; don't gate at the linter.
      '@typescript-eslint/no-non-null-assertion': 'off',

      // Disabled — empty functions are often intentional (default handlers,
      // test stubs, no-op defaults).
      '@typescript-eslint/no-empty-function': 'off',

      // -----------------------------------------------------------------------
      // General correctness
      // -----------------------------------------------------------------------
      // console.log should not ship. console.warn / console.error are
      // legitimate for genuine warnings and errors (we use console.warn in
      // main.tsx with an explicit inline disable).
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // === enforces type-aware equality. Universal best practice.
      eqeqeq: ['error', 'always'],

      // Debugger statements should never ship.
      'no-debugger': 'error',

      // If a variable is not reassigned, declare it `const`. Catches a real
      // class of subtle bug.
      'prefer-const': 'error',
    },
  },
);
