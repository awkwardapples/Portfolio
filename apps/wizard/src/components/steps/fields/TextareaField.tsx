import { cn } from '@/design/cn';
import { FieldGroup } from '@/components/composites';

import type { FieldRendererProps } from '../types';

export function TextareaField({
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
      <textarea
        id={id}
        rows={4}
        value={typeof value === 'string' ? value : ''}
        aria-required={field.required || undefined}
        aria-invalid={error !== undefined ? true : undefined}
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={cn(
          'w-full rounded border bg-surface p-3 text-base text-text',
          'placeholder:text-text-subtle transition-colors resize-y',
          error ? 'border-danger' : 'border-border-strong',
        )}
      />
    </FieldGroup>
  );
}
