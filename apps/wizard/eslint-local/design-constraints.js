// eslint-local/design-constraints.js
//
// ADR-0012's design constraints as a `no-restricted-syntax` rule entry, shared
// by the wizard's and the portfolio site's ESLint configs so both enforce the
// same bans: a developer who reaches for a gradient, a raw hex colour, an
// arbitrary spacing value, a spinner, or marketing copy gets a lint error that
// fails `pnpm lint` and therefore fails CI.

// Tailwind gradient utilities + CSS gradient functions. Deliberately does NOT
// include bare `from-`/`via-`/`to-` fragments (Tailwind's gradient colour-stop
// modifiers) — found (Phase 14) to false-positive on ordinary prose content
// literals containing those substrings (e.g. "to-do list" in Hero copy),
// since this selector matches every string literal in `.ts`/`.tsx` files, not
// just JSX className attributes. Not a meaningful coverage gap: this config's
// `backgroundImage` theme key is never defined (see tailwind.config.ts), so
// `bg-gradient-*` utilities don't exist to generate CSS from at all — a bare
// `from-blue-500`/`to-emerald-400` with no accompanying `bg-gradient-{dir}`
// base utility is inert either way. `bg-gradient-` itself and the raw CSS
// function names below remain unambiguous, high-signal matches.
const GRADIENT_PATTERN = 'bg-gradient-|linear-gradient|radial-gradient|conic-gradient';

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

/** The full `no-restricted-syntax` rule entry: `'no-restricted-syntax': designConstraintRule`. */
export const designConstraintRule = [
  'error',
  {
    selector: `Literal[value=/${GRADIENT_PATTERN}/]`,
    message: 'Gradients are banned (ADR-0012). Use a flat colour token from the closed palette.',
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
];
