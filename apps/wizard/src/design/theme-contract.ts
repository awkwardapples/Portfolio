/**
 * The theme contract (spec U.4, ADR-0045).
 *
 * Every semantic token name the wizard's reusable components (src/components)
 * reach through Tailwind classes. An app that renders those components gives
 * each name a value in its own Tailwind theme, typed `satisfies
 * ThemeContract`, and the components re-theme without a single class name
 * changing. This package's own tailwind.config.ts implements it with SCB
 * Handyman's values; apps/site implements it with the portfolio's.
 *
 * The SCB site layer (src/site) is not covered: it is not reused elsewhere.
 */
export const THEME_CONTRACT = {
  colors: [
    'transparent',
    'current',
    'primary',
    'primary-inverse',
    'danger',
    'success',
    'surface',
    'surface-sunken',
    'surface-dark-elevated',
    'border',
    'border-strong',
    'border-inverse',
    'text',
    'text-muted',
    'text-subtle',
    'text-inverse',
    'text-inverse-muted',
  ],
  /** Steps of `colors.neutral` the components use directly (Skeleton, Tooltip). */
  neutral: ['100', '800'],
  spacing: ['0', '1', '2', '3', '4', '6', '8', '10', '11', '12', '16', '20', '24'],
  fontSize: ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'],
  fontWeight: ['normal', 'medium', 'semibold'],
  fontFamily: ['sans'],
  borderRadius: ['none', 'DEFAULT', 'full'],
  boxShadow: ['none', 'elevated', 'overlay'],
  transitionDuration: ['DEFAULT', 'fast', 'slow'],
  transitionTimingFunction: ['DEFAULT'],
  /** The Skeleton's opacity pulse (no spinners anywhere, ADR-0012). */
  animation: ['goqw-pulse'],
} as const;

type Name<K extends keyof typeof THEME_CONTRACT> = (typeof THEME_CONTRACT)[K][number];

/** Every contract name must be present; an app may define more. */
type Tokens<K extends string, V> = Record<K, V> & Record<string, V>;

type FontSizeValue = string | readonly [string, { readonly lineHeight: string }];

export interface ThemeContract {
  colors: Tokens<Name<'colors'>, string | Record<string, string>> & {
    neutral: Tokens<Name<'neutral'>, string>;
  };
  spacing: Tokens<Name<'spacing'>, string>;
  fontSize: Tokens<Name<'fontSize'>, FontSizeValue>;
  fontWeight: Tokens<Name<'fontWeight'>, string>;
  fontFamily: Tokens<Name<'fontFamily'>, readonly string[]>;
  borderRadius: Tokens<Name<'borderRadius'>, string>;
  boxShadow: Tokens<Name<'boxShadow'>, string>;
  transitionDuration: Tokens<Name<'transitionDuration'>, string>;
  transitionTimingFunction: Tokens<Name<'transitionTimingFunction'>, string>;
  animation: Tokens<Name<'animation'>, string>;
}
