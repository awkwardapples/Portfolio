import { ValidationMessage } from '@/components/composites';

import type { FieldRendererProps } from '../types';

export function CheckboxGroupField({
  field,
  value,
  error,
  onChange,
  onBlur,
}: FieldRendererProps): JSX.Element {
  const groupId = field.key;
  const errorId = error ? `${groupId}-error` : undefined;
  const helpId = field.help ? `${groupId}-help` : undefined;
  const current = Array.isArray(value) ? (value as ReadonlyArray<string>) : [];

  function handleChange(optValue: string, checked: boolean): void {
    const next = checked ? [...current, optValue] : current.filter((v) => v !== optValue);
    onChange(next);
  }

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
      <div className="mt-2 space-y-2">
        {field.options?.map((opt) => (
          <label key={opt.value} className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              name={groupId}
              value={opt.value}
              checked={current.includes(opt.value)}
              aria-describedby={errorId}
              onChange={(e) => handleChange(opt.value, e.target.checked)}
              onBlur={onBlur}
              className="h-4 w-4 shrink-0 accent-primary"
            />
            <span className="text-base text-text">{opt.label}</span>
          </label>
        ))}
      </div>
      {error && <ValidationMessage id={errorId} message={error} />}
    </fieldset>
  );
}
