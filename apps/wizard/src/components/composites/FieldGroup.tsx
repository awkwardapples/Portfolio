import type { ReactNode } from 'react';

import { ValidationMessage } from './ValidationMessage';

interface FieldGroupProps {
  /** The HTML id that should be used on the inner input (for htmlFor). */
  id: string;
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

/**
 * Label + help text + field slot + error message wrapper for single-input fields.
 *
 * ID contract: this component renders help at `${id}-help` and the error at
 * `${id}-error`. The child input must set aria-describedby referencing these IDs.
 * For group fields (radio, checkbox) use fieldset/legend directly in the renderer.
 */
export function FieldGroup({
  id,
  label,
  help,
  error,
  required = false,
  children,
}: FieldGroupProps): JSX.Element {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-text">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-danger">
            *
          </span>
        )}
      </label>
      {help && (
        <p id={`${id}-help`} className="text-sm text-text-muted">
          {help}
        </p>
      )}
      {children}
      {error && <ValidationMessage id={`${id}-error`} message={error} />}
    </div>
  );
}
