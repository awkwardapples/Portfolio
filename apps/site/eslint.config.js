// eslint.config.js — portfolio site ESLint flat config (ESLint v9).
//
// TypeScript and React islands get the same ADR-0012 design constraints as
// the wizard (gradients, blur, spinners, raw hex, arbitrary values, marketing
// words, emoji), from the shared rule in apps/wizard/eslint-local. `.astro`
// files are not linted: that needs eslint-plugin-astro, which is outside the
// approved dependency list (spec U.6); scripts/check-design.mjs covers them.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

import { designConstraintRule } from '../wizard/eslint-local/design-constraints.js';
import local from '../wizard/eslint-local/index.js';

export default tseslint.config(
  {
    ignores: ['dist/**', '.astro/**', 'node_modules/**', 'public/**'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Configuration files at the package root run in Node.
  {
    files: ['*.{js,mjs,ts}', 'integrations/**/*.mjs'],
    languageOptions: {
      globals: { process: 'readonly', URL: 'readonly', console: 'readonly' },
    },
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      local,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-restricted-syntax': designConstraintRule,
      'local/no-emoji': 'error',
    },
  },

  // Tests assert on the banned literals themselves.
  {
    files: ['src/**/*.test.ts', 'src/**/__tests__/**/*.ts'],
    rules: {
      'no-restricted-syntax': 'off',
      'local/no-emoji': 'off',
    },
  },
);
