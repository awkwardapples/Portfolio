import { cn } from '@/design/cn';
import { FieldGroup } from '@/components/composites';

import type { FieldRendererProps } from '../types';

export function SelectField({
  field,
  value,
  error,
  onChange,
  onBlur,
}: FieldRendererProps): JSX.Element {
  const id = field.key;
  const describedBy =
    [field.help ? `${id}-help` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') ||
    undefined;

  return (
    <FieldGroup
      id={id}
      label={field.label}
      help={field.help}
      error={error}
      required={field.required}
    >
      <select
        id={id}
        value={typeof value === 'string' ? value : ''}
        aria-required={field.required || undefined}
        aria-invalid={error !== undefined ? true : undefined}
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={cn(
          'h-10 w-full rounded border bg-surface px-3 text-base text-text',
          'transition-colors',
          error ? 'border-danger' : 'border-border-strong',
        )}
      >
        <option value="">Choose an option</option>
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldGroup>
  );
}
