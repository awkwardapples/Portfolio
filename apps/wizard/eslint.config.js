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

import local from './eslint-local/index.js';

// ---------------------------------------------------------------------------
// Banned patterns (regex sources) for ADR-0012 constraints.
// ---------------------------------------------------------------------------

// Tailwind gradient utilities + CSS gradient functions.
const GRADIENT_PATTERN =
  'bg-gradient-|from-|via-|to-|linear-gradient|radial-gradient|conic-gradient';

// Glassmorphism / decorative blur.
const BLUR_PATTERN = 'backdrop-blur|\\bblur-';

// Spinner-suggesting class or identifier names. Matches Tailwind's spin
// animation and standalone "spinner" — deliberately NOT a bare "loader"
// substring, which would false-match legitimate names like "config-loader".
const SPINNER_PATTERN = '\\bspinner\\b|animate-spin|loading-spinner';

// Raw hex colours in JSX/literals (#abc / #aabbcc / #aabbccdd).
const HEX_PATTERN = '#[0-9a-fA-F]{3,8}\\b';

// Tailwind arbitrary-value classes, e.g. p-[13px], top-[7px], text-[19px].
const ARBITRARY_VALUE_PATTERN = '\\b[a-z-]+-\\[[^\\]]+\\]';

// Marketing / startup language banned from UI copy.
const MARKETING_WORDS = [
  'empower',
  'unleash',
  'seamless',
  'cutting-edge',
  'next-gen',
  'next generation',
  'revolutionary',
  'game-changer',
  'game changer',
  'supercharge',
  'effortless',
  'world-class',
  'best-in-class',
  'leverage',
  'synergy',
  'disrupt',
];
const MARKETING_PATTERN = `\\b(${MARKETING_WORDS.join('|')})\\b`;

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
      'no-restricted-syntax': [
        'error',
        {
          selector: `Literal[value=/${GRADIENT_PATTERN}/]`,
          message:
            'Gradients are banned (ADR-0012). Use a flat colour token from the closed palette.',
        },
        {
          selector: `TemplateElement[value.raw=/${GRADIENT_PATTERN}/]`,
          message: 'Gradients are banned (ADR-0012).',
        },
        {
          selector: `Literal[value=/${BLUR_PATTERN}/]`,
          message: 'Blur / glassmorphism is banned (ADR-0012). No backdrop-blur or blur utilities.',
        },
        {
          selector: `TemplateElement[value.raw=/${BLUR_PATTERN}/]`,
          message: 'Blur / glassmorphism is banned (ADR-0012).',
        },
        {
          selector: `Literal[value=/${SPINNER_PATTERN}/]`,
          message: 'Spinners are banned (ADR-0012). Use the Skeleton primitive for loading states.',
        },
        {
          selector: `TemplateElement[value.raw=/${SPINNER_PATTERN}/]`,
          message: 'Spinners are banned (ADR-0012). Use the Skeleton primitive.',
        },
        {
          selector: `Literal[value=/${HEX_PATTERN}/]`,
          message:
            'Raw hex colours are banned in source (ADR-0012). Use a semantic token class (text-text, bg-surface, bg-primary, ...). Palette hex values live only in src/design/tokens.ts.',
        },
        {
          selector: `TemplateElement[value.raw=/${HEX_PATTERN}/]`,
          message: 'Raw hex colours are banned in source (ADR-0012). Use a token.',
        },
        {
          selector: `Literal[value=/${ARBITRARY_VALUE_PATTERN}/]`,
          message:
            'Tailwind arbitrary-value classes are banned (ADR-0012). Use the closed spacing/size scale.',
        },
        {
          selector: `TemplateElement[value.raw=/${ARBITRARY_VALUE_PATTERN}/]`,
          message: 'Tailwind arbitrary-value classes are banned (ADR-0012). Use the scale.',
        },
        {
          selector: `Literal[value=/${MARKETING_PATTERN}/i]`,
          message:
            'Marketing language is banned (ADR-0012). Write plainly, like a person explaining a tool.',
        },
        {
          selector: `JSXText[value=/${MARKETING_PATTERN}/i]`,
          message: 'Marketing language is banned (ADR-0012). Write plainly.',
        },
      ],

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
);
