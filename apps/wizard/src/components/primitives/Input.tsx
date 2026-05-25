import { type InputHTMLAttributes, forwardRef } from 'react';

import { cn } from '@/design/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Marks the field invalid for styling + aria-invalid. */
  invalid?: boolean;
}

/**
 * Input primitive.
 *
 * Flat surface, single border, accent focus ring (inherited from base layer).
 * The invalid state uses the muted danger token — no decorative treatment.
 * Label association is handled by the Field composite (4.3), not here, so this
 * primitive stays single-purpose.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'h-10 w-full rounded border bg-surface px-3 text-base text-text',
        'placeholder:text-text-subtle',
        'transition-colors',
        invalid ? 'border-danger' : 'border-border-strong',
        className,
      )}
      {...rest}
    />
  );
});
