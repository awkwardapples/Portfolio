/**
 * Design tokens for the portfolio (spec E, ADR-0045): the single source of
 * truth. tailwind.config.ts reads them; the contrast test (contrast.test.ts)
 * and the style guide (/dev/styleguide) read them too.
 *
 * Paper is the reading surface, stage is pure black for identity and music,
 * and tungsten is the one accent: it lights things on stage, and on paper it
 * is a fill behind black text, never text itself (spec E.1, E.2).
 */

/** The palette (spec E.2). */
export const palette = {
  paper: '#F3F4F2',
  // Derived, not in E.2: the midpoint of paper and rule, for sunken areas and
  // skeletons on paper, where graphite text still reaches 4.5:1.
  'paper-sunken': '#E0E2DF',
  ink: '#000000',
  graphite: '#565B61',
  rule: '#CDD0CB',
  'line-strong': '#7C8187',
  stage: '#000000',
  fog: '#A3A8AE',
  tungsten: '#FFB000',
  'tungsten-deep': '#8A5A00',
  // State colours kept from the wizard, for paper surfaces only: on stage
  // they fall below 4.5:1, so forms and validation never sit on stage.
  danger: '#B42318',
  success: '#1F7A4D',
} as const;

export type PaletteName = keyof typeof palette;

/**
 * The wizard's semantic colour names (its theme contract, spec U.4), mapped
 * onto the palette so the reused components re-theme without class changes.
 * `primary` is ink, not tungsten: the components put `text-inverse` on
 * `primary`, and also on the dark tooltip, so `text-inverse` must stay light,
 * which tungsten (a light fill) cannot carry. Ink buttons with paper text
 * reach 19:1; tungsten keeps its role as the light on stage.
 */
export const wizardColors = {
  primary: palette.ink,
  'primary-inverse': palette.tungsten,
  danger: palette.danger,
  success: palette.success,
  surface: palette.paper,
  'surface-sunken': palette['paper-sunken'],
  'surface-dark-elevated': palette.graphite,
  border: palette.rule,
  'border-strong': palette['line-strong'],
  'border-inverse': palette.graphite,
  text: palette.ink,
  'text-muted': palette.graphite,
  'text-subtle': palette.graphite,
  'text-inverse': palette.paper,
  'text-inverse-muted': palette.fog,
  neutral: {
    100: palette['paper-sunken'],
    800: palette.ink,
  },
} as const;

/**
 * Pairs used for text and controls, with the minimum ratio each must reach
 * (spec R: text 4.5:1, control boundaries and focus indicators 3:1).
 */
export const contrastPairs: ReadonlyArray<{
  use: string;
  foreground: PaletteName;
  background: PaletteName;
  minimum: number;
}> = [
  { use: 'Body text on paper', foreground: 'ink', background: 'paper', minimum: 4.5 },
  { use: 'Secondary text on paper', foreground: 'graphite', background: 'paper', minimum: 4.5 },
  {
    use: 'Secondary text on sunken paper',
    foreground: 'graphite',
    background: 'paper-sunken',
    minimum: 4.5,
  },
  { use: 'Body text on sunken paper', foreground: 'ink', background: 'paper-sunken', minimum: 4.5 },
  {
    use: 'Accent text on paper (rare, small)',
    foreground: 'tungsten-deep',
    background: 'paper',
    minimum: 4.5,
  },
  { use: 'Text on stage', foreground: 'paper', background: 'stage', minimum: 4.5 },
  { use: 'Secondary text on stage', foreground: 'fog', background: 'stage', minimum: 4.5 },
  { use: 'Tungsten text on stage', foreground: 'tungsten', background: 'stage', minimum: 4.5 },
  {
    use: 'Black text on tungsten (highlight, stage buttons)',
    foreground: 'ink',
    background: 'tungsten',
    minimum: 4.5,
  },
  { use: 'Paper text on ink buttons', foreground: 'paper', background: 'ink', minimum: 4.5 },
  {
    use: 'Paper text on graphite (hover on stage)',
    foreground: 'paper',
    background: 'graphite',
    minimum: 4.5,
  },
  { use: 'Paper text on danger buttons', foreground: 'paper', background: 'danger', minimum: 4.5 },
  { use: 'Danger text on paper', foreground: 'danger', background: 'paper', minimum: 4.5 },
  { use: 'Success text on paper', foreground: 'success', background: 'paper', minimum: 4.5 },
  {
    use: 'Form control borders on paper',
    foreground: 'line-strong',
    background: 'paper',
    minimum: 3,
  },
  { use: 'Focus ring on paper (ink)', foreground: 'ink', background: 'paper', minimum: 3 },
  {
    use: 'Focus ring on stage (tungsten)',
    foreground: 'tungsten',
    background: 'stage',
    minimum: 3,
  },
];

