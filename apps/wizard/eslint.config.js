// eslint.config.js — Wizard ESLint flat config (ESLint v9).
//
// Beyond the standard TS/React rules, this config encodes ADR-0012's design
// constraints as FAILING lint rules. The intent (enforcement-by-construction):
// a developer who reaches for a gradient, a raw hex colour, an arbitrary
// spacing value, a spinner, marketing copy, or an emoji gets a lint error that
// fails `pnpm lint` and therefore fails CI. Constraints are mechanical, not
// dependent on review vigilance.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

import { designConstraintRule } from './eslint-local/design-constraints.js';
import local from './eslint-local/index.js';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'eslint-local/**',
      '*.config.ts',
      '*.config.js',
      'tailwind.config.ts',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
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

      // -------------------------------------------------------------------
      // ADR-0012 ENFORCEMENT — banned literals in source.
      // -------------------------------------------------------------------
      'no-restricted-syntax': designConstraintRule,

      // Emoji detection via the local plugin (reliable real-RegExp matching;
      // esquery selector regex does not honour the /u flag dependably).
      'local/no-emoji': 'error',

      // Inline styles are a common vector for gradients/blur. Discourage them;
      // styling goes through token-derived utility classes.
      'react/forbid-dom-props': ['error', { forbid: ['style'] }],
    },
  },

  // Boundary: primitives may not import upward (composites/steps/screens/state).
  {
    files: ['src/components/primitives/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/components/composites/*',
                '@/components/steps/*',
                '@/components/screens/*',
                '@/state/*',
              ],
              message:
                'Primitives may depend only on design tokens — never composites, steps, screens, or state (component-boundary rule).',
            },
          ],
        },
      ],
    },
  },

  // Boundary: composites may not import upward (steps/screens/shell).
  {
    files: ['src/components/composites/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/components/steps/*',
                '@/components/steps/**',
                '@/components/screens/*',
                '@/components/screens/**',
              ],
              message:
                'Composites may only import primitives — never steps, screens, or shell (component-boundary rule).',
            },
          ],
        },
      ],
    },
  },

  // Domain-layer purity (ADR-0012 / 4.1): src/domain/** is the pure,
  // framework-agnostic core. It must never import React or any UI component,
  // so it stays independently testable and could back a non-React consumer.
  // This is the structural enforcement of "schema layer avoids UI coupling".
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              message:
                'The domain layer must stay React-free (4.1). Keep schemas/validation/pricing pure.',
            },
            {
              name: 'react-dom',
              message: 'The domain layer must stay framework-free (4.1).',
            },
          ],
          patterns: [
            {
              group: ['@/components/*', '@/components/**', '@/design/*', '@/design/**'],
              message:
                'The domain layer must not import UI components or design tokens (4.1). Domain describes data, not presentation.',
            },
            {
              group: ['@/runtime', '@/runtime/*', '@/runtime/**'],
              message:
                'The domain layer must not import from the React adapter (runtime boundary). Domain is framework-agnostic.',
            },
          ],
        },
      ],
    },
  },

  // Test files legitimately contain otherwise-banned literals: the banned-word
  // list under test, hex colours in PublicConfig fixtures, etc. They assert ON
  // these constraints, so the content rules (no-restricted-syntax / emoji) are
  // relaxed here. All OTHER rules still apply. This mirrors the tokens.ts and
  // config-loader.ts exceptions.
  {
    files: ['src/**/*.test.ts', 'src/**/__tests__/**/*.ts'],
    rules: {
      'no-restricted-syntax': 'off',
      'local/no-emoji': 'off',
    },
  },

  // tokens.ts is the ONE place raw hex is allowed — it defines the palette.
  // config-loader.ts holds a single fallback default colour that must mirror
  // the PHP PublicConfig default (#0F4C81); it is a contract value, not a
  // styling decision, so the hex rule is relaxed there too.
  {
    files: ['src/design/tokens.ts', 'src/config-loader.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },

  // Site layer (5.0, ADR-0016). May import wizard components, the runtime
  // adapter, the registry, and the config-loader — but NOT the pure domain
  // internals (state machine, pricing engine) directly.
  {
    files: ['src/site/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/domain/runtime/*', '@/domain/runtime/**'],
              message:
                'Site layer must not import the pure runtime directly. Use the registry-resolved ServiceConfig and existing WizardProvider/WizardShell.',
            },
            {
              group: ['@/domain/pricing/*', '@/domain/pricing/**'],
              message:
                "Site layer must not import the pricing engine directly. Pricing is the wizard's internal concern.",
            },
          ],
        },
      ],
    },
  },
);
