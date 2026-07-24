import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';

import { cn } from '@/design/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

/**
 * Button primitive — the one button system for the whole product (wizard and
 * marketing pages alike). Flat, no gradients, no decorative shadow. Hierarchy
 * comes from fill vs outline vs text, not from ornament. Focus ring is
 * inherited from the base layer (#qw-root :focus-visible) but reinforced
 * here for clarity.
 *
 * All colours/spacing reference the closed token system via semantic Tailwind
 * classes. There are no raw hex values or arbitrary spacings.
 *
 * `lg` (44px, added in the UI overhaul's Phase 1 foundation) is the WCAG
 * touch-target-compliant size and should be used for every marketing-page
 * CTA; `sm`/`md` are unchanged and remain in use inside the quote wizard.
 * `destructive` is a completeness addition (no current call site) — added so
 * the system doesn't have a missing tier if one is ever needed, using the
 * existing `danger` state token rather than a new colour.
 */
const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-text-inverse hover:bg-primary/90 disabled:bg-primary/50',
  secondary:
    'bg-surface text-text border border-border-strong hover:bg-surface-sunken disabled:text-text-subtle disabled:hover:bg-surface',
  ghost: 'bg-transparent text-text hover:bg-surface-sunken disabled:text-text-subtle',
  destructive: 'bg-danger text-text-inverse hover:bg-danger/90 disabled:bg-danger/50',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-11 px-6 text-base',
};

/**
 * The Button's visual recipe, exported so a non-<button> element that must
 * remain semantically something else (an anchor/`Link` for navigation, most
 * commonly) can look identical without duplicating the class list. Added for
 * the Navbar's quote CTA (Phase 2) — a link, not a button, but visually part
 * of the same system.
 */
export function buttonClassName(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded font-medium',
    'transition-colors duration-fast active:scale-95 disabled:cursor-not-allowed disabled:active:scale-100',
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, type = 'button', children, ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClassName(variant, size, className)} {...rest}>
      {children}
    </button>
  );
});