/** Type families: STIX Two Text for reading and headings, IBM Plex Sans for interface (spec E.3). */
export const fontFamily = {
  serif: [
    'STIX Two Text Variable',
    'STIX Two Text Fallback',
    'Times New Roman',
    'Georgia',
    'serif',
  ],
  sans: ['IBM Plex Sans Variable', 'IBM Plex Sans Fallback', 'Arial', 'system-ui', 'sans-serif'],
} as const;

/**
 * Type scale (spec E.3): ratio 1.25 from a 17 px base (14, 17, 21, 27, 33,
 * 42, 52, 65), plus the long-form reading size and the threshold's display
 * size. The wizard's names (xs to 3xl) map onto the same steps.
 */
export const fontSize = {
  xs: ['0.875rem', { lineHeight: '1.5' }], // 14px: captions, metadata
  sm: ['1rem', { lineHeight: '1.5' }], // 16px: labels, help text
  base: ['1.0625rem', { lineHeight: '1.5' }], // 17px: interface text
  reading: ['1.1875rem', { lineHeight: '1.6' }], // 19px: long-form body
  lg: ['1.3125rem', { lineHeight: '1.45' }], // 21px
  xl: ['1.6875rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }], // 27px
  '2xl': ['2.0625rem', { lineHeight: '1.2', letterSpacing: '-0.015em' }], // 33px
  '3xl': ['2.625rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }], // 42px
  '4xl': ['3.25rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }], // 52px
  '5xl': ['4.0625rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }], // 65px
  // The threshold name: about 56 px on small phones to about 160 px on wide screens.
  display: [
    'clamp(3.5rem, 1.75rem + 8.75vw, 10rem)',
    { lineHeight: '0.95', letterSpacing: '-0.035em' },
  ],
} as const;

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
} as const;

/**
 * Spacing on a 4 px scale (spec E.4), with the section rhythm as named
 * tokens: 64 px between sections on phones, 80 on tablets, 128 on desktop,
 * and 48 between a section's heading and its content.
 */
export const spacing = {
  0: '0px',
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  11: '2.75rem', // 44px: minimum touch target
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  32: '8rem', // 128px
  'section-sm': '4rem', // 64px
  'section-md': '5rem', // 80px
  'section-lg': '8rem', // 128px
  'heading-gap': '3rem', // 48px
} as const;

/** Corner radius by role (spec E.4); pills are not used. */
export const borderRadius = {
  none: '0px',
  media: '0.25rem', // 4px: images, covers, video
  DEFAULT: '0.375rem', // 6px: inputs and buttons
  full: '9999px', // circular controls only
} as const;

/** Shadows only where one layer sits above another (spec E.2). */
export const boxShadow = {
  none: 'none',
  elevated: '0 1px 2px 0 rgb(0 0 0 / 0.08), 0 2px 8px -2px rgb(0 0 0 / 0.12)',
  overlay: '0 4px 6px -1px rgb(0 0 0 / 0.12), 0 12px 32px -4px rgb(0 0 0 / 0.2)',
} as const;

/** Motion (spec N): the wizard's durations and easing, plus the threshold's one transition. */
export const motion = {
  durationFast: '150ms',
  durationBase: '250ms',
  durationSlow: '400ms',
  durationHouseLights: '600ms',
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

/** Layout widths (spec E.4). */
export const maxWidth = {
  content: '75rem', // 1200px
  reading: '68ch',
} as const;

/** Media proportions (spec E.4), added to Tailwind's square and video: the portrait and A4 pages. */
export const aspectRatio = {
  portrait: '4 / 5',
  page: '1 / 1.4142',
} as const;
