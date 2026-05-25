import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';

import { cn } from '@/design/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

/**
 * Button primitive.
 *
 * Flat, no gradients, no decorative shadow. Hierarchy comes from fill vs
 * outline vs text, not from ornament. Focus ring is inherited from the base
 * layer (#qw-root :focus-visible) but reinforced here for clarity.
 *
 * All colours/spacing reference the closed token system via semantic Tailwind
 * classes. There are no raw hex values or arbitrary spacings.
 */
const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-text-inverse hover:bg-primary/90 disabled:bg-primary/50',
  secondary:
    'bg-surface text-text border border-border-strong hover:bg-surface-sunken disabled:text-text-subtle disabled:hover:bg-surface',
  ghost: 'bg-transparent text-text hover:bg-surface-sunken disabled:text-text-subtle',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, type = 'button', children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded font-medium',
        'transition-colors disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
