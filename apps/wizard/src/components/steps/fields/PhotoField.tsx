import { ValidationMessage } from '@/components/composites';

import type { FieldRendererProps } from '../types';

/** File upload field. Stores the selected filename as a string answer. */
export function PhotoField({ field, error, onChange, onBlur }: FieldRendererProps): JSX.Element {
  const id = field.key;
  const errorId = error ? `${id}-error` : undefined;
  const helpId = field.help ? `${id}-help` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <fieldset>
      <legend className="block text-sm font-medium text-text">
        {field.label}
        {field.required && (
          <span aria-hidden="true" className="ml-1 text-danger">
            *
          </span>
        )}
      </legend>
      {field.help && (
        <p id={helpId} className="mt-1 text-sm text-text-muted">
          {field.help}
        </p>
      )}
      <div className="mt-2">
        <input
          id={id}
          type="file"
          accept="image/*"
          aria-required={field.required || undefined}
          aria-describedby={describedBy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            onChange(file?.name ?? '');
          }}
          onBlur={onBlur}
          className="text-sm text-text file:mr-3 file:rounded file:border-0 file:bg-surface-sunken file:px-3 file:py-2 file:text-sm file:font-medium file:text-text"
        />
      </div>
      {error && <ValidationMessage id={errorId} message={error} />}
    </fieldset>
  );
}
