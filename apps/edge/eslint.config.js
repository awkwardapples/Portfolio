// eslint.config.js — Worker ESLint flat config (ESLint v9).

import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', '.wrangler/**', 'node_modules/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
