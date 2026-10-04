/**
 * Button styles (spec E.4, E.5; ADR-0045), shared by Button.astro and the
 * React islands. Buttons say exactly what happens; this only decides how they
 * look on each surface.
 *
 *   primary on paper:  ink fill, paper text (19:1)
 *   primary on stage:  tungsten fill, black text (11.5:1): the light on stage
 *   secondary:         an outline in the surface's text colour
 *   quiet:             an underlined text action
 *
 * Every size keeps the 44 px minimum touch target (spec O).
 */
export type ButtonVariant = 'primary' | 'secondary' | 'quiet';
export type ButtonSurface = 'paper' | 'stage';
export type ButtonSize = 'regular' | 'compact';

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded font-sans font-medium transition-colors duration-fast';

const sizes: Record<ButtonSize, string> = {
  regular: 'px-5 text-base',
  compact: 'px-3 text-xs',
};

const variants: Record<ButtonSurface, Record<ButtonVariant, string>> = {
  paper: {
    primary: 'bg-ink text-paper hover:bg-graphite',
    secondary: 'border border-ink text-ink hover:bg-paper-sunken',
    quiet: 'px-0 text-ink underline decoration-1 underline-offset-4 hover:decoration-2',
  },
  stage: {
    primary: 'bg-tungsten text-ink hover:bg-paper',
    secondary: 'border border-fog text-paper hover:border-paper',
    quiet: 'px-0 text-paper underline decoration-1 underline-offset-4 hover:decoration-2',
  },
};

export function buttonClass({
  variant = 'primary',
  surface = 'paper',
  size = 'regular',
}: {
  variant?: ButtonVariant;
  surface?: ButtonSurface;
  size?: ButtonSize;
} = {}): string {
  return [base, variant === 'quiet' ? '' : sizes[size], variants[surface][variant]]
    .filter(Boolean)
    .join(' ');
}
